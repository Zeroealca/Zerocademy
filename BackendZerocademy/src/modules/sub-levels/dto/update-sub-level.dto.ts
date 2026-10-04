import { PartialType } from '@nestjs/swagger';
import { CreateSubLevelDto } from './create-sub-level.dto';
export class UpdateSubLevelDto extends PartialType(CreateSubLevelDto) {}
