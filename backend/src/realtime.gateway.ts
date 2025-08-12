import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

function parseOrigins() {
  return (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}
const allowed = new Set(parseOrigins());

@WebSocketGateway({
  path: '/ws',
  cors: {
    origin: (origin: string | undefined, cb: (err: any, ok?: boolean) => void) => {
      if (!origin) return cb(null, true);
      cb(null, allowed.has(origin));
    },
  },
})
export class RealtimeGateway {
  @WebSocketServer() server: Server;
  // ... your existing gateway code
}
