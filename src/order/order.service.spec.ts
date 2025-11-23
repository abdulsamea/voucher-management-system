import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { Voucher, VoucherDiscountType } from '../voucher/voucher.entity';
import {
  Promotion,
  PromotionDiscountType,
} from '../promotion/promotion.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './order.dto';

const mockRepo = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

const order: Order = {
  id: 0,
  products: ['p1', 'p2'],
  orderValue: 100,
  voucher: null,
  promotion: null,
  discountApplied: 0,
  createdAt: new Date(),
};

describe('OrderService', () => {
  let service: OrderService;
  let orderRepo: jest.Mocked<Repository<Order>>;
  let voucherRepo: jest.Mocked<Repository<Voucher>>;
  let promoRepo: jest.Mocked<Repository<Promotion>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useFactory: mockRepo },
        { provide: getRepositoryToken(Voucher), useFactory: mockRepo },
        { provide: getRepositoryToken(Promotion), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepo = module.get(getRepositoryToken(Order));
    voucherRepo = module.get(getRepositoryToken(Voucher));
    promoRepo = module.get(getRepositoryToken(Promotion));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create order without voucher/promotion', async () => {
      const updatedOrderData: CreateOrderDto = {
        ...order,
        voucherCode: undefined,
        promotionCode: undefined,
      };
      orderRepo.create.mockReturnValue(order);
      orderRepo.save.mockResolvedValue(order);

      const result = await service.create(order);
      expect(result).toEqual(updatedOrderData);
    });

    // below test cases handle voucher validation rules.
    it('should throw if voucher not found', async () => {
      voucherRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ ...order, voucherCode: 'ABC' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if voucher expired', async () => {
      voucherRepo.findOne.mockResolvedValue({
        expirationDate: new Date(Date.now() - 10000),
        usageLimit: 5,
      } as Voucher);

      await expect(
        service.create({ ...order, voucherCode: 'V1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if voucher usageLimit reached', async () => {
      voucherRepo.findOne.mockResolvedValue({
        expirationDate: new Date(Date.now() + 10000),
        usageLimit: 0,
      } as Voucher);

      await expect(
        service.create({ ...order, voucherCode: 'V1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should apply percentage voucher correctly', async () => {
      const voucher: Voucher = {
        id: 1,
        code: 'V1',
        expirationDate: new Date(Date.now() + 10000),
        usageLimit: 1,
        discountType: VoucherDiscountType.PERCENTAGE,
        discountValue: 10,
      };

      voucherRepo.findOne.mockResolvedValue(voucher);

      voucherRepo.save.mockResolvedValue(voucher);
      orderRepo.create.mockReturnValue(order);
      orderRepo.save.mockResolvedValue(order);

      await service.create({ ...order, voucherCode: 'V1' } as any);

      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          discountApplied: 10, // 10% of 100
        }),
      );
    });

    it('should apply fixed voucher correctly', async () => {
      const voucher: Voucher = {
        id: 1,
        code: 'V1',
        expirationDate: new Date(Date.now() + 10000),
        usageLimit: 1,
        discountType: VoucherDiscountType.FIXED,
        discountValue: 25,
      };
      voucherRepo.findOne.mockResolvedValue(voucher);

      voucherRepo.save.mockResolvedValue(voucher);
      orderRepo.create.mockReturnValue(order);
      orderRepo.save.mockResolvedValue(order);

      await service.create({ ...order, voucherCode: 'V1' } as any);

      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ discountApplied: 25 }),
      );
    });

    // below test cases handle promotion validation rules.
    it('should throw if promotion not found', async () => {
      promoRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ ...order, promotionCode: 'PR1' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if promotion expired', async () => {
      promoRepo.findOne.mockResolvedValue({
        expirationDate: new Date(Date.now() - 10000),
        usageLimit: 5,
      } as Promotion);

      await expect(
        service.create({ ...order, promotionCode: 'PR1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if promotion usageLimit reached', async () => {
      promoRepo.findOne.mockResolvedValue({
        expirationDate: new Date(Date.now() + 10000),
        usageLimit: 0,
      } as Promotion);

      await expect(
        service.create({ ...order, promotionCode: 'PR1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if promotion not applicable to any product', async () => {
      const promotion: Promotion = {
        id: 1,
        code: 'PR2',
        discountType: PromotionDiscountType.FIXED,
        discountValue: 13,
        expirationDate: new Date(Date.now() + 10000),
        usageLimit: 2,
        eligibleItems: ['Z1', 'Z2'],
      };
      promoRepo.findOne.mockResolvedValue(promotion);

      await expect(
        service.create({ ...order, promotionCode: 'PR1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent using a voucher and promotion with same code', async () => {
      const voucher: Voucher = {
        id: 2,
        code: 'X',
        expirationDate: new Date(Date.now() + 10000),
        usageLimit: 2,
        discountType: VoucherDiscountType.FIXED,
        discountValue: 20,
      };

      const promotion: Promotion = {
        id: 1,
        code: 'X',
        discountType: PromotionDiscountType.FIXED,
        discountValue: 13,
        expirationDate: new Date(Date.now() + 10000),
        usageLimit: 2,
        eligibleItems: ['Z1', 'Z2'],
      };

      voucherRepo.findOne.mockResolvedValue(voucher);
      promoRepo.findOne.mockResolvedValue(promotion);

      await expect(
        service.create({
          ...order,
          voucherCode: 'X',
          promotionCode: 'X',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should cap discount at maximum 50% of order value', async () => {
      const voucher: Voucher = {
        id: 1,
        code: 'V1',
        expirationDate: new Date(Date.now() + 10000),
        usageLimit: 2,
        discountType: VoucherDiscountType.FIXED,
        discountValue: 60,
      };

      voucherRepo.findOne.mockResolvedValue(voucher);
      voucherRepo.save.mockResolvedValue(voucher);

      orderRepo.create.mockReturnValue(order);
      orderRepo.save.mockResolvedValue(order);

      await service.create({
        ...order,
        voucherCode: 'V1',
      } as any);

      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ discountApplied: 50 }), // capped at 50% of 100
      );
    });
  });

  describe('findAll()', () => {
    it('should return all orders', async () => {
      orderRepo.find.mockResolvedValue([{ id: 1 } as Order]);

      const result = await service.findAll();
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('findOne()', () => {
    it('should return order', async () => {
      orderRepo.findOne.mockResolvedValue({ id: 1 } as Order);

      const result = await service.findOne(1);
      expect(result).toEqual({ id: 1 });
    });

    it('should throw if order not found', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete()', () => {
    it('should delete successfully', async () => {
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.remove.mockResolvedValue(order);

      await expect(service.delete(1)).resolves.not.toThrow();
    });

    it('should throw if deleting non-existing order', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(1)).rejects.toThrow(NotFoundException);
    });
  });
});
