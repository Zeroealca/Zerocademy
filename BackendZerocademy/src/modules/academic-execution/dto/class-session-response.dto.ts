import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassSession, ClassSessionStatus } from '@prisma/client';

export class ClassSessionResponseDto {
  static from(value: ClassSession): ClassSessionResponseDto {
    return {
      ...value,
      scheduledDate: value.scheduledDate?.toISOString().slice(0, 10) ?? null,
      occurredOn: value.occurredOn?.toISOString().slice(0, 10) ?? null,
      createdAt: value.createdAt.toISOString(),
      updatedAt: value.updatedAt.toISOString(),
    };
  }
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) teacherAssignmentId: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) lessonPlanId:
    | string
    | null;
  @ApiProperty({ enum: ClassSessionStatus }) status: ClassSessionStatus;
  @ApiPropertyOptional({ format: 'date', nullable: true }) scheduledDate:
    | string
    | null;
  @ApiPropertyOptional({ format: 'date', nullable: true }) occurredOn:
    | string
    | null;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
  @ApiProperty({ format: 'date-time' }) updatedAt: string;
}
