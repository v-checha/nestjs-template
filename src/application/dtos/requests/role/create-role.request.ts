import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleRequest {
  @ApiProperty({
    description: 'Role name (unique identifier)',
    example: 'admin',
    minLength: 3,
    maxLength: 50,
  })
  @IsString({ message: 'Role name must be a string' })
  @IsNotEmpty({ message: 'Role name is required' })
  @MinLength(3, { message: 'Role name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Role name cannot exceed 50 characters' })
  name!: string;

  @ApiProperty({
    description: 'Role description explaining its purpose and permissions',
    example: 'Administrator role with full system access',
    minLength: 10,
    maxLength: 200,
  })
  @IsString({ message: 'Role description must be a string' })
  @IsNotEmpty({ message: 'Role description is required' })
  @MinLength(10, { message: 'Role description must be at least 10 characters long' })
  @MaxLength(200, { message: 'Role description cannot exceed 200 characters' })
  description!: string;

  @ApiPropertyOptional({
    description: 'Whether this role should be assigned to new users by default',
    example: false,
    default: false,
  })
  @IsBoolean({ message: 'isDefault must be a boolean value' })
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'List of permission IDs to assign to this role',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
    isArray: true,
  })
  @IsArray({ message: 'Permission IDs must be an array' })
  @IsUUID('4', { each: true, message: 'Each permission ID must be a valid UUID' })
  @IsOptional()
  permissionIds?: string[];
}
