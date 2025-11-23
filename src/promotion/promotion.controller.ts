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
import { PromotionService } from './promotion.service';
import { CreatePromotionDto, UpdatePromotionDto } from './promotion.dto';

@ApiTags('Promotion')
@Controller('promotion')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new promotion' })
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all promotions' })
  findAll() {
    return this.promotionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promotion by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.findOne(id);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update promotion using code' })
  update(@Param('code') code: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionService.update(code, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete promotion by ID' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.delete(id);
  }
}
