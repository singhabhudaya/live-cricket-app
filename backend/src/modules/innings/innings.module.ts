import { Module } from '@nestjs/common';
import { InningsService } from './innings.service';
import { InningsController } from './innings.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [InningsController],
  providers: [InningsService, PrismaService],
  exports: [InningsService],
})
export class InningsModule {}
