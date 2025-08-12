import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  bowl(params: { inningsId: number, over: number, ball: number, outcome: string, runsBatsman?: number, runsExtras?: number, wicket?: boolean, notes?: string }) {
    const { inningsId, over, ball, outcome, runsBatsman = 0, runsExtras = 0, wicket = false, notes } = params;
    return this.prisma.delivery.create({
      data: { inningsId, over, ball, outcome, runsBatsman, runsExtras, wicket, notes },
    });
  }

  list(inningsId: number) {
    return this.prisma.delivery.findMany({ where: { inningsId }, orderBy: [{ over: 'asc' }, { ball: 'asc' }, { id: 'asc' }] });
  }
}
