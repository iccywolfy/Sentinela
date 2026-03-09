import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  // In production use bcrypt — this is dev seed only
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Seeding SENTINELA database...');

  // ── Tenant ──────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'SENTINELA Default',
      slug: 'default',
      featuresJson: {
        narrativeIntelligence: true,
        crisisRoom: true,
        reportStudio: true,
        advancedCorrelation: true,
        aiAssisted: true,
      },
    },
  });
  console.log(`✓ Tenant: ${tenant.name} (${tenant.id})`);

  // ── Users ────────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sentinela.local' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@sentinela.local',
      name: 'System Administrator',
      role: 'ADMIN',
      passwordHash: hashPassword('sentinela'),
      preferencesJson: { theme: 'dark', language: 'en', defaultDashboard: 'global' },
    },
  });

  const analystUser = await prisma.user.upsert({
    where: { email: 'analyst@sentinela.local' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'analyst@sentinela.local',
      name: 'Intelligence Analyst',
      role: 'ANALYST',
      passwordHash: hashPassword('sentinela'),
      preferencesJson: { theme: 'dark', language: 'en', defaultDashboard: 'explorer' },
    },
  });

  const seniorUser = await prisma.user.upsert({
    where: { email: 'senior@sentinela.local' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'senior@sentinela.local',
      name: 'Senior Intelligence Analyst',
      role: 'SENIOR_ANALYST',
      passwordHash: hashPassword('sentinela'),
      preferencesJson: { theme: 'dark', language: 'en', defaultDashboard: 'global' },
    },
  });

  console.log(`✓ Users: ${adminUser.email}, ${analystUser.email}, ${seniorUser.email}`);

  // ── Default Sources ──────────────────────────────────────────────────────────
  const sources = [
    {
      name: 'Reuters World News',
      url: 'https://feeds.reuters.com/reuters/worldNews',
      collectionMethod: 'RSS_FEED',
      sourceCategory: 'NEWS_MEDIA',
      credibilityScore: 0.92,
      countryCode: 'GB',
      language: 'en',
      updateFrequencyMinutes: 30,
      configJson: {},
    },
    {
      name: 'BBC News World',
      url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
      collectionMethod: 'RSS_FEED',
      sourceCategory: 'NEWS_MEDIA',
      credibilityScore: 0.90,
      countryCode: 'GB',
      language: 'en',
      updateFrequencyMinutes: 30,
      configJson: {},
    },
    {
      name: 'Al Jazeera English',
      url: 'https://www.aljazeera.com/xml/rss/all.xml',
      collectionMethod: 'RSS_FEED',
      sourceCategory: 'NEWS_MEDIA',
      credibilityScore: 0.82,
      countryCode: 'QA',
      language: 'en',
      updateFrequencyMinutes: 30,
      configJson: {},
    },
    {
      name: 'RAND Corporation',
      url: 'https://www.rand.org/pubs/rss/reports.xml',
      collectionMethod: 'RSS_FEED',
      sourceCategory: 'THINK_TANK',
      credibilityScore: 0.95,
      countryCode: 'US',
      language: 'en',
      updateFrequencyMinutes: 240,
      configJson: {},
    },
    {
      name: 'Council on Foreign Relations',
      url: 'https://www.cfr.org/rss.xml',
      collectionMethod: 'RSS_FEED',
      sourceCategory: 'THINK_TANK',
      credibilityScore: 0.93,
      countryCode: 'US',
      language: 'en',
      updateFrequencyMinutes: 240,
      configJson: {},
    },
  ];

  for (const sourceData of sources) {
    await prisma.source.upsert({
      where: { url: sourceData.url },
      update: {},
      create: { tenantId: tenant.id, ...sourceData },
    });
  }
  console.log(`✓ Sources: ${sources.length} default sources seeded`);

  // ── Alert Rules ──────────────────────────────────────────────────────────────
  const alertRules = [
    {
      name: 'High Impact Event',
      description: 'Alert when any event exceeds 80% impact score',
      conditionsJson: { field: 'impactScore', operator: 'gte', value: 0.8 },
      severity: 'HIGH',
      alertType: 'THRESHOLD_BREACH',
      isActive: true,
    },
    {
      name: 'Critical Urgency',
      description: 'Alert on critical urgency events',
      conditionsJson: { field: 'urgencyScore', operator: 'gte', value: 0.85 },
      severity: 'CRITICAL',
      alertType: 'THRESHOLD_BREACH',
      isActive: true,
    },
    {
      name: 'Military Domain Activity',
      description: 'Alert on all military domain events above medium impact',
      conditionsJson: { domain: 'MILITARY', field: 'impactScore', operator: 'gte', value: 0.5 },
      severity: 'HIGH',
      alertType: 'THRESHOLD_BREACH',
      isActive: true,
    },
    {
      name: 'Cyber Threat Detection',
      description: 'Alert on cyber domain events',
      conditionsJson: { domain: 'CYBER', field: 'impactScore', operator: 'gte', value: 0.4 },
      severity: 'MEDIUM',
      alertType: 'THRESHOLD_BREACH',
      isActive: true,
    },
  ];

  for (const rule of alertRules) {
    const existing = await prisma.alertRule.findFirst({
      where: { tenantId: tenant.id, name: rule.name },
    });
    if (!existing) {
      await prisma.alertRule.create({
        data: { tenantId: tenant.id, createdByUserId: adminUser.id, ...rule },
      });
    }
  }
  console.log(`✓ Alert Rules: ${alertRules.length} default rules seeded`);

  // ── Score Model ──────────────────────────────────────────────────────────────
  const existingModel = await prisma.scoreModel.findFirst({
    where: { tenantId: tenant.id, isActive: true },
  });

  if (!existingModel) {
    await prisma.scoreModel.create({
      data: {
        tenantId: tenant.id,
        name: 'Default Scoring Model v1',
        version: '1.0.0',
        weightsJson: {
          impact: 0.20,
          urgency: 0.15,
          credibility: 0.15,
          geopoliticalInstability: 0.10,
          economicImpact: 0.08,
          militaryActivity: 0.08,
          cyberThreat: 0.07,
          humanitarianCrisis: 0.05,
          environmentalRisk: 0.04,
          socialUnrest: 0.04,
          technologicalDisruption: 0.02,
          novelty: 0.01,
          corroboration: 0.01,
        },
        isActive: true,
      },
    });
    console.log('✓ Score Model: Default model seeded');
  }

  // ── Report Templates ─────────────────────────────────────────────────────────
  const templates = [
    {
      name: 'Flash Alert',
      reportType: 'FLASH_ALERT',
      brandingJson: { primaryColor: '#C9A84C', secondaryColor: '#0a1628', fontFamily: 'Inter' },
      layoutJson: { pageSize: 'A4', orientation: 'portrait', margins: { top: 40, right: 40, bottom: 40, left: 40 } },
      isDefault: true,
    },
    {
      name: 'Daily Intelligence Brief',
      reportType: 'DAILY_BRIEF',
      brandingJson: { primaryColor: '#C9A84C', secondaryColor: '#0a1628', fontFamily: 'Inter' },
      layoutJson: { pageSize: 'A4', orientation: 'portrait', margins: { top: 40, right: 40, bottom: 40, left: 40 } },
      isDefault: true,
    },
    {
      name: 'Country Risk Dossier',
      reportType: 'COUNTRY_RISK_DOSSIER',
      brandingJson: { primaryColor: '#C9A84C', secondaryColor: '#0a1628', fontFamily: 'Inter' },
      layoutJson: { pageSize: 'A4', orientation: 'portrait', margins: { top: 40, right: 40, bottom: 40, left: 40 } },
      isDefault: true,
    },
    {
      name: 'Threat Assessment',
      reportType: 'THREAT_ASSESSMENT',
      brandingJson: { primaryColor: '#C9A84C', secondaryColor: '#0a1628', fontFamily: 'Inter' },
      layoutJson: { pageSize: 'A4', orientation: 'portrait', margins: { top: 40, right: 40, bottom: 40, left: 40 } },
      isDefault: true,
    },
  ];

  for (const tmpl of templates) {
    const existing = await prisma.reportTemplate.findFirst({
      where: { tenantId: tenant.id, reportType: tmpl.reportType, isDefault: true },
    });
    if (!existing) {
      await prisma.reportTemplate.create({
        data: { tenantId: tenant.id, ...tmpl },
      });
    }
  }
  console.log(`✓ Report Templates: ${templates.length} templates seeded`);

  // ── Watchlists ───────────────────────────────────────────────────────────────
  const watchlists = [
    {
      name: 'Key Countries Monitor',
      description: 'Monitor high-priority countries for geopolitical events',
      watchlistType: 'COUNTRY',
      isActive: true,
      items: ['US', 'CN', 'RU', 'UA', 'IR', 'KP', 'IL', 'SA'],
    },
    {
      name: 'Cyber Threat Keywords',
      description: 'Monitor for cyber attack terminology',
      watchlistType: 'KEYWORD',
      isActive: true,
      items: ['ransomware', 'cyberattack', 'data breach', 'APT', 'zero-day', 'malware', 'phishing'],
    },
    {
      name: 'Energy Sector',
      description: 'Monitor energy infrastructure and supply disruptions',
      watchlistType: 'SECTOR',
      isActive: true,
      items: ['energy', 'oil', 'gas', 'pipeline', 'nuclear'],
    },
  ];

  for (const wl of watchlists) {
    const existing = await prisma.watchlist.findFirst({
      where: { tenantId: tenant.id, name: wl.name },
    });
    if (!existing) {
      const created = await prisma.watchlist.create({
        data: {
          tenantId: tenant.id,
          createdByUserId: adminUser.id,
          name: wl.name,
          description: wl.description,
          watchlistType: wl.watchlistType,
          isActive: wl.isActive,
        },
      });
      for (const value of wl.items) {
        await prisma.watchlistItem.create({
          data: { watchlistId: created.id, value, isActive: true },
        });
      }
    }
  }
  console.log(`✓ Watchlists: ${watchlists.length} watchlists seeded`);

  console.log('\n✅ Seed complete. Platform ready.');
  console.log('\nDefault credentials:');
  console.log('  Admin:   admin@sentinela.local  / sentinela');
  console.log('  Analyst: analyst@sentinela.local / sentinela');
  console.log('  Senior:  senior@sentinela.local  / sentinela');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
