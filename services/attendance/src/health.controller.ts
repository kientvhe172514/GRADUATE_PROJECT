import { Controller, Get } from '@nestjs/common';
import { Public } from '@graduate-project/shared-common';

@Controller()
export class HealthController {
  @Get('health')
  @Public()
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'attendance',
    };
  }

  @Get('readiness')
  @Public()
  readiness() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('liveness')
  @Public()
  liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
