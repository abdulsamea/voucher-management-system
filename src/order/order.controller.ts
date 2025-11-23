import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';

import { OrderService } from './order.service';
import { CreateOrderDto } from './order.dto';
import { Order } from './order.entity';

@ApiTags('Orders')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new order',
    description:
      'Creates an order and applies voucher/promotion rules, validates expiry, usage limits, eligibility, and enforces max 50% discount.',
  })
  @ApiCreatedResponse({
    description: 'Order created successfully.',
    type: Order,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid voucher/promotion, expired code, usage exceeded, or validation error.',
  })
  async create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.orderService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Fetch all orders',
    description: 'Returns all orders along with voucher & promotion entities.',
  })
  @ApiOkResponse({
    description: 'List of all orders returned successfully.',
    type: [Order],
  })
  async findAll(): Promise<Order[]> {
    return this.orderService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order by ID',
    description:
      'Returns a specific order including its related voucher/promotion data.',
  })
  @ApiOkResponse({
    description: 'Order found.',
    type: Order,
  })
  @ApiNotFoundResponse({
    description: 'Order not found.',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.orderService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an order by ID',
  })
  @ApiNoContentResponse({
    description: 'Order deleted successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Order not found.',
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.orderService.delete(id);
  }
}
