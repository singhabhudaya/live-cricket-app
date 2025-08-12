
import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { PrismaService } from '../../prisma.service';
import { RealtimeGateway } from '../../realtime.gateway';

@Module({
  controllers: [MatchController],
  providers: [MatchService, PrismaService, RealtimeGateway],
  exports: [MatchService],
})
export class MatchModule {}
