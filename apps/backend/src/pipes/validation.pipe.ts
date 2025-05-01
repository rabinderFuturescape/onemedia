import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Enhanced validation pipe with detailed error messages and logging
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(ValidationPipe.name);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Skip validation if value is null or undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Convert plain object to class instance
    const object = plainToInstance(metatype, value);

    // Validate the object
    const errors = await validate(object, {
      whitelist: true, // Strip properties not in the DTO
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      forbidUnknownValues: true, // Throw error if unknown values are present
      skipMissingProperties: false, // Don't skip validation of missing properties
    });

    // If there are validation errors
    if (errors.length > 0) {
      // Format the errors
      const formattedErrors = this.formatErrors(errors);
      
      // Log the validation errors
      this.logger.warn(`Validation failed: ${JSON.stringify(formattedErrors)}`);
      
      // Throw a BadRequestException with the formatted errors
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    return object;
  }

  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    errors.forEach(error => {
      const property = error.property;
      const constraints = error.constraints;

      if (constraints) {
        result[property] = Object.values(constraints);
      }

      // Handle nested errors
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatErrors(error.children);
        
        for (const [nestedProperty, nestedConstraints] of Object.entries(nestedErrors)) {
          result[`${property}.${nestedProperty}`] = nestedConstraints;
        }
      }
    });

    return result;
  }
}
