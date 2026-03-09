import { Module } from '@nestjs/common';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import { AlertEngine } from './alert.engine';
import { NoiseSuppressor } from './noise-suppressor.service';

@Module({
  controllers: [AlertController],
  providers: [AlertService, AlertEngine, NoiseSuppressor],
  exports: [AlertService, AlertEngine],
})
export class AlertModule {}
