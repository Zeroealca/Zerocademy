import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Service health status' })
  status: string;

  @ApiProperty({ example: 'Zerocademy API', description: 'Service name' })
  service: string;

  @ApiProperty({
    example: '1.0.0',
    description: 'API version',
  })
  version: string;
}
