import { Test, TestingModule } from '@nestjs/testing';
import { AlertEngine } from './alert.engine';
import { NoiseSuppressorService } from './noise-suppressor.service';
import { PrismaService } from '../prisma/prisma.service';

const mockNoiseSuppressor = {
  shouldAlert: jest.fn().mockResolvedValue(true),
  isDuplicate: jest.fn().mockResolvedValue(false),
  markDuplicate: jest.fn().mockResolvedValue(undefined),
};

const mockPrisma = {
  alertRule: {
    findMany: jest.fn().mockResolvedValue([
      {
        id: 'rule-1',
        name: 'High Impact',
        alertType: 'THRESHOLD_BREACH',
        severity: 'HIGH',
        conditionsJson: { field: 'impactScore', operator: 'gte', value: 0.8 },
        isActive: true,
      },
    ]),
  },
  alert: {
    create: jest.fn().mockResolvedValue({ id: 'alert-1', title: 'High Impact Event', severity: 'HIGH' }),
  },
  alertEvent: {
    create: jest.fn().mockResolvedValue({}),
  },
  watchlist: {
    findMany: jest.fn().mockResolvedValue([]),
  },
};

describe('AlertEngine', () => {
  let engine: AlertEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertEngine,
        { provide: NoiseSuppressorService, useValue: mockNoiseSuppressor },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    engine = module.get<AlertEngine>(AlertEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('evaluateEvent', () => {
    it('should create alert when event exceeds impact threshold', async () => {
      const event = {
        id: 'evt-1',
        tenantId: 'tenant-1',
        headline: 'Critical geopolitical event',
        impactScore: 0.92,
        urgencyScore: 0.75,
        credibilityScore: 0.88,
        eventDomain: 'GEOPOLITICAL',
        primaryLocationJson: { countryCode: 'RU' },
        tagsJson: ['military', 'crisis'],
      };

      await engine.evaluateEvent(event as any);
      expect(mockPrisma.alert.create).toHaveBeenCalled();
    });

    it('should not create alert when impact is below threshold', async () => {
      jest.clearAllMocks();
      mockPrisma.alert.create.mockClear();

      const lowImpactEvent = {
        id: 'evt-2',
        tenantId: 'tenant-1',
        headline: 'Minor local event',
        impactScore: 0.2,
        urgencyScore: 0.1,
        credibilityScore: 0.7,
        eventDomain: 'SOCIAL',
        primaryLocationJson: { countryCode: 'US' },
        tagsJson: [],
      };

      await engine.evaluateEvent(lowImpactEvent as any);
      expect(mockPrisma.alert.create).not.toHaveBeenCalled();
    });
  });
});
