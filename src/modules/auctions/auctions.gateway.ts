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
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'auctions',
})
export class AuctionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AuctionsGateway.name);

  constructor(private readonly auctionsService: AuctionsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`WS Client connected: ${client.id}`);
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
      bidderId: string;
      amount: number;
      isProxy?: boolean;
      maxProxyAmount?: number;
    },
  ) {
    try {
      const result = await this.auctionsService.placeBid(
        data.auctionId,
        data.bidderId,
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
