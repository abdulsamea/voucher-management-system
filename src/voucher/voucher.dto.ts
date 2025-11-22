import {
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  code: string;

  @IsString()
  @IsEnum(['percentage', 'fixed'])
  discountType: 'percentage' | 'fixed';

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
  @IsEnum(['percentage', 'fixed'])
  discountType?: 'percentage' | 'fixed';

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
