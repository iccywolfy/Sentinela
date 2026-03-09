import { Test, TestingModule } from '@nestjs/testing';
import { NormalizerService } from './normalizer.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { PrismaService } from '../prisma/prisma.service';

const mockElasticsearch = {
  indexEvent: jest.fn().mockResolvedValue({}),
};

const mockPrisma = {
  event: {
    create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
    findFirst: jest.fn().mockResolvedValue(null),
  },
  source: {
    findUnique: jest.fn().mockResolvedValue({
      id: 'src-1',
      credibilityScore: 0.85,
      sourceCategory: 'NEWS_MEDIA',
    }),
  },
};

describe('NormalizerService', () => {
  let service: NormalizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NormalizerService,
        { provide: ElasticsearchService, useValue: mockElasticsearch },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NormalizerService>(NormalizerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalize', () => {
    it('should normalize raw content into a structured event', async () => {
      const rawContent = {
        id: 'raw-1',
        sourceId: 'src-1',
        tenantId: 'tenant-1',
        rawText: 'Military tensions escalate in eastern region',
        title: 'Military tensions escalate',
        publishedAt: new Date(),
        contentHash: 'abc123',
        metadata: {},
      };

      const nlpResult = {
        language: 'en',
        entities: [{ text: 'eastern region', label: 'GPE', start: 38, end: 52 }],
        domain: 'MILITARY',
        sentiment: { label: 'NEGATIVE', score: -0.7 },
        keywords: ['military', 'tensions', 'escalate'],
        summary: 'Military tensions escalate in eastern region',
      };

      const result = await service.normalize(rawContent, nlpResult);
      expect(result).toBeDefined();
      expect(mockPrisma.event.create).toHaveBeenCalled();
    });
  });
});
