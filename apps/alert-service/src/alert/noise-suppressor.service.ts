import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class NoiseSuppressor implements OnModuleInit {
  private redis: Redis;

  onModuleInit() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async shouldAlert(ruleId: string, tenantId: string): Promise<boolean> {
    const key = `cooldown:${tenantId}:${ruleId}`;
    const inCooldown = await this.redis.exists(key);
    return inCooldown === 0;
  }

  async recordAlert(ruleId: string, tenantId: string, cooldownMinutes: number): Promise<void> {
    const key = `cooldown:${tenantId}:${ruleId}`;
    await this.redis.setex(key, cooldownMinutes * 60, '1');
  }

  async isDuplicate(key: string, tenantId: string): Promise<boolean> {
    const fullKey = `dedup:${tenantId}:${key}`;
    return (await this.redis.exists(fullKey)) === 1;
  }

  async markDuplicate(key: string, tenantId: string, ttlMinutes: number): Promise<void> {
    const fullKey = `dedup:${tenantId}:${key}`;
    await this.redis.setex(fullKey, ttlMinutes * 60, '1');
  }
}
