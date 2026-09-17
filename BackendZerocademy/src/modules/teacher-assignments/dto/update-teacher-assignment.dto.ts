import { PartialType, PickType } from '@nestjs/swagger';
import { CreateTeacherAssignmentDto } from './create-teacher-assignment.dto';

export class UpdateTeacherAssignmentDto extends PartialType(
  PickType(CreateTeacherAssignmentDto, ['courseId', 'subjectId'] as const),
) {}
