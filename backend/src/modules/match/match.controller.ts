import { Body, Controller, Get, Param, Post, Delete, ParseIntPipe } from '@nestjs/common';
import { MatchService } from './match.service';

@Controller('matches')
export class MatchController {
  constructor(private readonly svc: MatchService) {}

  @Post('start')
  start(@Body() body: { teamA: string; teamB: string; oversPerSide: number }) {
    return this.svc.start({
      teamA: body.teamA,
      teamB: body.teamB,
      oversPerSide: Number(body.oversPerSide),
    });
  }

  @Get()
  list() {
    return this.svc.list();
  }

  @Get(':code')
  byCode(@Param('code', ParseIntPipe) code: number) {
    return this.svc.byCode(code);
  }

  @Delete(':code')
  remove(@Param('code', ParseIntPipe) code: number) {
    return this.svc.removeByCode(code);
  }
}
