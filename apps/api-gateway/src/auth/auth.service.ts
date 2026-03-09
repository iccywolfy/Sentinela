import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(email: string, password: string) {
    // Dev-mode: accept any login, create user if not exists
    let user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      const tenant = await prisma.tenant.findFirst() || await prisma.tenant.create({
        data: {
          name: 'Default Organization',
          slug: 'default',
          id: 'default',
          featuresJson: { narrativeIntelligence: true, aiAssistant: false, vectorSearch: false, apiAccess: true, customReports: true, crisisRoom: true },
        },
      });
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          role: 'admin',
          tenantId: tenant.id,
          isActive: true,
        },
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    };
  }

  async getProfile(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, tenantId: true, preferencesJson: true } });
  }
}
