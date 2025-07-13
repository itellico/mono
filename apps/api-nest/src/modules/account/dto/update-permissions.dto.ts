import { IsUUID, IsArray, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePermissionsDto {
  @ApiProperty({
    description: 'UUID of the user to update permissions for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'Array of permission strings to assign to the user',
    example: ['account.users.view', 'account.users.create', 'account.settings.read'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}