import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const DEFAULT_TEMPLATES = [
  {
    name: 'Flash Alert',
    type: 'flash_alert',
    description: '1-page rapid alert for high-priority events',
    defaultSections: [
      { title: 'Executive Summary', type: 'executive_summary', order: 1 },
      { title: 'Key Findings', type: 'analysis', order: 2 },
    ],
    brandingConfig: { primaryColor: '#1a1f36', secondaryColor: '#c9a227', fontFamily: 'Inter', organizationName: 'SENTINELA' },
    isDefault: true,
  },
  {
    name: 'Daily Intelligence Brief',
    type: 'daily_brief',
    description: '3-5 page daily intelligence summary',
    defaultSections: [
      { title: 'Executive Summary', type: 'executive_summary', order: 1 },
      { title: 'Top Geopolitical Events', type: 'analysis', order: 2 },
      { title: 'Cyber Threat Highlights', type: 'analysis', order: 3 },
      { title: 'Financial Risk Indicators', type: 'analysis', order: 4 },
      { title: 'Methodology Notes', type: 'methodology', order: 5 },
    ],
    brandingConfig: { primaryColor: '#1a1f36', secondaryColor: '#c9a227', fontFamily: 'Inter', organizationName: 'SENTINELA' },
    isDefault: true,
  },
  {
    name: 'Country Risk Dossier',
    type: 'country_risk_dossier',
    description: '15-30 page comprehensive country risk assessment',
    defaultSections: [
      { title: 'Country Overview', type: 'executive_summary', order: 1 },
      { title: 'Political Risk Assessment', type: 'analysis', order: 2 },
      { title: 'Economic & Financial Risk', type: 'analysis', order: 3 },
      { title: 'Security Environment', type: 'analysis', order: 4 },
      { title: 'Regulatory Landscape', type: 'analysis', order: 5 },
      { title: 'Cyber Risk Profile', type: 'analysis', order: 6 },
      { title: 'Outlook & Scenarios', type: 'conclusion', order: 7 },
      { title: 'Source Traceability', type: 'appendix', order: 8 },
    ],
    brandingConfig: { primaryColor: '#1a1f36', secondaryColor: '#c9a227', fontFamily: 'Inter', organizationName: 'SENTINELA' },
    isDefault: true,
  },
];

@Injectable()
export class TemplateService {
  async seedDefaults(tenantId: string) {
    for (const tmpl of DEFAULT_TEMPLATES) {
      const exists = await prisma.reportTemplate.findFirst({ where: { tenantId, type: tmpl.type, isDefault: true } });
      if (!exists) {
        await prisma.reportTemplate.create({
          data: { id: uuidv4(), ...tmpl, tenantId },
        });
      }
    }
  }

  async findAll(tenantId: string) {
    return prisma.reportTemplate.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async findOne(id: string, tenantId: string) {
    return prisma.reportTemplate.findFirst({ where: { id, tenantId } });
  }

  async findByType(type: string, tenantId: string) {
    return prisma.reportTemplate.findFirst({ where: { type, tenantId, isDefault: true } });
  }

  async create(data: any, tenantId: string) {
    return prisma.reportTemplate.create({ data: { id: uuidv4(), ...data, tenantId } });
  }
}
