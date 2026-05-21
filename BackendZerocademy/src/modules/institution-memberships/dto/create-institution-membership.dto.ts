import { ApiProperty } from '@nestjs/swagger';
import { InstitutionMembershipRole } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class CreateInstitutionMembershipDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: InstitutionMembershipRole })
  @IsEnum(InstitutionMembershipRole)
  role: InstitutionMembershipRole;
}
