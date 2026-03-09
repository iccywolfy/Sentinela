import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

@Injectable()
export class WatchlistService {
  async create(data: any, tenantId: string, userId: string) {
    return prisma.watchlist.create({
      data: {
        id: uuidv4(),
        name: data.name,
        type: data.type,
        description: data.description,
        compoundExpression: data.compoundExpression,
        tenantId,
        createdBy: userId,
        items: {
          create: (data.items || []).map((item: any) => ({
            id: uuidv4(),
            value: item.value,
            label: item.label,
            entityId: item.entityId,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findAll(tenantId: string) {
    return prisma.watchlist.findMany({
      where: { tenantId },
      include: { items: true, _count: { select: { alerts: true } } },
    });
  }

  async findOne(id: string, tenantId: string) {
    return prisma.watchlist.findFirst({ where: { id, tenantId }, include: { items: true } });
  }

  async addItem(watchlistId: string, item: any, tenantId: string) {
    return prisma.watchlistItem.create({
      data: {
        id: uuidv4(),
        watchlistId,
        value: item.value,
        label: item.label,
        entityId: item.entityId,
      },
    });
  }

  async removeItem(watchlistId: string, itemId: string) {
    return prisma.watchlistItem.delete({ where: { id: itemId } });
  }

  async remove(id: string, tenantId: string) {
    return prisma.watchlist.update({ where: { id }, data: { isActive: false } });
  }
}
