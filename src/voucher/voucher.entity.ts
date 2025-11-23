import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export enum VoucherDiscountType {
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

  @Column({ type: 'enum', enum: VoucherDiscountType })
  discountType: VoucherDiscountType;

  @Column({ type: 'float' })
  discountValue: number;

  @Column({ type: 'timestamp' })
  expirationDate: Date;

  @Column({ type: 'int', default: 1 })
  usageLimit: number;

  @Column({ type: 'float', nullable: true })
  minOrderValue?: number | null;
}
