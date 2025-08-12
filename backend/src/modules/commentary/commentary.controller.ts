import { Body, Controller, Param, Post } from '@nestjs/common';
import { MatchService } from '../match/match.service';

@Controller('matches/:code/commentary')
export class CommentaryController {
  constructor(private readonly matches: MatchService) {}

  @Post()
  add(
    @Param('code') code: string,
    @Body() body: { event: string; runsBat?: number; runsExtra?: number; wicket?: boolean; notes?: string }
  ) {
    return this.matches.addCommentary(Number(code), body);
  }
}
