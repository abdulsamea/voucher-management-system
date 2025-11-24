import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher, VoucherDiscountType } from './voucher.entity';
import { CreateVoucherDto, UpdateVoucherDto } from './voucher.dto';
import randomstring from 'randomstring';

const VOUCHER_PREFIX = 'VHR';

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Voucher)
    private voucherRepo: Repository<Voucher>,
  ) {}

  private validateExpiration(expirationDate: string | Date) {
    const exp = new Date(expirationDate);
    if (isNaN(exp.getTime())) {
      throw new BadRequestException('Invalid expiration date.');
    }
    if (exp <= new Date()) {
      throw new BadRequestException('Expiration date must be a future date.');
    }
    return exp;
  }

  private validateVoucherType(voucherType: string) {
    if (
      voucherType !== VoucherDiscountType.FIXED &&
      voucherType !== VoucherDiscountType.PERCENTAGE
    ) {
      throw new BadRequestException(
        `Voucher type must be either ${VoucherDiscountType.FIXED} or ${VoucherDiscountType.PERCENTAGE}`,
      );
    }
  }

  private validateUsageLimit(limit: number) {
    if (typeof limit !== 'number' || limit <= 0) {
      throw new BadRequestException('Usage limit must be greater than zero.');
    }
  }

  private validateMinOrderValue(value: number | undefined) {
    if (typeof value === 'number' && value < 0) {
      throw new BadRequestException('Minimum order value cannot be negative.');
    }
  }

  private validateDiscount(
    type: VoucherDiscountType,
    value: number,
    minOrderValue: number | null | undefined,
  ) {
    if (value <= 0) {
      throw new BadRequestException('Discount value must be positive.');
    }

    if (type === VoucherDiscountType.PERCENTAGE) {
      if (value < 1 || value > 100) {
        throw new BadRequestException(
          'Percentage discount must be between 1 and 100.',
        );
      }
    }

    if (type === VoucherDiscountType.FIXED) {
      if (typeof minOrderValue === 'number' && value > minOrderValue) {
        throw new BadRequestException(
          `Fixed discount should be smaller than minimum order value (${minOrderValue}).`,
        );
      }
    }
  }

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    this.validateVoucherType(createVoucherDto.discountType);
    const expirationDate = this.validateExpiration(
      createVoucherDto.expirationDate,
    );
    this.validateMinOrderValue(createVoucherDto.minOrderValue);
    this.validateUsageLimit(createVoucherDto.usageLimit);
    this.validateDiscount(
      createVoucherDto.discountType,
      createVoucherDto.discountValue,
      createVoucherDto.minOrderValue,
    );

    const code =
      createVoucherDto.code?.trim() ||
      VOUCHER_PREFIX + randomstring.generate(8).toUpperCase();

    const voucher = this.voucherRepo.create({
      code,
      discountType: createVoucherDto.discountType,
      discountValue: createVoucherDto.discountValue,
      expirationDate,
      usageLimit: createVoucherDto.usageLimit,
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
    if (!voucher) throw new NotFoundException('Voucher not found.');
    return voucher;
  }

  async update(
    code: string,
    updateVoucherDto: UpdateVoucherDto,
  ): Promise<Voucher> {
    const voucher = await this.voucherRepo.findOne({
      where: { code: code.trim() },
    });
    if (!voucher) throw new NotFoundException('Voucher not found');

    const updatedType = updateVoucherDto.discountType ?? voucher.discountType;
    this.validateVoucherType(updatedType);

    const updatedMinOrder =
      updateVoucherDto.minOrderValue ?? voucher.minOrderValue;
    const updatedDiscount =
      updateVoucherDto.discountValue ?? voucher.discountValue;

    if (updateVoucherDto.expirationDate !== undefined) {
      voucher.expirationDate = this.validateExpiration(
        updateVoucherDto.expirationDate,
      );
    }

    if (updateVoucherDto.usageLimit !== undefined) {
      this.validateUsageLimit(updateVoucherDto.usageLimit);
      voucher.usageLimit = updateVoucherDto.usageLimit;
    }

    if (updateVoucherDto.minOrderValue !== undefined) {
      this.validateMinOrderValue(updateVoucherDto.minOrderValue);
      voucher.minOrderValue = updateVoucherDto.minOrderValue;
    }

    if (
      updateVoucherDto.discountValue !== undefined ||
      updateVoucherDto.discountType !== undefined
    ) {
      this.validateDiscount(updatedType, updatedDiscount, updatedMinOrder);
      voucher.discountType = updatedType;
      voucher.discountValue = updatedDiscount;
    }

    return this.voucherRepo.save(voucher);
  }

  async delete(id: number): Promise<Voucher> {
    const voucher = await this.findOne(id);

    try {
      return await this.voucherRepo.remove(voucher);
    } catch {
      throw new BadRequestException(
        'Cannot remove voucher — it may be currently in use by existing orders.',
      );
    }
  }
}
