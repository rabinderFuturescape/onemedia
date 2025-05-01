import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

/**
 * Decorator for documenting API endpoints
 */
export function ApiDocs(options: {
  summary: string;
  description?: string;
  tags?: string[];
  auth?: boolean;
  responses?: {
    status: number;
    description: string;
    type?: any;
  }[];
  body?: {
    type: any;
    description?: string;
    required?: boolean;
  };
  params?: {
    name: string;
    description?: string;
    type?: 'string' | 'number' | 'boolean' | 'integer';
    required?: boolean;
  }[];
  queries?: {
    name: string;
    description?: string;
    type?: 'string' | 'number' | 'boolean' | 'integer' | 'array';
    required?: boolean;
    isArray?: boolean;
  }[];
}) {
  const {
    summary,
    description,
    tags,
    auth = true,
    responses = [],
    body,
    params = [],
    queries = [],
  } = options;

  // Create decorators array
  const decorators = [
    ApiOperation({
      summary,
      description: description || summary,
    }),
  ];

  // Add tags
  if (tags && tags.length > 0) {
    decorators.push(ApiTags(...tags));
  }

  // Add auth
  if (auth) {
    decorators.push(ApiBearerAuth('JWT-auth'));
  }

  // Add responses
  responses.forEach(response => {
    decorators.push(
      ApiResponse({
        status: response.status,
        description: response.description,
        type: response.type,
      }),
    );
  });

  // Add default responses if not provided
  const hasSuccessResponse = responses.some(r => r.status >= 200 && r.status < 300);
  const hasUnauthorizedResponse = responses.some(r => r.status === 401);
  const hasForbiddenResponse = responses.some(r => r.status === 403);
  const hasServerErrorResponse = responses.some(r => r.status >= 500);

  if (!hasSuccessResponse) {
    decorators.push(
      ApiResponse({
        status: 200,
        description: 'Success',
      }),
    );
  }

  if (auth && !hasUnauthorizedResponse) {
    decorators.push(
      ApiResponse({
        status: 401,
        description: 'Unauthorized - JWT token is missing or invalid',
      }),
    );
  }

  if (auth && !hasForbiddenResponse) {
    decorators.push(
      ApiResponse({
        status: 403,
        description: 'Forbidden - insufficient permissions',
      }),
    );
  }

  if (!hasServerErrorResponse) {
    decorators.push(
      ApiResponse({
        status: 500,
        description: 'Internal server error',
      }),
    );
  }

  // Add body
  if (body) {
    decorators.push(
      ApiBody({
        type: body.type,
        description: body.description,
        required: body.required !== false,
      }),
    );
  }

  // Add params
  params.forEach(param => {
    decorators.push(
      ApiParam({
        name: param.name,
        description: param.description,
        type: param.type || 'string',
        required: param.required !== false,
      }),
    );
  });

  // Add queries
  queries.forEach(query => {
    decorators.push(
      ApiQuery({
        name: query.name,
        description: query.description,
        type: query.type || 'string',
        required: query.required === true,
        isArray: query.isArray,
      }),
    );
  });

  return applyDecorators(...decorators);
}
