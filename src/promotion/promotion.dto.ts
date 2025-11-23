import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { PromotionDiscountType } from './promotion.entity';

export class CreatePromotionDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsArray()
  eligibleCategories?: string[];

  @IsOptional()
  @IsArray()
  eligibleItems?: string[];

  @IsEnum(PromotionDiscountType)
  discountType: PromotionDiscountType;

  @IsNumber()
  @Min(1)
  discountValue: number;

  @IsDateString()
  expirationDate: string;

  @IsNumber()
  @Min(0)
  usageLimit: number;
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsArray()
  eligibleCategories?: string[];

  @IsOptional()
  @IsArray()
  eligibleItems?: string[];

  @IsOptional()
  @IsEnum(PromotionDiscountType)
  discountType?: PromotionDiscountType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  discountValue?: number;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usageLimit?: number;
}
