import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    type: [String],
    description: 'List of product IDs or names included in the order',
    example: ['P001', 'P002'],
  })
  @IsArray()
  @IsString({ each: true })
  products: string[];

  @ApiProperty({
    type: Number,
    description: 'Total value of the order before discounts',
    example: 250,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  orderValue: number;

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
