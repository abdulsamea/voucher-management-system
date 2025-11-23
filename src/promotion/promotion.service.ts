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

  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    const code =
      createPromotionDto.code?.trim() ||
      PROMOTION_PREFIX + randomstring.generate(8).toUpperCase();

    const expiration = new Date(createPromotionDto.expirationDate);
    if (isNaN(expiration.getTime())) {
      throw new BadRequestException(
        'Invalid expiration date for this promotion.',
      );
    }
    if (expiration <= new Date()) {
      throw new BadRequestException(
        'Expiration date must be a future date for this promotion.',
      );
    }

    if (
      typeof createPromotionDto.usageLimit !== 'number' ||
      createPromotionDto.usageLimit <= 0
    ) {
      throw new BadRequestException(
        'Usage limit must be greater than zero for this promotion.',
      );
    }

    if (createPromotionDto.discountValue <= 0) {
      throw new BadRequestException(
        'Discount value must be positive for this promotion.',
      );
    }

    if (createPromotionDto.discountType === 'percentage') {
      if (
        createPromotionDto.discountValue < 1 ||
        createPromotionDto.discountValue > 100
      ) {
        throw new BadRequestException(
          'Percentage discount must be between 1 and 100.',
        );
      }
    }

    const promotion = this.promotionRepo.create({
      code,
      eligibleCategories: createPromotionDto.eligibleCategories,
      eligibleItems: createPromotionDto.eligibleItems,
      discountType: createPromotionDto.discountType,
      discountValue: createPromotionDto.discountValue,
      expirationDate: expiration,
      usageLimit: createPromotionDto.usageLimit,
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

  async update(code: string, dto: UpdatePromotionDto): Promise<Promotion> {
    const trimmedCode = code.trim();
    const promo = await this.promotionRepo.findOne({
      where: { code: trimmedCode },
    });

    if (!promo) {
      throw new NotFoundException('Promotion not found');
    }

    if (dto.eligibleCategories !== undefined) {
      promo.eligibleCategories = dto.eligibleCategories;
    }

    if (dto.eligibleItems !== undefined) {
      promo.eligibleItems = dto.eligibleItems;
    }

    if (dto.discountType !== undefined) {
      if (
        dto.discountType !== PromotionDiscountType.PERCENTAGE &&
        dto.discountType !== PromotionDiscountType.FIXED
      ) {
        throw new BadRequestException(
          `Promotion discount type must be either 'percentage' or 'fixed' for this promotion to be updated.`,
        );
      }
      promo.discountType = dto.discountType;
    }

    if (dto.usageLimit !== undefined) {
      if (dto.usageLimit <= 0) {
        throw new BadRequestException(
          'Usage limit must be greater than zero for this promotion to be updated.',
        );
      }
      promo.usageLimit = dto.usageLimit;
    }

    if (dto.discountValue !== undefined) {
      const value = dto.discountValue;

      if (value <= 0) {
        throw new BadRequestException(
          'Discount value must be positive for this promotion to be updated.',
        );
      }

      const updatedType = dto.discountType ?? promo.discountType;

      // Percentage validation
      if (updatedType === PromotionDiscountType.PERCENTAGE) {
        if (value < 1 || value > 100) {
          throw new BadRequestException(
            'Percentage discount must be between 1 and 100 for this promotion to be updated.',
          );
        }
      }

      // Fixed validation
      if (updatedType === PromotionDiscountType.FIXED) {
        if (value < 1) {
          throw new BadRequestException(
            'Fixed discount must be greater than zero for this promotion to be updated.',
          );
        }
      }

      promo.discountValue = value;
    }

    if (dto.expirationDate !== undefined) {
      const exp = new Date(dto.expirationDate);

      if (isNaN(exp.getTime())) {
        throw new BadRequestException(
          'Invalid expiration date for this promotion.',
        );
      }

      if (exp <= new Date()) {
        throw new BadRequestException(
          'Expiration date must be a future date for this promotion to be updated.',
        );
      }

      promo.expirationDate = exp;
    }

    return this.promotionRepo.save(promo);
  }

  async delete(id: number): Promise<Promotion> {
    const promo = await this.findOne(id);

    try {
      const deleted = await this.promotionRepo.remove(promo);
      return deleted;
    } catch (err: any) {
      throw new BadRequestException(
        'Cannot remove promotion — it may be currently in use by existing orders.',
      );
    }
  }
}
