import { IsString, IsNotEmpty, IsOptional, IsObject, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SchemaType {
  ENTITY = 'entity',
  FORM = 'form',
  REPORT = 'report',
  WORKFLOW = 'workflow',
  INTEGRATION = 'integration',
}

export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  EMAIL = 'email',
  URL = 'url',
  PHONE = 'phone',
  TEXT = 'text',
  JSON = 'json',
  ARRAY = 'array',
  OBJECT = 'object',
  REFERENCE = 'reference',
  FILE = 'file',
  IMAGE = 'image',
}

export class SchemaFieldDto {
  @ApiProperty({
    description: 'Field name (must be unique within schema)',
    example: 'email',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Data type of the field',
    enum: FieldType,
    example: FieldType.EMAIL,
  })
  @IsEnum(FieldType)
  type: FieldType;

  @ApiPropertyOptional({
    description: 'Human-readable label for the field',
    example: 'Email Address',
  })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({
    description: 'Whether this field is required',
    example: true,
  })
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this field value must be unique',
    example: true,
  })
  @IsOptional()
  unique?: boolean;

  @ApiPropertyOptional({
    description: 'Default value for the field',
    example: 'user@example.com',
  })
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional({
    description: 'Validation rules for the field',
    example: {
      min: 5,
      max: 100,
      pattern: '^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$',
    },
  })
  @IsObject()
  @IsOptional()
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
    custom?: string;
  };

  @ApiPropertyOptional({
    description: 'Additional metadata for the field',
    example: { displayOrder: 1, group: 'contact' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateModelSchemaDto {
  @ApiProperty({
    description: 'Name of the schema',
    example: 'User Profile',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the schema',
    example: 'Schema for managing user profile information',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Type of schema',
    enum: SchemaType,
    example: SchemaType.ENTITY,
  })
  @IsEnum(SchemaType)
  type: SchemaType;

  @ApiPropertyOptional({
    description: 'Category to group similar schemas',
    example: 'User Management',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Array of field definitions',
    type: [SchemaFieldDto],
    example: [
      {
        name: 'email',
        type: 'email',
        label: 'Email Address',
        required: true,
        unique: true,
      },
    ],
  })
  @IsArray()
  fields: SchemaFieldDto[];

  @ApiPropertyOptional({
    description: 'Schema behavior settings',
    example: {
      searchable: true,
      versionable: false,
      auditable: true,
      softDelete: true,
    },
  })
  @IsObject()
  @IsOptional()
  settings?: {
    searchable?: boolean;
    versionable?: boolean;
    auditable?: boolean;
    softDelete?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Tags for organizing schemas',
    example: ['user', 'profile', 'contact'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { version: '1.0', author: 'System' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}