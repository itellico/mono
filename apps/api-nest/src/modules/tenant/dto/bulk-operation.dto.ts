import { IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkOperationDto<T> {
  @ApiProperty({
    description: 'Array of IDs for the bulk operation',
    example: ['123e4567-e89b-12d3-a456-426614174000', '456e7890-e89b-12d3-a456-426614174001'],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  ids: string[];

  @ApiProperty({
    description: 'Data to apply to all specified IDs',
    example: { status: 'active', priority: 'high' },
  })
  @IsNotEmpty()
  data: T;
}