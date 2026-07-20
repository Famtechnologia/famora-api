import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAuctionDto } from './dto/create-auction.dto';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);
  private readonly bidIncrement = 1000; // NGN 1,000 minimum raise

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAuctionDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${dto.listingId} not found`);
    }

    const existingAuction = await this.prisma.auction.findUnique({
      where: { listingId: dto.listingId },
    });

    if (existingAuction) {
      throw new BadRequestException('An auction already exists for this listing');
    }

    return this.prisma.auction.create({
      data: {
        listingId: dto.listingId,
        startPrice: dto.startPrice,
        reservePrice: dto.reservePrice,
        currentBid: dto.startPrice,
        endsAt: new Date(dto.endsAt),
        status: 'ACTIVE',
      },
      include: { listing: true },
    });
  }

  async findAll() {
    return this.prisma.auction.findMany({
      include: {
        listing: true,
        highestBidder: {
          select: { id: true, name: true },
        },
      },
      orderBy: { endsAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: {
        listing: true,
        bids: {
          orderBy: { createdAt: 'desc' },
          include: { bidder: { select: { name: true } } },
        },
        highestBidder: { select: { id: true, name: true } },
      },
    });

    if (!auction) {
      throw new NotFoundException(`Auction with ID ${id} not found`);
    }

    return auction;
  }

  async placeBid(
    auctionId: string,
    bidderId: string,
    amount: number,
    isProxy = false,
    maxProxyAmount?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: { bids: true },
      });

      if (!auction) {
        throw new NotFoundException('Auction not found');
      }

      if (auction.status !== 'ACTIVE' || new Date() > auction.endsAt) {
        throw new BadRequestException('This auction is no longer active');
      }

      const minBidRequired = auction.highestBidderId ? auction.currentBid + this.bidIncrement : auction.startPrice;
      if (amount < minBidRequired) {
        throw new BadRequestException(`Bid must be at least ₦${minBidRequired}`);
      }

      // Check if another bidder has an active higher proxy bid
      const activeProxies = await tx.bid.findMany({
        where: {
          auctionId,
          isProxy: true,
          maxProxyAmount: { gte: amount },
          bidderId: { not: bidderId },
        },
        orderBy: { maxProxyAmount: 'desc' },
      });

      if (activeProxies.length > 0) {
        const topProxy = activeProxies[0];
        
        // The top proxy outbids this new bid. We raise the price to either new amount + increment, or topProxy.maxProxyAmount (whichever is lower)
        const autoCounterBid = Math.min(amount + this.bidIncrement, topProxy.maxProxyAmount!);

        // Create the new loser bid
        await tx.bid.create({
          data: {
            auctionId,
            bidderId,
            amount,
            isProxy,
            maxProxyAmount,
          },
        });

        // Create the auto-counter winning proxy bid
        const counterBid = await tx.bid.create({
          data: {
            auctionId,
            bidderId: topProxy.bidderId,
            amount: autoCounterBid,
            isProxy: true,
            maxProxyAmount: topProxy.maxProxyAmount,
          },
        });

        // Update auction
        const updatedAuction = await tx.auction.update({
          where: { id: auctionId },
          data: {
            currentBid: autoCounterBid,
            highestBidderId: topProxy.bidderId,
          },
          include: {
            listing: true,
            highestBidder: { select: { id: true, name: true } },
          },
        });

        return {
          auction: updatedAuction,
          message: `Your bid of ₦${amount} was immediately outbid by an automatic proxy bid.`,
          newBid: counterBid,
        };
      }

      // If no stronger proxy, this bid is the current highest bid
      const newBid = await tx.bid.create({
        data: {
          auctionId,
          bidderId,
          amount,
          isProxy,
          maxProxyAmount,
        },
      });

      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentBid: amount,
          highestBidderId: bidderId,
        },
        include: {
          listing: true,
          highestBidder: { select: { id: true, name: true } },
        },
      });

      return {
        auction: updatedAuction,
        message: `Successfully placed bid of ₦${amount}`,
        newBid,
      };
    });
  }
}
