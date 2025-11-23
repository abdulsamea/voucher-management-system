import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Voucher } from './voucher/voucher.entity';
import { Promotion } from './promotion/promotion.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Voucher, Promotion],
  migrations: ['src/migrations/*.ts'],
});
