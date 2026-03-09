import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

@Injectable()
export class CollectionService {
  async create(data: any, tenantId: string, userId: string) {
    return prisma.collection.create({
      data: {
        id: uuidv4(),
        name: data.name,
        description: data.description,
        infoClassification: data.infoClassification || 'internal',
        tagsJson: data.tags || [],
        entityIdsJson: data.entityIds || [],
        tenantId,
        createdBy: userId,
      },
    });
  }

  async findAll(tenantId: string) {
    return prisma.collection.findMany({
      where: { tenantId },
      include: { _count: { select: { events: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async addEvent(collectionId: string, eventId: string) {
    return prisma.collectionEvent.upsert({
      where: { collectionId_eventId: { collectionId, eventId } },
      create: { collectionId, eventId },
      update: {},
    });
  }

  async removeEvent(collectionId: string, eventId: string) {
    return prisma.collectionEvent.delete({ where: { collectionId_eventId: { collectionId, eventId } } });
  }

  async findOne(id: string, tenantId: string) {
    return prisma.collection.findFirst({
      where: { id, tenantId },
      include: { events: { include: { event: true } } },
    });
  }
}
