// backend/src/realtime.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

const parseOrigins = () =>
  (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

@WebSocketGateway({
  cors: { origin: parseOrigins().length ? parseOrigins() : true },
  transports: ['websocket'],
  // If your local build used a custom path, keep it:
  // @ts-ignore - socket.io option passed through Nest
  path: '/ws',
})
export class RealtimeGateway {
  @WebSocketServer() server: Server;

  private room(code: number | string) {
    return `match:${code}`;
  }

  @SubscribeMessage('join')
  onJoin(@MessageBody() body: any, @ConnectedSocket() socket: Socket) {
    const code = body?.matchCode ?? body?.code;
    if (!code) return;
    socket.join(this.room(code));
    socket.emit('joined', { room: this.room(code) });
  }

  // ---- helpers used by MatchService ----
  broadcastCommentary(code: number | string, entry: any) {
    this.server.to(this.room(code)).emit('commentary:new', entry);
  }

  broadcastMatchUpdate(code: number | string, payload: any) {
    this.server.to(this.room(code)).emit('match:update', payload);
  }
}
