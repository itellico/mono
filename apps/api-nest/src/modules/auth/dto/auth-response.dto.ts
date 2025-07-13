import { ApiProperty } from '@nestjs/swagger';

export class UserDataDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User full name' })
  name: string;

  @ApiProperty({ description: 'User tier level' })
  tier: string;

  @ApiProperty({ description: 'Tenant ID', required: false })
  tenant_id?: string;

  @ApiProperty({ description: 'Account ID' })
  account_id: string;

  @ApiProperty({ description: 'User roles' })
  roles: string[];

  @ApiProperty({ description: 'User permissions' })
  permissions: string[];
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'User data', type: UserDataDto })
  data: UserDataDto;

  @ApiProperty({ description: 'Additional message', required: false })
  message?: string;
}

export class SignOutResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Sign out message' })
  message: string;
}