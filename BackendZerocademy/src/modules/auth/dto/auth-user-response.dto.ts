import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'admin@zerocademy.edu' })
  email: string;

  @ApiProperty({ example: 'Ada' })
  firstName: string;

  @ApiProperty({ example: 'Lovelace' })
  lastName: string;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  role: Role;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Academic profile id for STUDENT, TEACHER, or REPRESENTATIVE roles',
  })
  profileId?: string;

  @ApiPropertyOptional({
    enum: ['student', 'teacher', 'representative'],
    description: 'Academic profile discriminator',
  })
  profileType?: 'student' | 'teacher' | 'representative';

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Institution scope when assigned',
  })
  institutionId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'User-selected academic period for UI context',
  })
  selectedAcademicPeriodId?: string;

  @ApiProperty({ example: '2025-05-16T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-05-16T12:00:00.000Z' })
  updatedAt: string;
}
