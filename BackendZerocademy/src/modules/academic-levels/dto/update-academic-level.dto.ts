import { PartialType } from '@nestjs/swagger';
import { CreateAcademicLevelDto } from './create-academic-level.dto';

export class UpdateAcademicLevelDto extends PartialType(CreateAcademicLevelDto) {}
