import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionDiscountType } from './promotion.entity';

export class CreatePromotionDto {
  @ApiPropertyOptional({
    description:
      'Promotion code (optional). If omitted, a code will be auto-generated.',
    example: 'PROMO123',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'List of eligible product SKUs.',
    type: [String],
    example: ['SKU1', 'SKU2'],
  })
  @IsOptional()
  @IsArray()
  eligibleSkus?: string[];

  @ApiProperty({
    description: 'Type of discount: percentage or fixed.',
    enum: PromotionDiscountType,
    example: PromotionDiscountType.PERCENTAGE,
  })
  @IsEnum(PromotionDiscountType)
  discountType: PromotionDiscountType;

  @ApiProperty({
    description: 'Discount value. Must be greater than or equal to 1.',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  discountValue: number;

  @ApiProperty({
    description: 'Expiration date in ISO format (must be a future date).',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsDateString()
  expirationDate: string;

  @ApiProperty({
    description: 'Maximum number of uses allowed for this promotion.',
    example: 100,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  usageLimit: number;
}

export class UpdatePromotionDto {
  @ApiPropertyOptional({
    description: 'Updated eligible product SKUs.',
    type: [String],
    example: ['SKU1', 'SKU2'],
  })
  @IsOptional()
  @IsArray()
  eligibleSkus?: string[];

  @ApiPropertyOptional({
    description: 'Updated discount type.',
    enum: PromotionDiscountType,
    example: PromotionDiscountType.FIXED,
  })
  @IsOptional()
  @IsEnum(PromotionDiscountType)
  discountType?: PromotionDiscountType;

  @ApiPropertyOptional({
    description: 'Updated discount value.',
    example: 25,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  discountValue?: number;

  @ApiPropertyOptional({
    description: 'Updated expiration date in ISO format.',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({
    description: 'Updated usage limit.',
    example: 50,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usageLimit?: number;
}
