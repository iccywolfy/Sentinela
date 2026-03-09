import { Test, TestingModule } from '@nestjs/testing';
import { ScoringService } from './scoring.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  event: {
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
  },
  eventScore: {
    create: jest.fn().mockResolvedValue({ id: '1', totalScore: 0.75 }),
    findMany: jest.fn().mockResolvedValue([]),
  },
  scoreModel: {
    findFirst: jest.fn().mockResolvedValue({
      id: 'model-1',
      weightsJson: {
        impact: 0.20, urgency: 0.15, credibility: 0.15,
        geopoliticalInstability: 0.10, economicImpact: 0.08,
        militaryActivity: 0.08, cyberThreat: 0.07,
        humanitarianCrisis: 0.05, environmentalRisk: 0.04,
        socialUnrest: 0.04, technologicalDisruption: 0.02,
        novelty: 0.01, corroboration: 0.01,
      },
    }),
  },
};

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computeScore', () => {
    it('should compute a weighted score from event factors', () => {
      const event = {
        impactScore: 0.8,
        urgencyScore: 0.7,
        credibilityScore: 0.9,
        eventDomain: 'GEOPOLITICAL',
        primaryLocationJson: { countryCode: 'UA' },
      };
      // Access private method via cast for unit test
      const score = (service as any).computeWeightedScore(event, {
        impact: 0.20, urgency: 0.15, credibility: 0.15,
        geopoliticalInstability: 0.10, economicImpact: 0.08,
        militaryActivity: 0.08, cyberThreat: 0.07,
        humanitarianCrisis: 0.05, environmentalRisk: 0.04,
        socialUnrest: 0.04, technologicalDisruption: 0.02,
        novelty: 0.01, corroboration: 0.01,
      });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
});
