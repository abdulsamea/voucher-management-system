import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion, PromotionDiscountType } from './promotion.entity';
import { CreatePromotionDto, UpdatePromotionDto } from './promotion.dto';
import randomstring from 'randomstring';

const PROMOTION_PREFIX = 'PMT';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private promotionRepo: Repository<Promotion>,
  ) {}

  private validateExpiration(expiration: string | Date): Date {
    const exp = new Date(expiration);
    if (isNaN(exp.getTime())) {
      throw new BadRequestException(
        'Invalid expiration date for this promotion.',
      );
    }
    if (exp <= new Date()) {
      throw new BadRequestException(
        'Expiration date must be a future date for this promotion.',
      );
    }
    return exp;
  }

  private validateDiscount(
    type: PromotionDiscountType,
    discount: number,
  ): number {
    if (discount <= 0) {
      throw new BadRequestException(
        'Discount value must be positive for this promotion.',
      );
    }

    if (type === PromotionDiscountType.PERCENTAGE) {
      if (discount < 1 || discount > 100) {
        throw new BadRequestException(
          'Percentage discount must be between 1 and 100.',
        );
      }
    }

    if (type === PromotionDiscountType.FIXED) {
      if (discount < 1) {
        throw new BadRequestException(
          'Fixed discount must be greater than zero.',
        );
      }
    }

    return discount;
  }

  private validateUsageLimit(limit: number | undefined): number {
    if (typeof limit !== 'number' || limit <= 0) {
      throw new BadRequestException(
        'Usage limit must be greater than zero for this promotion.',
      );
    }
    return limit;
  }

  private validateDiscountType(
    type: string | undefined,
  ): PromotionDiscountType | undefined {
    if (
      type !== undefined &&
      type !== PromotionDiscountType.PERCENTAGE &&
      type !== PromotionDiscountType.FIXED
    ) {
      throw new BadRequestException(
        `Promotion discount type must be either '${PromotionDiscountType.PERCENTAGE}' or '${PromotionDiscountType.FIXED}'.`,
      );
    }
    return type as PromotionDiscountType;
  }

  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    const code =
      createPromotionDto.code?.trim() ||
      PROMOTION_PREFIX + randomstring.generate(8).toUpperCase();

    const expiration = this.validateExpiration(
      createPromotionDto.expirationDate,
    );
    const discountType =
      this.validateDiscountType(createPromotionDto.discountType) ??
      createPromotionDto.discountType;
    const discountValue = this.validateDiscount(
      discountType,
      createPromotionDto.discountValue,
    );
    const usageLimit = this.validateUsageLimit(createPromotionDto.usageLimit);

    const promotion = this.promotionRepo.create({
      code,
      eligibleSkus: createPromotionDto.eligibleSkus,
      discountType,
      discountValue,
      expirationDate: expiration,
      usageLimit,
    });

    try {
      return await this.promotionRepo.save(promotion);
    } catch (err: any) {
      if (err.code === '23505') {
        throw new BadRequestException('Promotion code already exists');
      }
      throw err;
    }
  }

  async findAll(): Promise<Promotion[]> {
    return this.promotionRepo.find({
      order: { id: 'DESC' },
      take: 100,
    });
  }

  async findOne(id: number): Promise<Promotion> {
    const promo = await this.promotionRepo.findOne({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found.');
    return promo;
  }

  async update(
    code: string,
    updatePromotionDto: UpdatePromotionDto,
  ): Promise<Promotion> {
    const trimmedCode = code.trim();
    const promo = await this.promotionRepo.findOne({
      where: { code: trimmedCode },
    });

    if (!promo) {
      throw new NotFoundException('Promotion not found');
    }

    if (updatePromotionDto.eligibleSkus !== undefined) {
      promo.eligibleSkus = updatePromotionDto.eligibleSkus;
    }

    if (updatePromotionDto.discountType !== undefined) {
      promo.discountType = this.validateDiscountType(
        updatePromotionDto.discountType,
      )!;
    }

    if (updatePromotionDto.usageLimit !== undefined) {
      promo.usageLimit = this.validateUsageLimit(updatePromotionDto.usageLimit);
    }

    if (updatePromotionDto.discountValue !== undefined) {
      const updatedType = updatePromotionDto.discountType ?? promo.discountType;
      const updatedDiscount = this.validateDiscount(
        updatedType,
        updatePromotionDto.discountValue,
      );
      promo.discountType = updatedType;
      promo.discountValue = updatedDiscount;
    }

    if (updatePromotionDto.expirationDate !== undefined) {
      promo.expirationDate = this.validateExpiration(
        updatePromotionDto.expirationDate,
      );
    }

    return this.promotionRepo.save(promo);
  }

  async delete(id: number): Promise<Promotion> {
    const promo = await this.findOne(id);
    try {
      return await this.promotionRepo.remove(promo);
    } catch {
      throw new BadRequestException(
        'Cannot remove promotion — it may be currently in use by existing orders.',
      );
    }
  }
}
