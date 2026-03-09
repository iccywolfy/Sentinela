import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService, HealthCheck, PrismaHealthIndicator, HealthCheckResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator,
    private db: PrismaService,
  ) {}

  /** Kubernetes liveness probe — is the process alive? */
  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness probe' })
  liveness(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Kubernetes readiness probe — can the service handle traffic? */
  @Get('ready')
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe — checks DB connectivity' })
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prisma.pingCheck('database', this.db),
    ]);
  }

  /** Full health with all checks */
  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Full health check' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prisma.pingCheck('database', this.db),
    ]);
  }
}
