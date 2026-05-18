import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'teacher@zerocademy.edu' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'Alan' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Turing' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ enum: Role, example: Role.TEACHER })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Institution scope for academic profiles (optional)',
  })
  @IsOptional()
  @IsUUID()
  institutionId?: string;
}
