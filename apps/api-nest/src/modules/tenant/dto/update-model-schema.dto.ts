import { PartialType } from '@nestjs/swagger';
import { CreateModelSchemaDto } from './create-model-schema.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateModelSchemaDto extends PartialType(CreateModelSchemaDto) {
  @ApiPropertyOptional({
    description: 'Whether the schema is active and can be used',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the schema is locked and cannot be modified',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;
}