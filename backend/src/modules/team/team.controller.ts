import { Body, Controller, Get, Post } from '@nestjs/common';
import { TeamService } from './team.service';

@Controller('teams')
export class TeamController {
  constructor(private readonly teams: TeamService) {}

  @Post()
  create(@Body('name') name: string) {
    return this.teams.create(name);
  }

  @Get()
  list() {
    return this.teams.findAll();
  }
}
