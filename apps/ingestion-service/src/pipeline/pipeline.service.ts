import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(@InjectQueue('ingestion-pipeline') private readonly queue: Queue) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async enqueuePendingContent() {
    const pending = await prisma.rawContent.findMany({
      where: { processingStatus: 'pending' },
      take: 100,
      orderBy: { collectedAt: 'asc' },
    });

    for (const content of pending) {
      await this.queue.add('process', { rawContentId: content.id }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      });
      await prisma.rawContent.update({
        where: { id: content.id },
        data: { processingStatus: 'processing', currentStage: 'queued' },
      });
    }

    if (pending.length > 0) {
      this.logger.log(`Enqueued ${pending.length} items for processing`);
    }
  }

  async getStats() {
    const [pending, processing, completed, failed] = await Promise.all([
      prisma.rawContent.count({ where: { processingStatus: 'pending' } }),
      prisma.rawContent.count({ where: { processingStatus: 'processing' } }),
      prisma.rawContent.count({ where: { processingStatus: 'completed' } }),
      prisma.rawContent.count({ where: { processingStatus: 'failed' } }),
    ]);
    const queueStats = await this.queue.getJobCounts();
    return { pipeline: { pending, processing, completed, failed }, queue: queueStats };
  }
}
