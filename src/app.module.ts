import 'dotenv/config';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VoucherModule } from './voucher/voucher.module';
import { PromotionModule } from './promotion/promotion.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 1 minute in milliseconds
        limit: 50, // allow 50 requests per minute per IP
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
    }),
    VoucherModule,
    PromotionModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
