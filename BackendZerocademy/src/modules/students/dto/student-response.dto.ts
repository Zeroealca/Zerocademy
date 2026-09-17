import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class StudentResponseDto {
  @ApiProperty()
  registrationNumber: string;
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  institutionId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  nationalId?: string | null;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  birthDate?: string | null;

  @ApiPropertyOptional({ enum: Gender, nullable: true })
  gender?: Gender | null;

  @ApiPropertyOptional({ nullable: true })
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  address?: string | null;

  @ApiPropertyOptional({ nullable: true })
  emergencyContact?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ description: 'Login account active flag' })
  userIsActive: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
