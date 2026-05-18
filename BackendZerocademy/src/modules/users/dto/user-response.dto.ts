import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'student@zerocademy.edu' })
  email: string;

  @ApiProperty({ example: 'Grace' })
  firstName: string;

  @ApiProperty({ example: 'Hopper' })
  lastName: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  profileId?: string;

  @ApiPropertyOptional({
    enum: ['student', 'teacher', 'representative'],
  })
  profileType?: 'student' | 'teacher' | 'representative';

  @ApiPropertyOptional({ format: 'uuid' })
  institutionId?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
