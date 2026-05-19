import { ApiProperty } from '@nestjs/swagger';
import { TeacherAssignmentResponseDto } from './teacher-assignment-response.dto';

export class AssignmentHierarchyResponseDto {
  @ApiProperty({ type: [TeacherAssignmentResponseDto] })
  assignments: TeacherAssignmentResponseDto[];
}
