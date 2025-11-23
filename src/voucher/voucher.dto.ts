import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { DiscountType } from './voucher.entity';

export class CreateVoucherDto {
  @ApiProperty({ example: 'VOUCH123', description: 'Voucher code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ enum: ['percentage', 'fixed'] })
  @IsString()
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({ example: '2025-12-31' })
  @IsDateString()
  expirationDate: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  usageLimit: number;

  @ApiProperty({ required: false, example: 50 })
  @IsOptional()
  @IsNumber()
  minOrderValue?: number;
}

export class UpdateVoucherDto {
  @ApiPropertyOptional({ enum: ['percentage', 'fixed'] })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  minOrderValue?: number;
}
