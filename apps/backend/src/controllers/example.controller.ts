import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiDocs } from '../decorators/api-docs.decorator';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { JwtAuthGuard } from '@gitroom/backend/services/auth/jwt-auth.guard';

/**
 * Example controller with comprehensive API documentation
 * This is for demonstration purposes only
 */
@ApiTags('users')
@Controller('users')
export class ExampleController {
  /**
   * Get all users with pagination
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiDocs({
    summary: 'Get all users',
    description: 'Retrieve a list of all users with pagination',
    tags: ['users'],
    queries: [
      {
        name: 'page',
        description: 'Page number (starts from 1)',
        type: 'integer',
      },
      {
        name: 'limit',
        description: 'Number of items per page',
        type: 'integer',
      },
      {
        name: 'sort',
        description: 'Sort field',
        type: 'string',
      },
      {
        name: 'order',
        description: 'Sort order (asc or desc)',
        type: 'string',
      },
      {
        name: 'search',
        description: 'Search term',
        type: 'string',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'List of users retrieved successfully',
      },
    ],
  })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'createdAt',
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('search') search?: string,
  ) {
    return {
      data: [],
      meta: {
        page,
        limit,
        totalItems: 0,
        totalPages: 0,
      },
    };
  }

  /**
   * Get a user by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiDocs({
    summary: 'Get a user by ID',
    description: 'Retrieve a user by their unique identifier',
    tags: ['users'],
    params: [
      {
        name: 'id',
        description: 'User ID',
        type: 'string',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'User retrieved successfully',
      },
      {
        status: 404,
        description: 'User not found',
      },
    ],
  })
  findOne(@Param('id') id: string) {
    return {
      id,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'USER',
    };
  }

  /**
   * Create a new user
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiDocs({
    summary: 'Create a new user',
    description: 'Create a new user with the provided data',
    tags: ['users'],
    body: {
      type: CreateUserDto,
      description: 'User data',
    },
    responses: [
      {
        status: 201,
        description: 'User created successfully',
      },
      {
        status: 400,
        description: 'Invalid input data',
      },
      {
        status: 409,
        description: 'Email already exists',
      },
    ],
  })
  create(@Body() createUserDto: CreateUserDto) {
    return {
      id: 'new-user-id',
      ...createUserDto,
    };
  }

  /**
   * Update a user
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiDocs({
    summary: 'Update a user',
    description: 'Update a user with the provided data',
    tags: ['users'],
    params: [
      {
        name: 'id',
        description: 'User ID',
        type: 'string',
      },
    ],
    body: {
      type: UpdateUserDto,
      description: 'User data to update',
    },
    responses: [
      {
        status: 200,
        description: 'User updated successfully',
      },
      {
        status: 400,
        description: 'Invalid input data',
      },
      {
        status: 404,
        description: 'User not found',
      },
    ],
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return {
      id,
      ...updateUserDto,
    };
  }

  /**
   * Delete a user
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiDocs({
    summary: 'Delete a user',
    description: 'Delete a user by their unique identifier',
    tags: ['users'],
    params: [
      {
        name: 'id',
        description: 'User ID',
        type: 'string',
      },
    ],
    responses: [
      {
        status: 204,
        description: 'User deleted successfully',
      },
      {
        status: 404,
        description: 'User not found',
      },
    ],
  })
  remove(@Param('id') id: string) {
    return { success: true };
  }
}
