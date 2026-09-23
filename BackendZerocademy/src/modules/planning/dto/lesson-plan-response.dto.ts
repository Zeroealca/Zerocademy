import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LessonPlan } from '@prisma/client';

export class LessonPlanResponseDto {
  static from(lessonPlan: LessonPlan): LessonPlanResponseDto {
    return {
      ...lessonPlan,
      lessonDate: lessonPlan.lessonDate.toISOString().slice(0, 10),
      createdAt: lessonPlan.createdAt.toISOString(),
      updatedAt: lessonPlan.updatedAt.toISOString(),
    };
  }

  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  academicUnitId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ format: 'date' })
  lessonDate: string;

  @ApiPropertyOptional({ minimum: 1, nullable: true })
  durationMinutes: number | null;

  @ApiPropertyOptional({ nullable: true })
  objectives: string | null;

  @ApiPropertyOptional({ nullable: true })
  introduction: string | null;

  @ApiPropertyOptional({ nullable: true })
  development: string | null;

  @ApiPropertyOptional({ nullable: true })
  closure: string | null;

  @ApiPropertyOptional({ nullable: true })
  resources: string | null;

  @ApiPropertyOptional({ nullable: true })
  evaluationStrategy: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiProperty({ example: 1 })
  position: number;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}
