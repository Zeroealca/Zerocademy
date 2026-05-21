import { ApiPropertyOptional } from '@nestjs/swagger';
import { InstitutionMembershipRole } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateInstitutionMembershipDto {
  @ApiPropertyOptional({ enum: InstitutionMembershipRole })
  @IsOptional()
  @IsEnum(InstitutionMembershipRole)
  role?: InstitutionMembershipRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
