import { ApiPropertyOptional } from '@nestjs/swagger';
import { AcademicPeriodResponseDto } from '../../academic-periods/dto/academic-period-response.dto';

export class ActiveAcademicPeriodResponseDto {
  @ApiPropertyOptional({ format: 'uuid' })
  institutionId: string;

  @ApiPropertyOptional({
    type: AcademicPeriodResponseDto,
    nullable: true,
    description: 'Current active academic period for the institution',
  })
  activePeriod: AcademicPeriodResponseDto | null;
}
