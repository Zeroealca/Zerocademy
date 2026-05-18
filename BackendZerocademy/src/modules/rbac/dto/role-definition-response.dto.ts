import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RoleDefinitionResponseDto {
  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ example: 'Teacher' })
  label: string;

  @ApiProperty()
  summary: string;

  @ApiProperty({ type: [String] })
  capabilities: string[];

  @ApiProperty({ type: [String] })
  limitations: string[];
}
