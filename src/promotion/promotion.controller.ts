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
import { PromotionService } from './promotion.service';
import { CreatePromotionDto, UpdatePromotionDto } from './promotion.dto';

@ApiTags('Promotion')
@Controller('promotion')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new promotion' })
  @ApiCreatedResponse({ description: 'Promotion created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid input data.' })
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all promotions' })
  @ApiOkResponse({
    description: 'List of all promotions returned successfully.',
  })
  findAll() {
    return this.promotionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promotion by ID' })
  @ApiOkResponse({ description: 'Promotion data fetched successfully.' })
  @ApiNotFoundResponse({ description: 'Promotion not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.findOne(id);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update promotion using code' })
  @ApiOkResponse({ description: 'Promotion updated successfully.' })
  @ApiNotFoundResponse({ description: 'Promotion with given code not found.' })
  @ApiBadRequestResponse({ description: 'Invalid update data.' })
  update(@Param('code') code: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionService.update(code, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete promotion by ID' })
  @ApiNoContentResponse({ description: 'Promotion deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Promotion not found.' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.delete(id);
  }
}
