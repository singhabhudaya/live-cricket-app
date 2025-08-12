import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class InningsService {
  constructor(private prisma: PrismaService) {}

  byMatch(matchId: number) {
    return this.prisma.innings.findMany({ where: { matchId }, orderBy: { number: 'asc' } });
  }

  create(matchId: number, number: number, battingTeamId?: number, bowlingTeamId?: number) {
    return this.prisma.innings.create({ data: { matchId, number, battingTeamId, bowlingTeamId } });
  }
}
