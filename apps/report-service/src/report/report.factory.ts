import { Injectable } from '@nestjs/common';

export interface ReportContent {
  title: string;
  classification: string;
  sections: ReportSection[];
  metadata: Record<string, unknown>;
}

export interface ReportSection {
  title: string;
  content: string;
  type: string;
  order: number;
}

@Injectable()
export class ReportFactory {
  build(type: string, data: any, events: any[], template: any): ReportContent {
    const sections = this.buildSections(type, data, events, template);
    return {
      title: data.title || this.defaultTitle(type, data),
      classification: data.infoClassification || 'internal',
      sections,
      metadata: {
        type,
        generatedAt: new Date().toISOString(),
        eventCount: events.length,
        methodology: 'OSINT aggregation, multi-source fusion, automated risk scoring',
      },
    };
  }

  private buildSections(type: string, data: any, events: any[], template: any): ReportSection[] {
    const defaultSections: any[] = template?.defaultSections || this.getDefaultSections(type);
    return defaultSections.map((section: any, idx: number) => ({
      title: section.title,
      type: section.type,
      order: section.order || idx + 1,
      content: this.generateSectionContent(section.type, data, events),
    }));
  }

  private generateSectionContent(sectionType: string, data: any, events: any[]): string {
    switch (sectionType) {
      case 'executive_summary':
        return this.generateExecutiveSummary(data, events);
      case 'analysis':
        return this.generateAnalysis(data, events);
      case 'methodology':
        return this.generateMethodology();
      case 'conclusion':
        return this.generateConclusion(data, events);
      case 'appendix':
        return this.generateAppendix(events);
      default:
        return data.customContent?.[sectionType] || 'Content to be added by analyst.';
    }
  }

  private generateExecutiveSummary(data: any, events: any[]): string {
    const topEvent = events[0];
    const domains = [...new Set(events.map((e) => e.eventDomain))];
    return `This report covers ${events.length} intelligence events across domains: ${domains.join(', ')}. ` +
      (topEvent ? `The highest priority event is "${topEvent.title}" with an impact score of ${(topEvent.impactScore * 100).toFixed(0)}%.` : '') +
      ` Analysis period: ${data.dateRange?.from || 'last 7 days'} to ${data.dateRange?.to || 'present'}.`;
  }

  private generateAnalysis(data: any, events: any[]): string {
    if (!events.length) return 'No significant events recorded in this period.';
    const sorted = [...events].sort((a, b) => b.impactScore - a.impactScore);
    return sorted.slice(0, 5).map((e, i) =>
      `${i + 1}. **${e.title}** (${e.eventDomain}, ${new Date(e.occurredAt).toISOString().split('T')[0]})\n${e.summary || 'See full event details.'}`
    ).join('\n\n');
  }

  private generateMethodology(): string {
    return `Intelligence gathered exclusively from open-source, legally accessible sources (OSINT). ` +
      `Automated pipeline with 18-stage processing including NLP enrichment, entity extraction, and credibility scoring. ` +
      `Correlation engine applies 8 methods including temporal, geographic, entity-based, and cross-domain analysis. ` +
      `Risk scores computed using configurable 9-dimension framework. All conclusions are traceable to source material.`;
  }

  private generateConclusion(data: any, events: any[]): string {
    const escalating = events.filter((e) => e.eventStatus === 'escalating').length;
    return `Based on current intelligence, ${escalating > 0 ? `${escalating} situation(s) show escalatory trends requiring monitoring.` : 'no immediate escalatory trends identified.'} ` +
      `Continued monitoring recommended for high-impact events identified in this report.`;
  }

  private generateAppendix(events: any[]): string {
    return events.map((e) =>
      `• ${e.title} | Source: ${e.primarySourceId} | Collected: ${new Date(e.processedAt).toISOString().split('T')[0]}`
    ).join('\n');
  }

  private getDefaultSections(type: string) {
    const common = [
      { title: 'Executive Summary', type: 'executive_summary', order: 1 },
      { title: 'Analysis', type: 'analysis', order: 2 },
      { title: 'Methodology', type: 'methodology', order: 3 },
      { title: 'Conclusion', type: 'conclusion', order: 4 },
    ];
    if (type === 'country_risk_dossier' || type === 'special_report') {
      common.push({ title: 'Source Traceability', type: 'appendix', order: 5 });
    }
    return common;
  }

  private defaultTitle(type: string, data: any): string {
    const titles: Record<string, string> = {
      flash_alert: `Flash Alert — ${new Date().toISOString().split('T')[0]}`,
      daily_brief: `Daily Intelligence Brief — ${new Date().toISOString().split('T')[0]}`,
      weekly_strategic: `Weekly Strategic Review — Week ${this.getWeekNumber()}`,
      country_risk_dossier: `Country Risk Dossier — ${data.countryCode || 'Unknown'}`,
      crisis_escalation: `Crisis Escalation Assessment — ${new Date().toISOString().split('T')[0]}`,
    };
    return titles[type] || `SENTINELA Report — ${new Date().toISOString().split('T')[0]}`;
  }

  private getWeekNumber(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  }
}
