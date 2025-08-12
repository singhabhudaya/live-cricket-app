import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveries: DeliveryService) {}

  @Post()
  bowl(
    @Body('inningsId') inningsId: number,
    @Body('over') over: number,
    @Body('ball') ball: number,
    @Body('outcome') outcome: string,
    @Body('runsBatsman') runsBatsman?: number,
    @Body('runsExtras') runsExtras?: number,
    @Body('wicket') wicket?: boolean,
    @Body('notes') notes?: string,
  ) {
    return this.deliveries.bowl({ inningsId: Number(inningsId), over: Number(over), ball: Number(ball), outcome, runsBatsman, runsExtras, wicket, notes });
  }

  @Get()
  list(@Query('inningsId') inningsId: string) {
    return this.deliveries.list(Number(inningsId));
  }
}
