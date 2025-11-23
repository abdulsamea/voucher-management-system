import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
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
import { Throttle } from '@nestjs/throttler';

@ApiTags('Voucher')
@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // throttle to max. 10 times per minute per IP.
  @Post()
  @ApiOperation({ summary: 'Create a new voucher' })
  @ApiCreatedResponse({ description: 'Voucher created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid input data.' })
  create(@Body() voucherDto: CreateVoucherDto) {
    return this.voucherService.create(voucherDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vouchers' })
  @ApiOkResponse({ description: 'List of all vouchers returned successfully.' })
  findAll() {
    return this.voucherService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get voucher by ID' })
  @ApiOkResponse({ description: 'Voucher data fetched successfully.' })
  @ApiNotFoundResponse({ description: 'Voucher not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.voucherService.findOne(id);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // throttle to max. 10 times per minute per IP.
  @Patch(':code')
  @ApiOperation({ summary: 'Update voucher using code' })
  @ApiOkResponse({ description: 'Voucher updated successfully.' })
  @ApiNotFoundResponse({ description: 'Voucher with given code not found.' })
  @ApiBadRequestResponse({ description: 'Invalid update data.' })
  update(@Param('code') code: string, @Body() voucherDto: UpdateVoucherDto) {
    return this.voucherService.update(code, voucherDto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // throttle to max. 10 times per minute per IP.
  @Delete(':id')
  @ApiOperation({ summary: 'Delete voucher by ID' })
  @ApiNoContentResponse({ description: 'Voucher deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Voucher not found.' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.voucherService.delete(id);
  }
}
