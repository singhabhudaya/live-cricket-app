import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  create(name: string) {
    return this.prisma.team.create({ data: { name } });
  }

  findAll() {
    return this.prisma.team.findMany({ orderBy: { name: 'asc' } });
  }
}
