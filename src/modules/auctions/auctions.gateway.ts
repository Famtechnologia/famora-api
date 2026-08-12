import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuctionsService } from './auctions.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: /(^https:\/\/([a-z0-9-]+\.)*famtech\.llc$)|(\.vercel\.app$)|(^http:\/\/localhost(:\d+)?$)/i,
  },
  namespace: 'auctions',
})
export class AuctionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AuctionsGateway.name);

  constructor(
    private readonly auctionsService: AuctionsService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    // Authenticate the socket from its handshake token. Without a valid token
    // the connection is refused, so a client can never place a bid as someone
    // else — the bidder identity comes from the verified token, not the payload.
    const raw =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.headers?.authorization as string | undefined);
    const token = raw?.replace(/^Bearer\s+/i, '');

    if (!token) {
      this.logger.warn(`WS Client rejected (no token): ${client.id}`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      this.logger.log(`WS Client connected: ${client.id} (user ${payload.sub})`);
    } catch {
      this.logger.warn(`WS Client rejected (invalid token): ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WS Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinAuction')
  handleJoinAuction(@MessageBody() data: { auctionId: string }, @ConnectedSocket() client: Socket) {
    client.join(`auction:${data.auctionId}`);
    this.logger.log(`Client ${client.id} joined room auction:${data.auctionId}`);
    return { status: 'SUCCESS', room: `auction:${data.auctionId}` };
  }

  @SubscribeMessage('placeBid')
  async handlePlaceBid(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      auctionId: string;
      amount: number;
      isProxy?: boolean;
      maxProxyAmount?: number;
    },
  ) {
    // Bidder identity comes from the authenticated socket, never the payload.
    const bidderId = client.data?.userId as string | undefined;
    if (!bidderId) {
      return { status: 'ERROR', message: 'Unauthorized' };
    }

    try {
      const result = await this.auctionsService.placeBid(
        data.auctionId,
        bidderId,
        data.amount,
        data.isProxy,
        data.maxProxyAmount,
      );

      // Broadcast real-time update to all clients watching this auction
      this.server.to(`auction:${data.auctionId}`).emit('bidReceived', {
        auction: result.auction,
        newBid: result.newBid,
        notification: result.message,
      });

      return { status: 'SUCCESS', message: result.message };
    } catch (err: any) {
      return { status: 'ERROR', message: err.message };
    }
  }
}
