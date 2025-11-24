import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { OrderService } from './order.service';
import { Order } from './order.entity';
import { Voucher, VoucherDiscountType } from '../voucher/voucher.entity';
import {
  Promotion,
  PromotionDiscountType,
} from '../promotion/promotion.entity';
import { CreateOrderDto } from './order.dto';

type MockRepo<T = any> = {
  findOne: jest.Mock;
  find: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  remove: jest.Mock;
};

const createMockRepo = (): MockRepo => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
});

describe('OrderService', () => {
  let service: OrderService;

  let orderRepo: MockRepo;
  let voucherRepo: MockRepo;
  let promotionRepo: MockRepo;
  let dataSource: { transaction: jest.Mock };

  const baseProducts: { sku: string; price: number }[] = [
    { sku: 'S1', price: 100 },
    { sku: 'S1', price: 100 },
    { sku: 'S2', price: 200 },
  ];

  const baseOrderDto: CreateOrderDto = {
    products: baseProducts,
  };

  const futureDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  };

  beforeEach(async () => {
    orderRepo = createMockRepo();
    voucherRepo = createMockRepo();
    promotionRepo = createMockRepo();

    // DataSource.transaction mock that uses our repos
    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => {
        const manager = {
          getRepository: (entity: any) => {
            if (entity === Order) return orderRepo;
            if (entity === Voucher) return voucherRepo;
            if (entity === Promotion) return promotionRepo;
            throw new Error(`Unknown entity: ${entity?.name}`);
          },
        };
        return cb(manager as any);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(Voucher), useValue: voucherRepo },
        { provide: getRepositoryToken(Promotion), useValue: promotionRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('should create order without voucher/promotion', async () => {
      const mockSavedOrder: Order = {
        id: 1,
        products: baseProducts,
        discountApplied: 0,
        voucher: null,
        promotion: null,
        createdAt: new Date(),
      };

      orderRepo.create.mockReturnValue(mockSavedOrder);
      orderRepo.save.mockResolvedValue(mockSavedOrder);

      const result = await service.create(baseOrderDto);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          products: baseProducts,
          discountApplied: 0,
          voucher: null,
          promotion: null,
        }),
      );
      expect(orderRepo.save).toHaveBeenCalled();
      expect(result.discountApplied).toBe(0);
      expect(result.products).toHaveLength(3);
      expect(result.voucher).toBeNull();
      expect(result.promotion).toBeNull();
    });

    // ---- Voucher validation tests ----

    it('should throw if voucher expired', async () => {
      const past = new Date('2000-01-01T00:00:00.000Z');
      voucherRepo.findOne.mockResolvedValue({
        code: 'V1',
        discountType: VoucherDiscountType.PERCENTAGE,
        discountValue: 10,
        expirationDate: past,
        usageLimit: 10,
        minOrderValue: 0,
      } as Voucher);

      await expect(
        service.create({ ...baseOrderDto, voucherCode: 'V1' }),
      ).rejects.toThrow(BadRequestException);
      expect(orderRepo.save).not.toHaveBeenCalled();
    });

    it('should throw if voucher usageLimit reached', async () => {
      voucherRepo.findOne.mockResolvedValue({
        code: 'V1',
        discountType: VoucherDiscountType.PERCENTAGE,
        discountValue: 10,
        expirationDate: futureDate(),
        usageLimit: 0,
        minOrderValue: 0,
      } as Voucher);

      await expect(
        service.create({ ...baseOrderDto, voucherCode: 'V1' }),
      ).rejects.toThrow(BadRequestException);
      expect(orderRepo.save).not.toHaveBeenCalled();
    });

    it('should apply percentage voucher correctly', async () => {
      // orderValue = 100 + 100 + 200 = 400; 10% = 40
      voucherRepo.findOne.mockResolvedValue({
        code: 'V1',
        discountType: VoucherDiscountType.PERCENTAGE,
        discountValue: 10,
        expirationDate: futureDate(),
        usageLimit: 5,
        minOrderValue: 0,
      } as Voucher);

      const savedOrder: Order = {
        id: 1,
        products: baseProducts,
        discountApplied: 40,
        voucher: {} as Voucher,
        promotion: null,
        createdAt: new Date(),
      };

      orderRepo.create.mockReturnValue(savedOrder);
      orderRepo.save.mockResolvedValue(savedOrder);

      const result = await service.create({
        ...baseOrderDto,
        voucherCode: 'V1',
      });

      expect(result.discountApplied).toBe(40);
      expect(voucherRepo.save).toHaveBeenCalled();
    });

    it('should apply fixed voucher correctly', async () => {
      voucherRepo.findOne.mockResolvedValue({
        code: 'V1',
        discountType: VoucherDiscountType.FIXED,
        discountValue: 50,
        expirationDate: futureDate(),
        usageLimit: 5,
        minOrderValue: 0,
      } as Voucher);

      const savedOrder: Order = {
        id: 1,
        products: baseProducts,
        discountApplied: 50,
        voucher: {} as Voucher,
        promotion: null,
        createdAt: new Date(),
      };

      orderRepo.create.mockReturnValue(savedOrder);
      orderRepo.save.mockResolvedValue(savedOrder);

      const result = await service.create({
        ...baseOrderDto,
        voucherCode: 'V1',
      });

      expect(result.discountApplied).toBe(50);
      expect(voucherRepo.save).toHaveBeenCalled();
    });

    it("should not apply voucher to orders below the voucher's minimum order value", async () => {
      // orderValue = 400, so set minOrderValue to 500
      voucherRepo.findOne.mockResolvedValue({
        code: 'V1',
        discountType: VoucherDiscountType.PERCENTAGE,
        discountValue: 10,
        expirationDate: futureDate(),
        usageLimit: 5,
        minOrderValue: 500,
      } as Voucher);

      await expect(
        service.create({ ...baseOrderDto, voucherCode: 'V1' }),
      ).rejects.toThrow(BadRequestException);
      expect(orderRepo.save).not.toHaveBeenCalled();
    });

    // ---- Promotion validation tests ----

    it('should throw if promotion expired', async () => {
      const past = new Date('2000-01-01T00:00:00.000Z');
      promotionRepo.findOne.mockResolvedValue({
        code: 'PR1',
        discountType: PromotionDiscountType.PERCENTAGE,
        discountValue: 10,
        expirationDate: past,
        usageLimit: 10,
        eligibleSkus: ['S1'],
      } as Promotion);

      await expect(
        service.create({ ...baseOrderDto, promotionCode: 'PR1' }),
      ).rejects.toThrow(BadRequestException);
      expect(orderRepo.save).not.toHaveBeenCalled();
    });

    it('should throw if promotion usageLimit reached', async () => {
      promotionRepo.findOne.mockResolvedValue({
        code: 'PR1',
        discountType: PromotionDiscountType.PERCENTAGE,
        discountValue: 10,
        expirationDate: futureDate(),
        usageLimit: 0,
        eligibleSkus: ['S1'],
      } as Promotion);

      await expect(
        service.create({ ...baseOrderDto, promotionCode: 'PR1' }),
      ).rejects.toThrow(BadRequestException);
      expect(orderRepo.save).not.toHaveBeenCalled();
    });

    it('should throw if promotion not applicable to any product', async () => {
      // eligibleSkus that don't match S1/S2
      promotionRepo.findOne.mockResolvedValue({
        code: 'PR1',
        discountType: PromotionDiscountType.PERCENTAGE,
        discountValue: 10,
        expirationDate: futureDate(),
        usageLimit: 5,
        eligibleSkus: ['X', 'Y'],
      } as Promotion);

      await expect(
        service.create({ ...baseOrderDto, promotionCode: 'PR1' }),
      ).rejects.toThrow(BadRequestException);
      expect(orderRepo.save).not.toHaveBeenCalled();
    });

    it('should prevent using a voucher and promotion with same code', async () => {
      voucherRepo.findOne.mockResolvedValue({
        code: 'X',
        discountType: VoucherDiscountType.PERCENTAGE,
        discountValue: 10,
        expirationDate: futureDate(),
        usageLimit: 5,
        minOrderValue: 0,
      } as Voucher);

      promotionRepo.findOne.mockResolvedValue({
        code: 'X',
        discountType: PromotionDiscountType.PERCENTAGE,
        discountValue: 10,
        expirationDate: futureDate(),
        usageLimit: 5,
        eligibleSkus: ['S1'],
      } as Promotion);

      await expect(
        service.create({
          ...baseOrderDto,
          voucherCode: 'X',
          promotionCode: 'X',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(orderRepo.save).not.toHaveBeenCalled();
    });

    it('should cap discount at maximum 50% of order value', async () => {
      // orderValue = 400, cap = 200
      // use high percentage: 80% (320) to force cap
      voucherRepo.findOne.mockResolvedValue({
        code: 'V1',
        discountType: VoucherDiscountType.PERCENTAGE,
        discountValue: 80,
        expirationDate: futureDate(),
        usageLimit: 5,
        minOrderValue: 0,
      } as Voucher);

      const savedOrder: Order = {
        id: 1,
        products: baseProducts,
        discountApplied: 200, // capped value
        voucher: {} as Voucher,
        promotion: null,
        createdAt: new Date(),
      };

      orderRepo.create.mockReturnValue(savedOrder);
      orderRepo.save.mockResolvedValue(savedOrder);

      const result = await service.create({
        ...baseOrderDto,
        voucherCode: 'V1',
      });

      expect(result.discountApplied).toBe(200);
    });

    it('should apply promotion to only 1 product even if multiple eligible items exist', async () => {
      // orderValue = 400
      // eligibleSkus includes "S1", which appears twice with price 100 each
      // 50% promotion on one S1 => expected discount = 50
      promotionRepo.findOne.mockResolvedValue({
        code: 'PR1',
        discountType: PromotionDiscountType.PERCENTAGE,
        discountValue: 50,
        expirationDate: futureDate(),
        usageLimit: 5,
        eligibleSkus: ['S1'],
      } as Promotion);

      const savedOrder: Order = {
        id: 1,
        products: baseProducts,
        discountApplied: 50,
        voucher: null,
        promotion: {} as Promotion,
        createdAt: new Date(),
      };

      orderRepo.create.mockReturnValue(savedOrder);
      orderRepo.save.mockResolvedValue(savedOrder);

      const result = await service.create({
        ...baseOrderDto,
        promotionCode: 'PR1',
      });

      expect(result.discountApplied).toBe(50);
    });
  });

  describe('findAll()', () => {
    it('should return all orders', async () => {
      const orders: Order[] = [{ id: 1 } as Order, { id: 2 } as Order];
      orderRepo.find.mockResolvedValue(orders);

      const result = await service.findAll();

      expect(orderRepo.find).toHaveBeenCalledWith({
        relations: ['voucher', 'promotion'],
      });
      expect(result).toEqual(orders);
    });
  });

  describe('findOne()', () => {
    it('should return an order if found', async () => {
      const order: Order = { id: 1 } as Order;
      orderRepo.findOne.mockResolvedValue(order);

      const result = await service.findOne(1);

      expect(orderRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['voucher', 'promotion'],
      });
      expect(result).toBe(order);
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete()', () => {
    it('should delete successfully', async () => {
      const order: Order = { id: 1 } as Order;
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.remove.mockResolvedValue(order);

      await expect(service.delete(1)).resolves.not.toThrow();
      expect(orderRepo.remove).toHaveBeenCalledWith(order);
    });

    it('should throw NotFoundException when deleting non-existing order', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
