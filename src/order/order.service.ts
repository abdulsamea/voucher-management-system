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

    const orderValue = dto.orderValue;

    // apply voucher to the order.
    if (dto.voucherCode) {
      voucher = await this.voucherRepo.findOne({
        where: { code: dto.voucherCode },
      });

      if (!voucher) throw new NotFoundException('Voucher not found');

      this.validateExpiry(voucher.expirationDate);
      this.validateUsageLimit(voucher);

      if (voucher.discountType === 'percentage') {
        discountApplied += (orderValue * voucher.discountValue) / 100;
      } else {
        discountApplied += voucher.discountValue;
      }

      voucher.usageLimit -= 1;
      await this.voucherRepo.save(voucher);
    }

    // apply promotion to the order.
    if (dto.promotionCode) {
      promotion = await this.promoRepo.findOne({
        where: { code: dto.promotionCode },
      });

      if (!promotion) throw new NotFoundException('Promotion not found');

      this.validateExpiry(promotion.expirationDate);
      this.validateUsageLimit(promotion);
      this.validateEligibleProducts(dto.products, promotion.eligibleItems);

      // prevent double use with voucher (only in case both are same).
      if (voucher && voucher.code === promotion.code) {
        throw new BadRequestException('Voucher and Promotion cannot be same');
      }

      if (promotion.discountType === 'percentage') {
        discountApplied += (orderValue * promotion.discountValue) / 100;
      } else {
        discountApplied += promotion.discountValue;
      }

      promotion.usageLimit -= 1;
      await this.promoRepo.save(promotion);
    }

    // handle max discount of 50%.
    const maxAllowed = orderValue * 0.5;
    if (discountApplied > maxAllowed) {
      discountApplied = maxAllowed;
    }

    const order = this.orderRepo.create({
      products: dto.products,
      orderValue,
      discountApplied,
      voucher: voucher,
      promotion: promotion,
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
