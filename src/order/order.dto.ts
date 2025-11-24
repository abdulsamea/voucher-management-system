import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OrderProductDto {
  @ApiProperty({ example: 'ITEM001', description: 'Product SKU' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 199.99, description: 'Product price' })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateOrderDto {
  @ApiProperty({
    type: [OrderProductDto],
    description: 'List of products with SKU and price',
    example: [
      { sku: 'SKU1', price: 200 },
      { sku: 'SKU2', price: 150 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  products: OrderProductDto[];

  @ApiPropertyOptional({
    type: String,
    description: 'Voucher code applied to the order (optional)',
    example: 'WELCOME10',
  })
  @IsOptional()
  @IsString()
  voucherCode?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Promotion code applied to the order (optional)',
    example: 'FESTIVE20',
  })
  @IsOptional()
  @IsString()
  promotionCode?: string;
}
