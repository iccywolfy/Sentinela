import { Module } from '@nestjs/common';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { CollectorService } from './collector.service';
import { ConnectorFactory } from './connectors/connector.factory';

@Module({
  controllers: [SourcesController],
  providers: [SourcesService, CollectorService, ConnectorFactory],
  exports: [SourcesService, CollectorService],
})
export class SourcesModule {}
