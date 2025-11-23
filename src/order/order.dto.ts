import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @IsArray()
  @IsString({ each: true })
  products: string[];

  @IsNumber()
  @Min(1)
  orderValue: number;

  @IsOptional()
  @IsString()
  voucherCode?: string;

  @IsOptional()
  @IsString()
  promotionCode?: string;
}
