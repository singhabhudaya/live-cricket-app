import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RealtimeGateway } from '../../realtime.gateway';

const LEGAL = new Set(['DOT', 'ONE', 'TWO', 'THREE', 'FOUR', 'SIX', 'BYE', 'LEG_BYE', 'WICKET']);
const isLegal = (e: string) => LEGAL.has(e);

@Injectable()
export class MatchService {
  constructor(private prisma: PrismaService, private rt: RealtimeGateway) {}

  // ----- utilities -----
  private async nextMatchCode(): Promise<number> {
    await this.prisma.sequence.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, matchSeq: 1000 },
    });
    const seq = await this.prisma.sequence.update({
      where: { id: 1 },
      data: { matchSeq: { increment: 1 } },
    });
    return seq.matchSeq;
  }

  private async computeSums(matchId: number) {
    const [i1Rows, i2Rows] = await Promise.all([
      this.prisma.commentary.findMany({ where: { matchId, innings: 1 } }),
      this.prisma.commentary.findMany({ where: { matchId, innings: 2 } }),
    ]);

    const calc = (rows: any[]) => {
      const runs = rows.reduce((a, r) => a + r.runsBat + r.runsExtra, 0);
      const wkts = rows.reduce((a, r) => a + (r.wicket ? 1 : 0), 0);
      const legalBalls = rows.filter((r) => isLegal(r.event)).length;
      const overs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
      return { runs, wkts, legalBalls, overs };
    };

    return { i1: calc(i1Rows), i2: calc(i2Rows) };
  }

  private async nextBall(matchId: number, innings: number) {
    const last = await this.prisma.commentary.findFirst({
      where: { matchId, innings },
      orderBy: [{ over: 'desc' }, { ball: 'desc' }, { id: 'desc' }],
    });
    return { over: last?.over ?? 0, ball: last?.ball ?? 0 };
  }

  // ----- CRUD / queries -----
  async start(params: { teamA: string; teamB: string; oversPerSide: number }) {
    const code = await this.nextMatchCode();
    return this.prisma.match.create({
      data: {
        code,
        teamA: params.teamA,
        teamB: params.teamB,
        oversPerSide: params.oversPerSide,
        currentInnings: 1,
        status: 'LIVE',
      },
    });
  }

  list() {
    return this.prisma.match.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async byCode(code: number) {
    const m = await this.prisma.match.findUnique({
      where: { code },
      include: {
        commentary: {
          orderBy: [{ innings: 'asc' }, { over: 'asc' }, { ball: 'asc' }, { id: 'asc' }],
        },
      },
    });
    if (!m) return null;
    const sums = await this.computeSums(m.id);
    return { ...m, sums };
  }

  async removeByCode(code: number) {
    const match = await this.prisma.match.findUnique({ where: { code } });
    if (!match) throw new NotFoundException('Match not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.commentary.deleteMany({ where: { matchId: match.id } });
      const inns = await tx.innings.findMany({ where: { matchId: match.id }, select: { id: true } });
      if (inns.length) {
        await tx.delivery.deleteMany({ where: { inningsId: { in: inns.map((i) => i.id) } } });
        await tx.innings.deleteMany({ where: { matchId: match.id } });
      }
      await tx.match.delete({ where: { id: match.id } });
    });

    return { ok: true };
  }

  // ----- scoring / transitions -----
  async addCommentary(
    code: number,
    data: { event: string; runsBat?: number; runsExtra?: number; wicket?: boolean; notes?: string },
  ) {
    const match = await this.prisma.match.findUnique({ where: { code } });
    if (!match) throw new BadRequestException('Match not found');
    if (match.status === 'COMPLETED') throw new BadRequestException('Match completed');

    const innings = match.currentInnings;
    const { i1, i2 } = await this.computeSums(match.id);
    const current = innings === 1 ? i1 : i2;

    // overs cap for legal balls
    const maxLegal = match.oversPerSide * 6;
    if (isLegal(data.event) && current.legalBalls >= maxLegal) {
      throw new BadRequestException('Innings complete');
    }

    // work out next (over, ball)
    let { over, ball } = await this.nextBall(match.id, innings);
    if (isLegal(data.event)) {
      if (ball >= 6) {
        over += 1;
        ball = 1;
      } else {
        ball = ball + 1;
      }
    } // extras do not advance

    const entry = await this.prisma.commentary.create({
      data: {
        matchId: match.id,
        innings,
        over,
        ball,
        event: data.event,
        runsBat: Number(data.runsBat ?? 0),
        runsExtra: Number(data.runsExtra ?? 0),
        wicket: Boolean(data.wicket ?? false),
        notes: data.notes,
      },
    });

    // recompute after insert
    const sums = await this.computeSums(match.id);
    const cur = innings === 1 ? sums.i1 : sums.i2;

    // switch to 2nd innings if 1st finished
    if (innings === 1 && cur.legalBalls >= maxLegal) {
      await this.prisma.match.update({
        where: { id: match.id },
        data: { currentInnings: 2 },
      });
      this.rt.broadcastMatchUpdate(code, { currentInnings: 2 });
    }

    // decide result during/after chase
    if (innings === 2) {
      const target = sums.i1.runs + 1;

      if (cur.runs >= target) {
        // chase achieved early
        const wktsLeft = 10 - cur.wkts;
        const result = `${match.teamB} won by ${wktsLeft} wicket${wktsLeft === 1 ? '' : 's'}`;
        await this.prisma.match.update({
          where: { id: match.id },
          data: { status: 'COMPLETED', winner: 'B', result },
        });
        this.rt.broadcastMatchUpdate(code, { status: 'COMPLETED', winner: 'B', result });
      } else if (cur.legalBalls >= maxLegal) {
        // overs exhausted
        if (cur.runs > sums.i1.runs) {
          const wktsLeft = 10 - cur.wkts;
          const result = `${match.teamB} won by ${wktsLeft} wicket${wktsLeft === 1 ? '' : 's'}`;
          await this.prisma.match.update({
            where: { id: match.id },
            data: { status: 'COMPLETED', winner: 'B', result },
          });
          this.rt.broadcastMatchUpdate(code, { status: 'COMPLETED', winner: 'B', result });
        } else if (cur.runs < sums.i1.runs) {
          const margin = sums.i1.runs - cur.runs;
          const result = `${match.teamA} won by ${margin} run${margin === 1 ? '' : 's'}`;
          await this.prisma.match.update({
            where: { id: match.id },
            data: { status: 'COMPLETED', winner: 'A', result },
          });
          this.rt.broadcastMatchUpdate(code, { status: 'COMPLETED', winner: 'A', result });
        } else {
          const result = 'Match tied';
          await this.prisma.match.update({
            where: { id: match.id },
            data: { status: 'COMPLETED', winner: 'TIE', result },
          });
          this.rt.broadcastMatchUpdate(code, { status: 'COMPLETED', winner: 'TIE', result });
        }
      }
    }

    this.rt.broadcastCommentary(code, entry);
    return entry;
  }
}
