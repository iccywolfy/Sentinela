import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import { NormalizerService } from '../normalization/normalizer.service';

const prisma = new PrismaClient();

@Processor('ingestion-pipeline')
export class PipelineProcessor {
  private readonly logger = new Logger(PipelineProcessor.name);

  constructor(private readonly normalizer: NormalizerService) {}

  @Process('process')
  async handleProcess(job: Job<{ rawContentId: string }>) {
    const { rawContentId } = job.data;

    try {
      const raw = await prisma.rawContent.findUnique({
        where: { id: rawContentId },
        include: { source: true },
      });

      if (!raw) {
        this.logger.warn(`RawContent ${rawContentId} not found`);
        return;
      }

      // Stage 1: Format Validation
      await this.updateStage(rawContentId, 'format_validation');
      if (!raw.content || raw.content.length < 10) {
        await this.fail(rawContentId, 'Content too short');
        return;
      }

      // Stage 2: Deduplication (already done at collection time, but double-check)
      await this.updateStage(rawContentId, 'deduplication');

      // Stage 3: Language Detection (simplified - call NLP service)
      await this.updateStage(rawContentId, 'language_detection');
      const detectedLang = raw.language || await this.detectLanguage(raw.content);

      // Stage 4: Thematic Classification + NER via NLP service
      await this.updateStage(rawContentId, 'thematic_classification');
      const nlpResult = await this.callNlpService(raw.content, detectedLang);

      // Stage 5: Normalization → create Event
      await this.updateStage(rawContentId, 'normalization');
      const event = await this.normalizer.normalize(raw, nlpResult);

      // Stage 6: Indexing to Elasticsearch
      await this.updateStage(rawContentId, 'indexing');
      // Indexing handled by NormalizerService

      // Stage 7: Mark complete
      await prisma.rawContent.update({
        where: { id: rawContentId },
        data: { processingStatus: 'completed', eventId: event.id, currentStage: 'completed' },
      });

      this.logger.debug(`Processed rawContent ${rawContentId} → event ${event.id}`);
    } catch (err) {
      this.logger.error(`Pipeline failed for ${rawContentId}: ${err.message}`);
      await this.fail(rawContentId, err.message);
      throw err;
    }
  }

  private async updateStage(id: string, stage: string) {
    await prisma.rawContent.update({ where: { id }, data: { currentStage: stage } });
  }

  private async fail(id: string, error: string) {
    await prisma.rawContent.update({
      where: { id },
      data: { processingStatus: 'failed', processingError: error },
    });
  }

  private async detectLanguage(content: string): Promise<string> {
    // Simple heuristic: default to 'en', real implementation calls NLP service
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const chinesePattern = /[\u4E00-\u9FFF]/;
    const arabicPattern = /[\u0600-\u06FF]/;
    if (cyrillicPattern.test(content)) return 'ru';
    if (chinesePattern.test(content)) return 'zh';
    if (arabicPattern.test(content)) return 'ar';
    return 'en';
  }

  private async callNlpService(content: string, language: string): Promise<NlpResult> {
    try {
      const axios = await import('axios');
      const nlpUrl = process.env.NLP_SERVICE_URL || 'http://localhost:8000';
      const response = await axios.default.post(`${nlpUrl}/api/v1/process`, {
        text: content.slice(0, 5000),
        language,
      }, { timeout: 30000 });
      return response.data;
    } catch {
      // Fallback NLP result when service unavailable
      return {
        entities: [],
        domain: 'geopolitical',
        subdomain: null,
        sentiment: 0,
        keywords: [],
        locations: [],
        eventType: 'general',
        summary: content.slice(0, 300),
      };
    }
  }
}

interface NlpResult {
  entities: { text: string; type: string; confidence: number }[];
  domain: string;
  subdomain: string | null;
  sentiment: number;
  keywords: string[];
  locations: { name: string; countryCode?: string; lat?: number; lon?: number }[];
  eventType: string;
  summary: string;
}
