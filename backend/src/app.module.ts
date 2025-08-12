import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MatchModule } from './modules/match/match.module';
import { CommentaryModule } from './modules/commentary/commentary.module';
import { TeamModule } from './modules/team/team.module';
import { PlayerModule } from './modules/player/player.module';
import { InningsModule } from './modules/innings/innings.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [MatchModule, CommentaryModule, TeamModule, PlayerModule, InningsModule, DeliveryModule],
  providers: [PrismaService, RealtimeGateway],
})
export class AppModule {}
