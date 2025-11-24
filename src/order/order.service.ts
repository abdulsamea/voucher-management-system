import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

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
    private dataSource: DataSource,
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

  async create(createOrderdto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      let discountApplied = 0;
      let voucher: Voucher | null = null;
      let promotion: Promotion | null = null;
      let isVoucherCodeValidated: boolean = false;
      let isPromotionCodeValidated: boolean = false;

      const products = createOrderdto.products;

      const orderValue = products.reduce((sum, p) => sum + p.price, 0);

      // apply voucher validations if applicable.
      if (createOrderdto.voucherCode) {
        voucher = await manager.getRepository(Voucher).findOne({
          where: { code: createOrderdto.voucherCode },
        });
        if (!voucher) throw new NotFoundException('Voucher not found');

        this.validateExpiry(voucher.expirationDate);
        this.validateUsageLimit(voucher);

        if (voucher.minOrderValue && orderValue < voucher.minOrderValue) {
          throw new BadRequestException(
            `Minimum order value must be ${voucher.minOrderValue} to apply this voucher.`,
          );
        }

        discountApplied +=
          voucher.discountType === 'percentage'
            ? (orderValue * voucher.discountValue) / 100
            : voucher.discountValue;

        isVoucherCodeValidated = true;
        voucher.usageLimit -= 1;
      }

      // apply promotion validations if applicable.
      if (createOrderdto.promotionCode) {
        promotion = await manager.getRepository(Promotion).findOne({
          where: { code: createOrderdto.promotionCode },
        });
        if (!promotion) throw new NotFoundException('Promotion not found');

        this.validateExpiry(promotion.expirationDate);
        this.validateUsageLimit(promotion);

        if (voucher && voucher.code === promotion.code) {
          throw new BadRequestException('Voucher and Promotion cannot be same');
        }

        if (!promotion.eligibleSkus || promotion.eligibleSkus.length === 0) {
          throw new BadRequestException(
            'Promotion cannot be applied because it does not define eligible SKUs',
          );
        }

        const eligibleIndex = products.findIndex((p) =>
          promotion!.eligibleSkus!.includes(p.sku),
        );
        if (eligibleIndex === -1) {
          throw new BadRequestException(
            'Promotion not applicable to any product in this order',
          );
        }

        const eligibleProduct = products[eligibleIndex];
        discountApplied +=
          promotion.discountType === 'percentage'
            ? (eligibleProduct.price * promotion.discountValue) / 100
            : promotion.discountValue;

        isPromotionCodeValidated = true;
        promotion.usageLimit -= 1;
      }

      const maxAllowed = orderValue * 0.5;
      if (discountApplied > maxAllowed) {
        discountApplied = maxAllowed;
      }

      const order = manager.getRepository(Order).create({
        products,
        discountApplied,
        voucher,
        promotion,
      });

      // only update usage limits of voucher and promotions if order is created and after all validations.
      if (voucher && isVoucherCodeValidated) {
        await manager.getRepository(Voucher).save(voucher);
      }
      if (promotion && isPromotionCodeValidated) {
        await manager.getRepository(Promotion).save(promotion);
      }
      return manager.getRepository(Order).save(order);
    });
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
