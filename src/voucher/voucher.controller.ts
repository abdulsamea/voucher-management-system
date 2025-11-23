import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto, UpdateVoucherDto } from './voucher.dto';

@ApiTags('Voucher')
@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new voucher' })
  create(@Body() voucherDto: CreateVoucherDto) {
    return this.voucherService.create(voucherDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vouchers' })
  findAll() {
    return this.voucherService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get voucher by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.voucherService.findOne(id);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update voucher using code' })
  update(@Param('code') code: string, @Body() voucherDto: UpdateVoucherDto) {
    return this.voucherService.update(code, voucherDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete voucher by ID' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.voucherService.delete(id);
  }
}
