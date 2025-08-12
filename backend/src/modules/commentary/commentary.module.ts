
import { Module } from '@nestjs/common';
import { CommentaryController } from './commentary.controller';
import { MatchService } from '../match/match.service';
import { PrismaService } from '../../prisma.service';
import { RealtimeGateway } from '../../realtime.gateway';

@Module({
  controllers: [CommentaryController],
  providers: [MatchService, PrismaService, RealtimeGateway],
})
export class CommentaryModule {}
