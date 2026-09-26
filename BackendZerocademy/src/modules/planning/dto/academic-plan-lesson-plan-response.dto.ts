import { ApiProperty } from '@nestjs/swagger';
import type { LessonPlan } from '@prisma/client';
import { LessonPlanResponseDto } from './lesson-plan-response.dto';

type AggregateLessonPlan = LessonPlan & {
  academicUnit: { title: string };
};

export class AcademicPlanLessonPlanResponseDto extends LessonPlanResponseDto {
  static from(
    lessonPlan: AggregateLessonPlan,
  ): AcademicPlanLessonPlanResponseDto {
    return {
      ...LessonPlanResponseDto.from(lessonPlan),
      academicUnitTitle: lessonPlan.academicUnit.title,
    };
  }

  @ApiProperty()
  academicUnitTitle: string;
}
