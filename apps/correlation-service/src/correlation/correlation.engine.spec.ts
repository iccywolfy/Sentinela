import { Test, TestingModule } from '@nestjs/testing';
import { CorrelationEngine } from './correlation.engine';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  correlation: {
    create: jest.fn().mockResolvedValue({ id: 'corr-1', strength: 0.75 }),
    findFirst: jest.fn().mockResolvedValue(null),
  },
  correlationEvent: {
    create: jest.fn().mockResolvedValue({}),
  },
  correlationRule: {
    findMany: jest.fn().mockResolvedValue([]),
  },
};

const makeEvent = (overrides = {}) => ({
  id: `evt-${Math.random()}`,
  tenantId: 'tenant-1',
  headline: 'Test event',
  eventDomain: 'GEOPOLITICAL',
  publishedAt: new Date(),
  primaryLocationJson: { countryCode: 'UA', lat: 49.0, lng: 31.0 },
  entitiesJson: ['Russia', 'NATO'],
  tagsJson: ['conflict', 'military'],
  impactScore: 0.7,
  ...overrides,
});

describe('CorrelationEngine', () => {
  let engine: CorrelationEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorrelationEngine,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    engine = module.get<CorrelationEngine>(CorrelationEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('findTemporalCorrelations', () => {
    it('should detect correlation between events in the same time window', async () => {
      const now = new Date();
      const events = [
        makeEvent({ id: 'evt-1', publishedAt: now, eventDomain: 'GEOPOLITICAL' }),
        makeEvent({ id: 'evt-2', publishedAt: new Date(now.getTime() - 3600_000), eventDomain: 'ECONOMIC' }),
        makeEvent({ id: 'evt-3', publishedAt: new Date(now.getTime() - 100_000_000), eventDomain: 'MILITARY' }),
      ];

      const correlations = (engine as any).findTemporalCorrelations(events);
      // evt-1 and evt-2 are within 72h of each other and cross-domain
      expect(correlations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('findEntityCorrelations', () => {
    it('should detect correlation when events share entities', () => {
      const events = [
        makeEvent({ id: 'evt-A', entitiesJson: ['Russia', 'NATO', 'Ukraine'] }),
        makeEvent({ id: 'evt-B', entitiesJson: ['Russia', 'EU'] }),
        makeEvent({ id: 'evt-C', entitiesJson: ['China', 'Taiwan'] }),
      ];

      const correlations = (engine as any).findEntityCorrelations(events);
      // evt-A and evt-B share 'Russia'
      expect(correlations.some((c: any) =>
        (c.eventIds.includes('evt-A') && c.eventIds.includes('evt-B'))
      )).toBe(true);
    });
  });
});
