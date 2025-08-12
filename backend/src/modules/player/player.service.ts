import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class PlayerService {
  constructor(private prisma: PrismaService) {}

  create(name: string, teamId: number) {
    return this.prisma.player.create({ data: { name, teamId } });
  }

  list(teamId?: number) {
    return this.prisma.player.findMany({ where: teamId ? { teamId } : {}, orderBy: { id: 'asc' } });
  }
}
