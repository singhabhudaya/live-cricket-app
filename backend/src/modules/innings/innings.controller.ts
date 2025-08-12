import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InningsService } from './innings.service';

@Controller('innings')
export class InningsController {
  constructor(private readonly innings: InningsService) {}

  @Get()
  byMatch(@Query('matchId') matchId: string) {
    return this.innings.byMatch(Number(matchId));
  }

  @Post()
  create(
    @Body('matchId') matchId: number,
    @Body('number') number: number,
    @Body('battingTeamId') battingTeamId?: number,
    @Body('bowlingTeamId') bowlingTeamId?: number,
  ) {
    return this.innings.create(Number(matchId), Number(number), battingTeamId ? Number(battingTeamId) : undefined, bowlingTeamId ? Number(bowlingTeamId) : undefined);
  }
}
