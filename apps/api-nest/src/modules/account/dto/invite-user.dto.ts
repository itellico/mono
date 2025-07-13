import { IsEmail, IsString, IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from './create-user.dto';

export class InviteUserDto {
  @ApiProperty({
    description: 'Email address of the user to invite',
    example: 'jane.smith@company.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Full name of the user to invite',
    example: 'Jane Smith',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Role to assign to the invited user',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.MEMBER;

  @ApiPropertyOptional({
    description: 'Specific permissions to grant to the user',
    example: ['account.users.view', 'account.settings.read'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Custom message to include in the invitation email',
    example: 'Welcome to our team! We are excited to have you join us.',
  })
  @IsString()
  @IsOptional()
  message?: string;
}