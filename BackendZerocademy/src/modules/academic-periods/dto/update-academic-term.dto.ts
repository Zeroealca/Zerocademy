import { PartialType } from '@nestjs/swagger';
import { CreateAcademicTermDto } from './create-academic-term.dto';

export class UpdateAcademicTermDto extends PartialType(CreateAcademicTermDto) {}
