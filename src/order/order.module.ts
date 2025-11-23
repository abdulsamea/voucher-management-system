import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from 'src/promotion/promotion.entity';
import { Voucher } from 'src/voucher/voucher.entity';
import { Order } from './order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Voucher, Promotion])],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
