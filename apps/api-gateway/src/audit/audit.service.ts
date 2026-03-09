import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  tenantId?: string;
  userId?: string;
  actionType: string;
  objectType: string;
  objectId?: string;
  actionResult?: 'success' | 'failure';
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  actionDetails?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append-only audit log entry with cryptographic hash chaining.
   * Each entry's hash includes the previous entry's hash for tamper detection.
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      const previousEntry = entry.tenantId
        ? await this.prisma.auditLog.findFirst({
            where: { tenantId: entry.tenantId },
            orderBy: { createdAt: 'desc' },
            select: { entryHash: true },
          })
        : null;

      const previousHash = previousEntry?.entryHash ?? 'GENESIS';
      const timestamp = new Date().toISOString();

      const rawChain = [
        previousHash,
        entry.actionType,
        entry.objectType,
        entry.objectId ?? '',
        entry.userId ?? '',
        timestamp,
      ].join('|');

      const entryHash = createHash('sha256').update(rawChain).digest('hex');

      await this.prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          userId: entry.userId,
          actionType: entry.actionType,
          objectType: entry.objectType,
          objectId: entry.objectId,
          actionResult: entry.actionResult ?? 'success',
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          requestId: entry.requestId,
          actionDetails: entry.actionDetails as object,
          entryHash,
          previousHash,
        },
      });
    } catch (err) {
      // Never let audit failures crash the application
      this.logger.error('Failed to write audit log entry', err);
    }
  }

  /**
   * Verify the cryptographic chain for a tenant's audit log.
   * Returns first broken link if tampering is detected.
   */
  async verifyChain(
    tenantId: string,
    limit = 1000,
  ): Promise<{ valid: boolean; brokenAt?: string; checkedEntries: number }> {
    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true, previousHash: true, entryHash: true },
    });

    for (let i = 1; i < logs.length; i++) {
      const prev = logs[i - 1];
      const cur = logs[i];
      if (cur.previousHash !== prev.entryHash) {
        return { valid: false, brokenAt: cur.id, checkedEntries: i };
      }
    }

    return { valid: true, checkedEntries: logs.length };
  }
}
