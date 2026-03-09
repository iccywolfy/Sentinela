import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

@Injectable()
export class CaseService {
  async create(data: any, tenantId: string, userId: string) {
    return prisma.investigativeCase.create({
      data: {
        id: uuidv4(),
        title: data.title,
        description: data.description,
        status: 'open',
        priority: data.priority || 'medium',
        deadline: data.deadline ? new Date(data.deadline) : null,
        leadAnalystId: userId,
        assignedIds: data.assignedAnalystIds || [userId],
        tagsJson: data.tags || [],
        tenantId,
        createdBy: userId,
      },
    });
  }

  async findAll(tenantId: string, filters: any = {}) {
    return prisma.investigativeCase.findMany({
      where: {
        tenantId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.leadAnalystId ? { leadAnalystId: filters.leadAnalystId } : {}),
      },
      include: {
        _count: { select: { events: true, notes: true } },
        leadAnalyst: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async findOne(id: string, tenantId: string) {
    const c = await prisma.investigativeCase.findFirst({
      where: { id, tenantId },
      include: {
        events: { include: { event: { include: { scores: { take: 1, orderBy: { computedAt: 'desc' } } } } } },
        notes: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
        attachments: true,
        timelines: true,
        dossiers: { select: { id: true, title: true, status: true, createdAt: true } },
      },
    });
    if (!c) throw new NotFoundException(`Case ${id} not found`);
    return c;
  }

  async update(id: string, data: any, tenantId: string) {
    return prisma.investigativeCase.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.status ? { status: data.status, ...(data.status === 'closed' ? { closedAt: new Date() } : {}) } : {}),
        ...(data.priority ? { priority: data.priority } : {}),
        ...(data.deadline ? { deadline: new Date(data.deadline) } : {}),
      },
    });
  }

  async addEvent(caseId: string, eventId: string, userId: string, tenantId: string) {
    return prisma.caseEvent.upsert({
      where: { caseId_eventId: { caseId, eventId } },
      create: { caseId, eventId, addedBy: userId },
      update: {},
    });
  }

  async addNote(caseId: string, content: string, isAnalytical: boolean, userId: string, tenantId: string) {
    return prisma.caseNote.create({
      data: {
        id: uuidv4(),
        caseId,
        content,
        authorId: userId,
        isAnalytical,
        tagsJson: [],
      },
    });
  }

  async getTimeline(caseId: string, tenantId: string) {
    return prisma.investigativeTimeline.findMany({ where: { caseId, tenantId } });
  }

  async createTimeline(caseId: string, data: any, tenantId: string) {
    return prisma.investigativeTimeline.create({
      data: {
        id: uuidv4(),
        caseId,
        title: data.title,
        entriesJson: data.entries || [],
        tenantId,
      },
    });
  }
}
