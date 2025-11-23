import { Test, TestingModule } from '@nestjs/testing';
import { PromotionService } from './promotion.service';
import { Promotion, PromotionDiscountType } from './promotion.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPromotion: Promotion = {
  id: 1,
  code: 'PROMO123',
  eligibleCategories: ['electronics'],
  eligibleItems: ['ITEM123'],
  discountType: PromotionDiscountType.PERCENTAGE,
  discountValue: 10,
  expirationDate: new Date(Date.now() + 86400000),
  usageLimit: 50,
};

describe('PromotionService', () => {
  let service: PromotionService;
  let repo: jest.Mocked<Repository<Promotion>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionService,
        {
          provide: getRepositoryToken(Promotion),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PromotionService>(PromotionService);
    repo = module.get(getRepositoryToken(Promotion));
  });

  it('should create promotion successfully', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue(mockPromotion);
    repo.save.mockResolvedValue(mockPromotion);

    const result = await service.create({
      discountType: PromotionDiscountType.PERCENTAGE,
      discountValue: 10,
      expirationDate: new Date(Date.now() + 86400000).toISOString(),
      usageLimit: 100,
    });

    expect(result).toEqual(mockPromotion);
  });

  it('should throw if code already exists', async () => {
    repo.findOne.mockResolvedValue(mockPromotion);

    await expect(
      service.create({
        code: 'PROMO123',
        discountType: PromotionDiscountType.FIXED,
        discountValue: 20,
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
        usageLimit: 10,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject expired expirationDate', async () => {
    await expect(
      service.create({
        discountType: PromotionDiscountType.FIXED,
        discountValue: 10,
        expirationDate: new Date(Date.now() - 10000).toISOString(),
        usageLimit: 100,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should return all promotions', async () => {
    repo.find.mockResolvedValue([mockPromotion]);

    const result = await service.findAll();

    expect(result).toEqual([mockPromotion]);
  });

  it('should find one promotion', async () => {
    repo.findOne.mockResolvedValue(mockPromotion);

    expect(await service.findOne(1)).toEqual(mockPromotion);
  });

  it('should throw if promotion not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should update promotion by code', async () => {
    repo.findOne.mockResolvedValue(mockPromotion);
    repo.save.mockResolvedValue(mockPromotion);

    const result = await service.update('PROMO123', { discountValue: 15 });

    expect(result.discountValue).toBe(15);
  });

  it('should throw if updating non-existing promotion', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.update('UNKNOWN', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delete promotion', async () => {
    repo.findOne.mockResolvedValue(mockPromotion);
    repo.remove.mockResolvedValue(mockPromotion);

    const result = await service.delete(1);
    expect(result).toEqual(mockPromotion);
  });

  it('should throw if delete fails', async () => {
    repo.findOne.mockResolvedValue(mockPromotion);
    repo.remove.mockRejectedValue(new Error('db error'));

    await expect(service.delete(1)).rejects.toThrow(BadRequestException);
  });
});
