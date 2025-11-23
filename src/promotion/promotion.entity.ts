import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export enum PromotionDiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity({ name: 'promotions' })
@Index(['code'], { unique: true })
export class Promotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  code: string;

  @Column({ type: 'simple-array', nullable: true })
  eligibleCategories?: string[];

  @Column({ type: 'simple-array', nullable: true })
  eligibleItems?: string[];

  @Column({ type: 'enum', enum: PromotionDiscountType })
  discountType: PromotionDiscountType;

  @Column({ type: 'float' })
  discountValue: number;

  @Column({ type: 'timestamp' })
  expirationDate: Date;

  @Column({ type: 'int', default: 0 })
  usageLimit: number;
}
