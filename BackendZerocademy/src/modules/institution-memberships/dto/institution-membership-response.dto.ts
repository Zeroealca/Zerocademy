import { ApiProperty } from '@nestjs/swagger';
import { InstitutionMembershipRole } from '@prisma/client';

export class InstitutionMembershipResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  institutionId: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'Ada' })
  userFirstName: string;

  @ApiProperty({ example: 'Lovelace' })
  userLastName: string;

  @ApiProperty({ example: 'ada@school.edu' })
  userEmail: string;

  @ApiProperty({ enum: InstitutionMembershipRole })
  role: InstitutionMembershipRole;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
