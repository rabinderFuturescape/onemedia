import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all identity providers' })
  @ApiResponse({ status: 200, description: 'Return all identity providers' })
  async findAll() {
    return { message: 'This endpoint will return all identity providers' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get identity provider by ID' })
  @ApiResponse({ status: 200, description: 'Return identity provider by ID' })
  async findOne(@Param('id') id: string) {
    return { message: `This endpoint will return identity provider with ID ${id}` };
  }
}
