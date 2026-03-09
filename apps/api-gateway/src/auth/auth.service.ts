import {
  Injectable, UnauthorizedException, ForbiddenException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCK_MINUTES = 15;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, meta: { ip?: string; userAgent?: string } = {}) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({ where: { email: normalizedEmail } });

    if (!user) {
      await bcrypt.compare(password, '$2b$12$invalidhash.invalidhash.invalidha');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account temporarily locked. Try again later.');
    }

    if (user.status !== 'active') throw new ForbiddenException('Account is disabled');

    if (!user.passwordHash) {
      throw new UnauthorizedException('Password authentication not available for this account');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await this.recordFailedLogin(user.id, user.tenantId, meta);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.tenantId);

    await this.audit.log({
      tenantId: user.tenantId,
      userId: user.id,
      actionType: 'login',
      objectType: 'user_session',
      objectId: user.id,
      actionResult: 'success',
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });

    return {
      ...tokens,
      user: { id: user.id, email: user.email, tenantId: user.tenantId },
    };
  }

  async refresh(rawRefreshToken: string, meta: { ip?: string } = {}): Promise<TokenPair> {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(rawRefreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') throw new UnauthorizedException('Wrong token type');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'active') throw new UnauthorizedException('User not found');

    const incomingHash = createHash('sha256').update(rawRefreshToken).digest('hex');
    if (user.refreshTokenHash !== incomingHash) {
      await this.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: null } });
      await this.audit.log({
        tenantId: user.tenantId, userId: user.id,
        actionType: 'refresh_token_reuse', objectType: 'user_session', actionResult: 'failure',
        ipAddress: meta.ip,
      });
      throw new UnauthorizedException('Token reuse detected. Please login again.');
    }

    return this.issueTokens(user.id, user.tenantId);
  }

  async logout(userId: string, meta: { ip?: string } = {}): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { id: true, tenantId: true },
    });
    if (!user) return;
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
    await this.audit.log({
      tenantId: user.tenantId, userId: user.id,
      actionType: 'logout', objectType: 'user_session', actionResult: 'success',
      ipAddress: meta.ip,
    });
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, tenantId: true, mfaEnabled: true, lastLoginAt: true, status: true },
    });
  }

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.BCRYPT_ROUNDS);
  }

  private async issueTokens(userId: string, tenantId: string): Promise<TokenPair> {
    const jti = randomBytes(16).toString('hex');
    const accessToken = this.jwtService.sign({ sub: userId, tenantId, type: 'access' });
    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh', jti },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '8h'),
      },
    );
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash } });
    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private async recordFailedLogin(
    userId: string, tenantId: string, meta: { ip?: string; userAgent?: string },
  ): Promise<void> {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { failedLoginCount: true } });
    const count = (u?.failedLoginCount ?? 0) + 1;
    const lock = count >= this.MAX_FAILED_ATTEMPTS;
    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: count, ...(lock ? { lockedUntil: new Date(Date.now() + this.LOCK_MINUTES * 60000) } : {}) },
    });
    await this.audit.log({
      tenantId, userId, actionType: 'login_failed', objectType: 'user_session', actionResult: 'failure',
      ipAddress: meta.ip, userAgent: meta.userAgent, actionDetails: { count, locked: lock },
    });
    if (lock) this.logger.warn(`Account ${userId} locked after ${count} failures`);
  }
}
