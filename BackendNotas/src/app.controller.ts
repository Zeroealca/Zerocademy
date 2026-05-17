import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { HealthResponseDto } from './common/dto/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(['', 'health'])
  @ApiOperation({
    summary: 'Health check',
    description: 'Public endpoint — verifies the API is running. No authentication required.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth(): HealthResponseDto {
    return this.appService.getHealth();
  }
}
