import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true, namespace: '/ws' })
export class RealtimeGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('join')
  handleJoin(@MessageBody() payload: { matchCode: number }, @ConnectedSocket() client: Socket) {
    client.join(`match:${payload.matchCode}`);
    return { ok: true };
  }

  broadcastCommentary(matchCode: number, entry: any) {
    this.server.to(`match:${matchCode}`).emit('commentary:new', entry);
  }

  broadcastMatchUpdate(matchCode: number, payload: any) {
    this.server.to(`match:${matchCode}`).emit('match:update', payload);
  }
}
