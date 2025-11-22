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
  @IsOptional()
  @IsString()
  code: string;

  @IsString()
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsDateString()
  expirationDate: string;

  @IsNumber()
  @Min(1)
  usageLimit: number;

  @IsOptional()
  @IsNumber()
  minOrderValue?: number;
}

export class UpdateVoucherDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  minOrderValue?: number;
}
