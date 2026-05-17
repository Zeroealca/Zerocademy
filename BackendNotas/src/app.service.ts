import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './common/dto/swagger';

@Injectable()
export class AppService {
  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      service: 'Notas API',
      version: '1.0.0',
    };
  }
}
