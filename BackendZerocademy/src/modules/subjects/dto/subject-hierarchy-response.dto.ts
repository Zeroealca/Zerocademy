import { ApiProperty } from '@nestjs/swagger';
import { SubjectResponseDto } from './subject-response.dto';

export class SubjectHierarchyResponseDto {
  @ApiProperty({ type: [SubjectResponseDto] })
  subjects: SubjectResponseDto[];
}
