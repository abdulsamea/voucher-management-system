import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Voucher } from '../voucher/voucher.entity';
import { Promotion } from '../promotion/promotion.entity';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', array: true })
  products: string[];

  @Column('float')
  orderValue: number;

  @ManyToOne(() => Voucher, { nullable: true })
  @JoinColumn()
  voucher: Voucher | null;

  @ManyToOne(() => Promotion, { nullable: true })
  @JoinColumn()
  promotion: Promotion | null;

  @Column('float', { default: 0 })
  discountApplied: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
