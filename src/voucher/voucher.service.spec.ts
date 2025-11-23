import { Test, TestingModule } from '@nestjs/testing';
import { VoucherService } from './voucher.service';
import { DiscountType, Voucher } from './voucher.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateVoucherDto } from './voucher.dto';

const voucherEntity = {
  id: 1,
  code: 'VHRABCDEFG8',
  discountType: 'percentage',
  discountValue: 10,
  expirationDate: new Date(Date.now() + 10000000),
  usageLimit: 10,
  minOrderValue: 100,
};

describe('VoucherService', () => {
  let service: VoucherService;
  let repo: Repository<Voucher>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoucherService,
        {
          provide: getRepositoryToken(Voucher),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VoucherService>(VoucherService);
    repo = module.get<Repository<Voucher>>(getRepositoryToken(Voucher));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create voucher with provided code', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);
      (repo.create as jest.Mock).mockReturnValue(voucherEntity);
      (repo.save as jest.Mock).mockResolvedValue(voucherEntity);

      const dto: CreateVoucherDto = {
        code: 'VHRABCDEFG8',
        discountType: 'percentage' as DiscountType,
        discountValue: 10,
        expirationDate: new Date(Date.now() + 10000000).toDateString(),
        usageLimit: 10,
        minOrderValue: 100,
      };
      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining(dto));
      expect(repo.save).toHaveBeenCalledWith(voucherEntity);
      expect(result.code).toBe(dto.code);
    });

    it('should auto-generate code if not provided', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);
      (repo.create as jest.Mock).mockReturnValueOnce({
        ...voucherEntity,
        code: undefined,
      });
      (repo.save as jest.Mock).mockResolvedValueOnce({
        ...voucherEntity,
        code: 'VHRABCDEFG8',
      });

      const dto = {
        discountType: 'percentage' as DiscountType,
        discountValue: 10,
        expirationDate: new Date(Date.now() + 10000000).toDateString(),
        usageLimit: 10,
      };
      const result = await service.create(dto);
      expect(result.code).toMatch(/^VHR[A-Z0-9]{8}$/);
    });

    it('should throw BadRequestException for duplicate code', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);
      (repo.create as jest.Mock).mockReturnValue(voucherEntity);
      (repo.save as jest.Mock).mockRejectedValue({ code: '23505' });

      await expect(
        service.create({
          code: 'VHRABCDEFG8',
          discountType: 'percentage' as DiscountType,
          discountValue: 10,
          expirationDate: new Date(Date.now() + 10000000).toDateString(),
          usageLimit: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return ordered vouchers', async () => {
      (repo.find as jest.Mock).mockResolvedValue([voucherEntity]);
      const result = await service.findAll();
      expect(repo.find).toHaveBeenCalledWith({
        order: { id: 'DESC' },
        take: 100,
      });
      expect(result).toEqual([voucherEntity]);
    });
  });

  describe('findOne', () => {
    it('should return voucher', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(voucherEntity);
      const result = await service.findOne(1);
      expect(result).toEqual(voucherEntity);
    });

    it('should throw NotFoundException when missing', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update voucher if code exists', async () => {
      const updated = { ...voucherEntity, discountValue: 20 };
      (repo.findOne as jest.Mock).mockResolvedValue({ ...voucherEntity });
      (repo.save as jest.Mock).mockResolvedValue(updated);

      const dto = { code: 'VHRABCDEFG8', discountValue: 20 };
      const result = await service.update('VHRABCDEFG8', dto);
      expect(result.discountValue).toBe(20);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VHRABCDEFG8',
          discountType: 'percentage',
          discountValue: 20,
          // ...include any properties you want to verify...
        }),
      );
    });

    it('should throw NotFoundException for non-existing code', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(
        service.update('DOESNOTEXIST', { code: 'VHRABCDEFG8' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw for invalid discountType', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(voucherEntity);
      await expect(
        service.update('VHRABCDEFG8', { discountType: 'random' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for usageLimit <= 0', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(voucherEntity);
      await expect(
        service.update('VHRABCDEFG8', { code: 'VHRABCDEFG8', usageLimit: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for minOrderValue < 0', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(voucherEntity);
      await expect(
        service.update('VHRABCDEFG8', {
          code: 'VHRABCDEFG8',
          minOrderValue: -10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for discountValue <= 0', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(voucherEntity);
      await expect(
        service.update('VHRABCDEFG8', {
          code: 'VHRABCDEFG8',
          discountValue: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for percentage discountValue out of range', async () => {
      const ent = { ...voucherEntity, discountType: 'percentage' };
      (repo.findOne as jest.Mock).mockResolvedValue(ent);

      await expect(
        service.update('VHRABCDEFG8', {
          code: 'VHRABCDEFG8',
          discountValue: 120,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('VHRABCDEFG8', {
          code: 'VHRABCDEFG8',
          discountValue: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for fixed discountValue > minOrderValue', async () => {
      const ent = {
        ...voucherEntity,
        discountType: 'fixed',
        minOrderValue: 100,
      };
      (repo.findOne as jest.Mock).mockResolvedValue(ent);

      await expect(
        service.update('VHRABCDEFG8', {
          code: 'VHRABCDEFG8',
          discountValue: 101,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for invalid expirationDate', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(voucherEntity);
      await expect(
        service.update('VHRABCDEFG8', {
          code: 'VHRABCDEFG8',
          expirationDate: 'bad-date',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for expirationDate in the past', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(voucherEntity);
      await expect(
        service.update('VHRABCDEFG8', {
          code: 'VHRABCDEFG8',
          expirationDate: '2002-01-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete voucher for valid id', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(voucherEntity);
      (repo.remove as jest.Mock).mockResolvedValue(undefined);
      await expect(service.delete(1)).resolves.toBeUndefined();
      expect(repo.remove).toHaveBeenCalledWith(voucherEntity);
    });

    it('should throw NotFoundException for missing voucher', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.delete(99)).rejects.toThrow(NotFoundException);
    });

    it('should handle error if repo.remove throws', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(voucherEntity);
      (repo.remove as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(service.delete(1)).rejects.toThrow(BadRequestException);
    });
  });
});
