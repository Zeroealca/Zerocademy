import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RepresentativeRelationshipType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class UpsertRepresentativeStudentDto {
  @ApiProperty({ enum: RepresentativeRelationshipType })
  @IsEnum(RepresentativeRelationshipType)
  relationshipType: RepresentativeRelationshipType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateRepresentativeStudentDto extends UpsertRepresentativeStudentDto {
  @ApiProperty()
  @IsUUID()
  representativeUserId: string;
}
