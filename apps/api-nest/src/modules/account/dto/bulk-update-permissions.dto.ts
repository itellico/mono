import { IsArray, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkUpdatePermissionsDto {
  @ApiProperty({
    description: 'Array of user IDs to update permissions for',
    example: ['123e4567-e89b-12d3-a456-426614174000', '456e7890-e89b-12d3-a456-426614174001'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  userIds: string[];

  @ApiProperty({
    description: 'Array of permission strings to assign to all specified users',
    example: ['account.users.view', 'account.users.create', 'account.settings.read'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}