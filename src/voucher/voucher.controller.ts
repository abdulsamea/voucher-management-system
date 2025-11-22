import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';

@Controller('voucher')
export class VoucherController {
  constructor(private voucherService: VoucherService) {}

  @Post()
  create(@Body() voucherDto) {
    return this.voucherService.create(voucherDto);
  }

  @Get()
  findAll() {
    return this.voucherService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.voucherService.findOne(id);
  }

  @Patch(':code')
  update(@Param('code') code: string, @Body() voucherDto) {
    return this.voucherService.update(code, voucherDto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.voucherService.delete(id);
  }
}
