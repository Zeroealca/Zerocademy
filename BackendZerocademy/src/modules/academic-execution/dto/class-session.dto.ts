import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ClassSessionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';

export class CreateClassSessionDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  lessonPlanId?: string | null;

  @ApiPropertyOptional({ enum: ClassSessionStatus })
  @IsOptional()
  @IsEnum(ClassSessionStatus)
  status?: ClassSessionStatus;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledDate?: string;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  occurredOn?: string;
}

export class UpdateClassSessionDto extends PartialType(CreateClassSessionDto) {}
