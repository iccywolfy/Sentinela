import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SourcesService } from './sources.service';
import { ConnectorFactory } from './connectors/connector.factory';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

@Injectable()
export class CollectorService {
  private readonly logger = new Logger(CollectorService.name);

  constructor(
    private readonly sourcesService: SourcesService,
    private readonly connectorFactory: ConnectorFactory,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async collectAll() {
    this.logger.log('Starting scheduled collection run');
    const sources = await this.sourcesService.getActiveSources();
    const results = await Promise.allSettled(sources.map((s) => this.collectSource(s)));
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    this.logger.log(`Collection complete: ${succeeded}/${sources.length} succeeded`);
  }

  async collectSource(source: any) {
    const start = Date.now();
    try {
      const connector = this.connectorFactory.create(source.collectionMethod);
      const items = await connector.collect(source);
      const latencyMs = Date.now() - start;

      for (const item of items) {
        const contentHash = createHash('md5').update(item.content || '').digest('hex');
        const existing = await prisma.rawContent.findFirst({ where: { contentHash } });
        if (existing) continue;

        await prisma.rawContent.create({
          data: {
            sourceId: source.id,
            url: item.url,
            title: item.title,
            content: item.content,
            contentHash,
            language: item.language,
            publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
            metadataJson: item.metadata || {},
            processingStatus: 'pending',
          },
        });
      }

      await this.sourcesService.updateMetrics(source.id, true, latencyMs);
    } catch (err) {
      this.logger.error(`Collection failed for source ${source.id}: ${err.message}`);
      await this.sourcesService.updateMetrics(source.id, false, Date.now() - start);
    }
  }
}
