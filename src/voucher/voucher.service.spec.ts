import { Test, TestingModule } from '@nestjs/testing';
import { VoucherService } from './voucher.service';
import { Voucher, DiscountType } from './voucher.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateVoucherDto, UpdateVoucherDto } from './voucher.dto';

// Mock voucher entity used in multiple tests
const mockVoucher: Voucher = {
  id: 1,
  code: 'VHRABCDEFG8',
  discountType: 'percentage' as DiscountType,
  discountValue: 10,
  expirationDate: new Date(Date.now() + 5000000),
  usageLimit: 10,
  minOrderValue: 100,
};

describe('VoucherService', () => {
  let service: VoucherService;
  let repo: jest.Mocked<Repository<Voucher>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoucherService,
        {
          provide: getRepositoryToken(Voucher),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VoucherService>(VoucherService);
    repo = module.get(getRepositoryToken(Voucher));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create voucher with provided code', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(mockVoucher);
      repo.save.mockResolvedValue(mockVoucher);

      const dto: CreateVoucherDto = {
        code: mockVoucher.code,
        discountType: 'percentage' as DiscountType,
        discountValue: 10,
        expirationDate: mockVoucher.expirationDate.toISOString(),
        usageLimit: 10,
        minOrderValue: 100,
      };

      const result = await service.create(dto);

      expect(result.code).toBe(mockVoucher.code);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining(dto));
      expect(repo.save).toHaveBeenCalled();
    });

    it('should auto-generate code if not provided', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue({ ...mockVoucher });
      repo.save.mockResolvedValue({ ...mockVoucher, code: 'VHRABCDEFG8' });

      const dto = {
        discountType: 'percentage' as DiscountType,
        discountValue: 10,
        expirationDate: mockVoucher.expirationDate.toISOString(),
        usageLimit: 10,
      };

      const result = await service.create(dto);
      expect(result.code).toMatch(/^VHR[A-Z0-9]{8}$/);
    });

    it('should throw BadRequestException for duplicate code', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      repo.create.mockReturnValue(mockVoucher);
      repo.save.mockRejectedValue({ code: '23505' }); // unique violation

      await expect(
        service.create({
          code: mockVoucher.code,
          discountType: 'percentage' as DiscountType,
          discountValue: 10,
          expirationDate: mockVoucher.expirationDate.toISOString(),
          usageLimit: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll()', () => {
    it('should return ordered vouchers', async () => {
      repo.find.mockResolvedValue([mockVoucher]);
      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        order: { id: 'DESC' },
        take: 100,
      });
      expect(result).toEqual([mockVoucher]);
    });
  });

  describe('findOne()', () => {
    it('should return voucher when found', async () => {
      repo.findOne.mockResolvedValue(mockVoucher);
      const result = await service.findOne(1);
      expect(result).toBe(mockVoucher);
    });

    it('should throw NotFoundException for missing voucher', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should update voucher when code exists', async () => {
      const updated = { ...mockVoucher, discountValue: 20 };
      repo.findOne.mockResolvedValue(mockVoucher);
      repo.save.mockResolvedValue(updated);

      const dto: UpdateVoucherDto = { discountValue: 20 };
      const result = await service.update(mockVoucher.code, dto);

      expect(result.discountValue).toBe(20);
      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when voucher is missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.update('INVALID_CODE', { discountValue: 20 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw for invalid discountType', async () => {
      repo.findOne.mockResolvedValue(mockVoucher);
      await expect(
        service.update(mockVoucher.code, { discountType: 'INVALID' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for usageLimit <= 0', async () => {
      repo.findOne.mockResolvedValue(mockVoucher);
      await expect(
        service.update(mockVoucher.code, { usageLimit: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for negative minOrderValue', async () => {
      repo.findOne.mockResolvedValue(mockVoucher);
      await expect(
        service.update(mockVoucher.code, { minOrderValue: -1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for discountValue <= 0', async () => {
      repo.findOne.mockResolvedValue(mockVoucher);
      await expect(
        service.update(mockVoucher.code, { discountValue: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for percentage discount outside 1–100', async () => {
      repo.findOne.mockResolvedValue({
        ...mockVoucher,
        discountType: 'percentage' as DiscountType,
      });

      await expect(
        service.update(mockVoucher.code, { discountValue: 150 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.update(mockVoucher.code, { discountValue: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for fixed discount > minOrderValue', async () => {
      repo.findOne.mockResolvedValue({
        ...mockVoucher,
        discountType: 'fixed' as DiscountType,
        minOrderValue: 100,
      });

      await expect(
        service.update(mockVoucher.code, { discountValue: 101 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for invalid expiration date', async () => {
      repo.findOne.mockResolvedValue(mockVoucher);

      await expect(
        service.update(mockVoucher.code, { expirationDate: 'invalid-date' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for expiration date in the past', async () => {
      repo.findOne.mockResolvedValue(mockVoucher);

      await expect(
        service.update(mockVoucher.code, {
          expirationDate: '2000-01-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete()', () => {
    it('should delete voucher when found and return deleted voucher', async () => {
      repo.findOne.mockResolvedValue(mockVoucher);
      repo.remove.mockResolvedValue(mockVoucher);

      const result = await service.delete(1);

      // ensure correct voucher was fetched
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });

      // ensure the same voucher object is passed to remove()
      expect(repo.remove).toHaveBeenCalledWith(mockVoucher);

      // ensure the deleted voucher returned has same ID
      expect(result.id).toBe(mockVoucher.id);
      expect(result).toEqual(mockVoucher);
    });

    it('should throw NotFoundException when voucher missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.delete(99)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if delete fails', async () => {
      repo.findOne.mockResolvedValue(mockVoucher);
      repo.remove.mockRejectedValue(new Error('Delete fail'));

      await expect(service.delete(1)).rejects.toThrow(BadRequestException);
    });
  });
});
