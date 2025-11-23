import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { VoucherDiscountType } from './voucher.entity';

export class CreateVoucherDto {
  @ApiPropertyOptional({
    description:
      'Voucher code (optional). If not provided, the system will auto-generate a unique voucher code.',
    example: 'VOUCH123',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'Type of discount applied by this voucher.',
    enum: VoucherDiscountType,
    example: VoucherDiscountType.PERCENTAGE,
  })
  @IsEnum(VoucherDiscountType)
  discountType: VoucherDiscountType;

  @ApiProperty({
    description:
      'Discount value. Must be positive. For percentage vouchers, value must be between 1 and 100.',
    example: 10,
  })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({
    description: 'Expiration date in ISO format. Must be a future date.',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsDateString()
  expirationDate: string;

  @ApiProperty({
    description: 'Maximum number of times this voucher can be used.',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  usageLimit: number;

  @ApiPropertyOptional({
    description: 'Minimum order value required to apply this voucher.',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  minOrderValue?: number;
}

export class UpdateVoucherDto {
  @ApiPropertyOptional({
    description: 'Updated discount type.',
    enum: VoucherDiscountType,
  })
  @IsOptional()
  @IsEnum(VoucherDiscountType)
  discountType?: VoucherDiscountType;

  @ApiPropertyOptional({
    description:
      'Updated discount value. Must remain positive. For percentage vouchers, must remain between 1 and 100.',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({
    description: 'Updated expiration date in ISO format.',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({
    description: 'Updated usage limit.',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({
    description: 'Updated minimum order value.',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  minOrderValue?: number;
}
