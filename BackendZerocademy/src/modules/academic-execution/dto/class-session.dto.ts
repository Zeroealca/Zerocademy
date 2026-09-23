import { PartialType } from '@nestjs/swagger';
import { ClassSessionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';

export class CreateClassSessionDto {
  @IsOptional() @IsUUID('4') lessonPlanId?: string;
  @IsOptional() @IsEnum(ClassSessionStatus) status?: ClassSessionStatus;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) scheduledDate?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) occurredOn?: string;
}

export class UpdateClassSessionDto extends PartialType(CreateClassSessionDto) {}
