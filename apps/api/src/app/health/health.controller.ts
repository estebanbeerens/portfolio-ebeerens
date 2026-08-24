import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

// Internal liveness probe (used by the Docker HEALTHCHECK), excluded from the OpenAPI contract so
// it never leaks into the generated frontend client.
@ApiExcludeController()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
