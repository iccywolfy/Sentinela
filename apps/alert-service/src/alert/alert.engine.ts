import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { NoiseSuppressor } from './noise-suppressor.service';

const prisma = new PrismaClient();

export enum AlertType {
  REAL_TIME_EVENT = 'real_time_event',
  THRESHOLD = 'threshold',
  SIGNAL_COMBINATION = 'signal_combination',
  WATCHLIST = 'watchlist',
  COUNTRY = 'country',
  ENTITY = 'entity',
  SECTOR = 'sector',
  THEME = 'theme',
  ESCALATION = 'escalation',
  NARRATIVE_SHIFT = 'narrative_shift',
}

@Injectable()
export class AlertEngine {
  private readonly logger = new Logger(AlertEngine.name);

  constructor(private readonly noiseSuppressor: NoiseSuppressor) {}

  async evaluateEvent(event: any): Promise<void> {
    const tenantId = event.tenantId;
    const rules = await prisma.alertRule.findMany({ where: { tenantId, isActive: true } });

    for (const rule of rules) {
      if (!await this.noiseSuppressor.shouldAlert(rule.id, tenantId)) continue;

      const conditions = rule.conditionsJson as any[];
      const matches = conditions.every((c) => this.evaluateCondition(event, c));

      if (matches) {
        await this.createAlert({
          tenantId,
          ruleId: rule.id,
          type: rule.type as AlertType,
          severity: rule.severity,
          event,
          rule,
        });
        await this.noiseSuppressor.recordAlert(rule.id, tenantId, rule.cooldownMinutes);
      }
    }

    // Built-in threshold checks
    await this.checkThresholds(event);
    await this.checkWatchlists(event);
  }

  private async checkThresholds(event: any) {
    const thresholds = [
      { field: 'impactScore', threshold: 0.8, severity: 'high', type: AlertType.THRESHOLD },
      { field: 'urgencyScore', threshold: 0.85, severity: 'critical', type: AlertType.THRESHOLD },
      { field: 'credibilityScore', threshold: 0.9, severity: 'medium', type: AlertType.REAL_TIME_EVENT },
    ];

    for (const check of thresholds) {
      const value = event[check.field] as number;
      if (value >= check.threshold) {
        const key = `threshold:${check.field}:${event.id}`;
        if (await this.noiseSuppressor.isDuplicate(key, event.tenantId)) continue;

        await this.createAlert({
          tenantId: event.tenantId,
          type: check.type,
          severity: check.severity,
          title: `High ${check.field} Event Detected`,
          summary: `Event "${event.title}" has ${check.field} of ${value.toFixed(2)} (threshold: ${check.threshold})`,
          rationale: `Automatic threshold detection: ${check.field} >= ${check.threshold}`,
          event,
        });
        await this.noiseSuppressor.markDuplicate(key, event.tenantId, 60);
      }
    }
  }

  private async checkWatchlists(event: any) {
    const watchlists = await prisma.watchlist.findMany({
      where: { tenantId: event.tenantId, isActive: true },
      include: { items: true },
    });

    for (const watchlist of watchlists) {
      const matched = this.matchesWatchlist(event, watchlist);
      if (!matched) continue;

      const key = `watchlist:${watchlist.id}:${event.id}`;
      if (await this.noiseSuppressor.isDuplicate(key, event.tenantId)) continue;

      await this.createAlert({
        tenantId: event.tenantId,
        type: AlertType.WATCHLIST,
        severity: 'medium',
        title: `Watchlist Hit: ${watchlist.name}`,
        summary: `Event "${event.title}" matched watchlist "${watchlist.name}"`,
        rationale: `Watchlist "${watchlist.name}" (${watchlist.type}) was triggered`,
        event,
        watchlistId: watchlist.id,
      });
      await this.noiseSuppressor.markDuplicate(key, event.tenantId, 120);
    }
  }

  private matchesWatchlist(event: any, watchlist: any): boolean {
    const items = watchlist.items as any[];
    const actors: any[] = (event.involvedActorsJson as any[]) || [];
    const orgs: string[] = (event.organizationsJson as string[]) || [];
    const tags: string[] = (event.tagsJson as string[]) || [];
    const loc = (event.locationJson as any) || {};

    for (const item of items) {
      const v = item.value.toLowerCase();
      switch (watchlist.type) {
        case 'country':
          if (loc.countryCode?.toLowerCase() === v || loc.country?.toLowerCase() === v) return true;
          break;
        case 'entity':
          if (actors.some((a) => a.name?.toLowerCase() === v) || orgs.some((o) => o.toLowerCase().includes(v))) return true;
          break;
        case 'theme':
          if (tags.some((t) => t.toLowerCase().includes(v))) return true;
          break;
        case 'sector':
          if ((event.sectorsImpactedJson as string[])?.some((s) => s.toLowerCase().includes(v))) return true;
          break;
      }
    }
    return false;
  }

  private evaluateCondition(event: any, condition: any): boolean {
    const value = this.getNestedValue(event, condition.field);
    switch (condition.operator) {
      case 'gt': return Number(value) > Number(condition.value);
      case 'gte': return Number(value) >= Number(condition.value);
      case 'lt': return Number(value) < Number(condition.value);
      case 'lte': return Number(value) <= Number(condition.value);
      case 'eq': return value === condition.value;
      case 'in': return Array.isArray(condition.value) && condition.value.includes(value);
      case 'contains': return String(value || '').includes(String(condition.value));
      default: return false;
    }
  }

  private getNestedValue(obj: any, path: string): unknown {
    return path.split('.').reduce((acc, k) => acc?.[k], obj);
  }

  private async createAlert(opts: {
    tenantId: string;
    type: AlertType;
    severity: string;
    title?: string;
    summary?: string;
    rationale?: string;
    event?: any;
    rule?: any;
    ruleId?: string;
    watchlistId?: string;
  }) {
    const { tenantId, type, severity, event, rule, watchlistId } = opts;
    const title = opts.title || rule?.name || `${type} Alert`;
    const summary = opts.summary || `New ${type} alert triggered`;
    const rationale = opts.rationale || `Automated detection by alert engine`;

    const alert = await prisma.alert.create({
      data: {
        id: uuidv4(),
        type,
        severity,
        status: 'new',
        title,
        summary,
        rationale,
        evidence: [],
        recommendations: [],
        recipientsJson: rule?.recipientIds || [],
        watchlistId: watchlistId || null,
        tenantId,
      },
    });

    if (event?.id) {
      await prisma.alertEvent.create({
        data: { alertId: alert.id, eventId: event.id },
      }).catch(() => {}); // ignore if event doesn't exist yet
    }

    this.logger.log(`Alert created: [${severity}] ${title} (${type})`);
    return alert;
  }
}
