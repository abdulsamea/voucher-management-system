import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from './order.entity';
import { CreateOrderDto } from './order.dto';
import { Voucher } from '../voucher/voucher.entity';
import { Promotion } from '../promotion/promotion.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Voucher) private voucherRepo: Repository<Voucher>,
    @InjectRepository(Promotion) private promoRepo: Repository<Promotion>,
  ) {}

  private parseJsonInput<T>(value: any, fieldName: string): T {
    if (Array.isArray(value) || typeof value === 'object') {
      return value as T; // already a JSON
    }
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        throw new BadRequestException(`Invalid JSON format for ${fieldName}`);
      }
    }
    throw new BadRequestException(`Invalid type for ${fieldName}`);
  }

  private validateExpiry(expirationDate: Date) {
    if (new Date(expirationDate) < new Date()) {
      throw new BadRequestException('Voucher/Promotion has expired');
    }
  }

  private validateUsageLimit(entity: Voucher | Promotion) {
    if (entity.usageLimit !== null && entity.usageLimit <= 0) {
      throw new BadRequestException('Usage limit exceeded');
    }
  }

  private validateEligibleProducts(
    orderProducts: string[],
    eligibleProducts?: string[],
  ) {
    if (!eligibleProducts || eligibleProducts.length === 0) return;

    const isEligible = orderProducts.some((p) => eligibleProducts.includes(p));
    if (!isEligible) {
      throw new BadRequestException(
        'Promotion not applicable to any product in this order',
      );
    }
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    let discountApplied = 0;
    let voucher: Voucher | null = null;
    let promotion: Promotion | null = null;

    // parse products safely
    const products = this.parseJsonInput<{ sku: string; price: number }[]>(
      dto.products,
      'products',
    );

    // compute order value from products
    const orderValue = products.reduce((sum, p) => sum + p.price, 0);

    // apply voucher
    if (dto.voucherCode) {
      voucher = await this.voucherRepo.findOne({
        where: { code: dto.voucherCode },
      });
      if (!voucher) throw new NotFoundException('Voucher not found');

      this.validateExpiry(voucher.expirationDate);
      this.validateUsageLimit(voucher);

      // enforce min order value rule
      if (voucher.minOrderValue && orderValue < voucher.minOrderValue) {
        throw new BadRequestException(
          `Minimum order value must be ${voucher.minOrderValue} to apply this voucher.`,
        );
      }

      // apply discount
      if (voucher.discountType === 'percentage') {
        discountApplied += (orderValue * voucher.discountValue) / 100;
      } else {
        discountApplied += voucher.discountValue;
      }

      voucher.usageLimit -= 1;
      await this.voucherRepo.save(voucher);
    }

    // apply promotion
    if (dto.promotionCode) {
      promotion = await this.promoRepo.findOne({
        where: { code: dto.promotionCode },
      });
      if (!promotion) throw new NotFoundException('Promotion not found');

      this.validateExpiry(promotion.expirationDate);
      this.validateUsageLimit(promotion);

      // ensure voucher & promotion code are not same
      if (voucher && voucher.code === promotion.code) {
        throw new BadRequestException('Voucher and Promotion cannot be same');
      }

      // ensure promotion has eligible items list defined
      if (!promotion.eligibleItems || promotion.eligibleItems.length === 0) {
        throw new BadRequestException(
          'Promotion cannot be applied because it does not define eligible items',
        );
      }

      // find first eligible product index (apply promotion only once)
      const eligibleIndex = products.findIndex((p) =>
        promotion!.eligibleItems!.includes(p.sku),
      );

      if (eligibleIndex === -1) {
        throw new BadRequestException(
          'Promotion not applicable to any product in this order',
        );
      }

      // only apply promotion on the FIRST eligible product
      const eligibleProduct = products[eligibleIndex];
      if (promotion.discountType === 'percentage') {
        discountApplied +=
          (eligibleProduct.price * promotion.discountValue) / 100;
      } else {
        discountApplied += promotion.discountValue;
      }

      promotion.usageLimit -= 1;
      await this.promoRepo.save(promotion);
    }

    // limit max discount to 50% (this is applied to overall order, not individual products)
    const maxAllowed = orderValue * 0.5;
    if (discountApplied > maxAllowed) {
      discountApplied = maxAllowed;
    }

    // save order
    const order = this.orderRepo.create({
      products,
      discountApplied,
      voucher,
      promotion,
    });

    return this.orderRepo.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: ['voucher', 'promotion'],
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['voucher', 'promotion'],
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async delete(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepo.remove(order);
  }
}
