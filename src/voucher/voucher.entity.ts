import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity({ name: 'vouchers' })
@Index(['code'], { unique: true })
export class Voucher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  code: string;

  @Column({ type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  @Column({ type: 'float' })
  discountValue: number;

  @Column({ type: 'timestamp' })
  expirationDate: Date;

  @Column({ type: 'int', default: 0 })
  usageLimit: number;

  @Column({ type: 'float', nullable: true })
  minOrderValue?: number | null;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  // TODO: add types orders list
  @OneToMany('Order', 'voucher', { eager: false })
  orders?: any[];
}
