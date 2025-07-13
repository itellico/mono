import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';

/**
 * UUID parameter decorator with validation
 * Ensures that UUID parameters are valid PostgreSQL UUIDs
 */
export const UUID = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const value = field ? request.params[field] : request.params.uuid || request.params.id;

    if (!value) {
      throw new BadRequestException('UUID parameter is required');
    }

    if (!uuidValidate(value)) {
      throw new BadRequestException(`Invalid UUID format: ${value}`);
    }

    return value;
  },
);

/**
 * Transform decorator to handle both UUID and numeric ID
 * During migration period, supports both formats
 */
export const UUIDOrId = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const value = field ? request.params[field] : request.params.uuid || request.params.id;

    if (!value) {
      throw new BadRequestException('Identifier is required');
    }

    // Check if it's a valid UUID
    if (uuidValidate(value)) {
      return { type: 'uuid', value };
    }

    // Check if it's a numeric ID
    const numericId = parseInt(value, 10);
    if (!isNaN(numericId) && numericId > 0) {
      return { type: 'id', value: numericId };
    }

    throw new BadRequestException(`Invalid identifier format: ${value}`);
  },
);