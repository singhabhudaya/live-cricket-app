import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PlayerService } from './player.service';

@Controller('players')
export class PlayerController {
  constructor(private readonly players: PlayerService) {}

  @Post()
  create(@Body('name') name: string, @Body('teamId') teamId: number) {
    return this.players.create(name, Number(teamId));
  }

  @Get()
  list(@Query('teamId') teamId?: string) {
    return this.players.list(teamId ? Number(teamId) : undefined);
  }
}
