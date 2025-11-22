import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Voucher } from './voucher/voucher.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Voucher],
  migrations: ['src/migrations/*.ts'],
});
