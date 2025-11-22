import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Voucher } from './voucher.entity';
import { CreateVoucherDto, UpdateVoucherDto } from './voucher.dto';
import { nanoid } from 'nanoid';

const VOUCHER_PREFIX = 'VHR';

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Voucher)
    private voucherRepo: Repository<Voucher>,
  ) {}

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    const code =
      createVoucherDto.code?.trim() || VOUCHER_PREFIX + nanoid(8).toUpperCase();

    const voucher = this.voucherRepo.create({
      code,
      discountType: createVoucherDto.discountType,
      discountValue: Math.max(0, createVoucherDto.discountValue),
      expirationDate: createVoucherDto.expirationDate,
      usageLimit: Math.max(0, createVoucherDto.usageLimit),
      minOrderValue: createVoucherDto.minOrderValue,
    });

    try {
      return await this.voucherRepo.save(voucher);
    } catch (err: any) {
      if (err.code === '23505') {
        throw new BadRequestException('Voucher code already exists');
      }
      throw err;
    }
  }

  async findAll(): Promise<Voucher[]> {
    return this.voucherRepo.find({
      order: { id: 'DESC' },
      take: 100,
    });
  }

  async findOne(id: number): Promise<Voucher> {
    const voucher = await this.voucherRepo.findOne({ where: { id } });
    if (!voucher) throw new NotFoundException('Voucher not found');
    return voucher;
  }

  async update(
    code: string,
    updateVoucherDto: UpdateVoucherDto,
  ): Promise<Voucher> {
    const trimmedVoucherCode = code.trim();
    const voucher = await this.voucherRepo.findOne({
      where: { code: trimmedVoucherCode },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    if (updateVoucherDto.discountType !== undefined) {
      if (
        updateVoucherDto.discountType !== 'percentage' &&
        updateVoucherDto.discountType !== 'fixed'
      ) {
        throw new BadRequestException(
          `Voucher discount type must be either 'percentage' or 'fixed' for this voucher to be updated.`,
        );
      }
      voucher.discountType = updateVoucherDto.discountType;
    }

    if (updateVoucherDto.usageLimit !== undefined) {
      if (updateVoucherDto.usageLimit <= 0) {
        throw new BadRequestException(
          'Usage limit must be greater than zero for this voucher to be updated.',
        );
      }
      voucher.usageLimit = updateVoucherDto.usageLimit;
    }

    if (updateVoucherDto.minOrderValue !== undefined) {
      if (updateVoucherDto.minOrderValue < 0) {
        throw new BadRequestException(
          'Minimum order value cannot be negative for this voucher to be updated.',
        );
      }
      voucher.minOrderValue = updateVoucherDto.minOrderValue;
    }

    if (updateVoucherDto.discountValue !== undefined) {
      const value = updateVoucherDto.discountValue;

      if (value <= 0) {
        throw new BadRequestException(
          'Discount value must be positive for this voucher to be updated.',
        );
      }

      const updatedDiscountType =
        updateVoucherDto.discountType ?? voucher.discountType;
      const updatedMinOrderValue =
        updateVoucherDto.minOrderValue ?? voucher.minOrderValue;

      // apply percentage voucher type rules
      if (updatedDiscountType === 'percentage') {
        if (value < 1 || value > 100) {
          throw new BadRequestException(
            'Percentage discount must be between 1 and 100 for this voucher to be updated.',
          );
        }
      }

      // apply fixed voucher type rules
      if (updatedDiscountType === 'fixed') {
        if (value < 1) {
          throw new BadRequestException(
            'Fixed discount must be greater than zero for this voucher to be updated.',
          );
        }
        //  only valid when min order value is present.
        if (
          typeof updatedMinOrderValue === 'number' &&
          value > updatedMinOrderValue
        ) {
          throw new BadRequestException(
            `Fixed discount should be smaller than minimum order value (${updatedMinOrderValue}) for this voucher to be updated.`,
          );
        }
      }

      voucher.discountValue = value;
    }

    if (updateVoucherDto.discountValue !== undefined) {
      voucher.discountValue = updateVoucherDto.discountValue;
    }

    if (updateVoucherDto.expirationDate !== undefined) {
      const exp = new Date(updateVoucherDto.expirationDate);

      if (isNaN(exp.getTime())) {
        throw new BadRequestException(
          'Invalid expiration date for this voucher to be updated.',
        );
      }

      if (exp <= new Date()) {
        throw new BadRequestException(
          'Expiration date must be a future date for this voucher to be updated.',
        );
      }

      voucher.expirationDate = exp;
    }

    return this.voucherRepo.save(voucher);
  }

  async delete(id: number): Promise<void> {
    const voucher = await this.findOne(id);

    try {
      await this.voucherRepo.remove(voucher);
    } catch (err: any) {
      throw new BadRequestException(
        'Cannot remove voucher — it may be currently in use by existing orders.',
      );
    }
  }
}
