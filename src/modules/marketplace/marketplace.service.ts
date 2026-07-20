import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { SyncOfflineDto } from './dto/sync-offline.dto';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(private prisma: PrismaService) {}

  async create(farmerId: string, dto: CreateListingDto) {
    return this.prisma.listing.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        price: dto.price,
        quantity: dto.quantity,
        unit: dto.unit,
        category: dto.category.toUpperCase(),
        imageUrl: dto.imageUrl || null,
        harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : null,
        originCoordinates: dto.originCoordinates || null,
        qualityCertification: dto.qualityCertification || null,
        breed: dto.breed || null,
        healthRecords: dto.healthRecords || null,
        weight: dto.weight || null,
        exportCompliant: dto.exportCompliant ?? false,
        farmerId,
      },
    });
  }

  async findAll(filters: { category?: string; search?: string; exportCompliant?: boolean }) {
    const where: any = {};

    if (filters.category) {
      where.category = filters.category.toUpperCase();
    }

    if (filters.exportCompliant !== undefined) {
      where.exportCompliant = filters.exportCompliant;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { breed: { contains: filters.search } },
      ];
    }

    return this.prisma.listing.findMany({
      where,
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
            region: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { farmer: true },
    });
    
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }
    
    return listing;
  }

  async createOrder(buyerId: string, dto: CreateOrderDto) {
    const listing = await this.findOne(dto.listingId);

    if (listing.quantity < dto.quantity) {
      throw new BadRequestException('Insufficient stock for this listing');
    }

    const totalPrice = listing.price * dto.quantity;

    // Transaction: Create order & deduct stock
    return this.prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id: listing.id },
        data: { quantity: listing.quantity - dto.quantity },
      });

      return tx.order.create({
        data: {
          buyerId,
          listingId: listing.id,
          quantity: dto.quantity,
          totalPrice,
          status: 'COMPLETED', // Auto-completed for direct marketplace purchase
        },
        include: {
          listing: true,
        },
      });
    });
  }

  async syncOfflineData(userId: string, dto: SyncOfflineDto) {
    const errors: string[] = [];
    const tempIdMap = new Map<string, string>();
    let syncedListingsCount = 0;
    let syncedOrdersCount = 0;

    // 1. Process Offline Listings
    for (const listingEntry of dto.listings) {
      try {
        const created = await this.create(userId, listingEntry);
        syncedListingsCount++;
        
        if (listingEntry.tempId) {
          tempIdMap.set(listingEntry.tempId, created.id);
        }
      } catch (err: any) {
        this.logger.error(`Offline listing sync error: ${err.message}`);
        errors.push(`Failed to sync listing "${listingEntry.title}": ${err.message}`);
      }
    }

    // 2. Process Offline Orders
    for (const orderEntry of dto.orders) {
      try {
        // Idempotency check: check if order with syncId already exists
        const existingOrder = await this.prisma.order.findFirst({
          where: { syncId: orderEntry.syncId },
        });

        if (existingOrder) {
          syncedOrdersCount++;
          continue; // Already synced, skip to prevent duplicate double-charge
        }

        // Resolve Listing ID (either database UUID or mapped tempId)
        let resolvedListingId = orderEntry.tempListingId;
        if (tempIdMap.has(resolvedListingId)) {
          resolvedListingId = tempIdMap.get(resolvedListingId)!;
        }

        const listing = await this.prisma.listing.findUnique({
          where: { id: resolvedListingId },
        });

        if (!listing) {
          errors.push(`Failed to sync order for syncId ${orderEntry.syncId}: Listing not found`);
          continue;
        }

        if (listing.quantity < orderEntry.quantity) {
          errors.push(`Failed to sync order for syncId ${orderEntry.syncId}: Insufficient stock on listing "${listing.title}"`);
          continue;
        }

        const totalPrice = listing.price * orderEntry.quantity;

        // Sync order in transaction
        await this.prisma.$transaction(async (tx) => {
          await tx.listing.update({
            where: { id: listing.id },
            data: { quantity: listing.quantity - orderEntry.quantity },
          });

          await tx.order.create({
            data: {
              buyerId: userId,
              listingId: listing.id,
              quantity: orderEntry.quantity,
              totalPrice,
              status: 'COMPLETED',
              syncId: orderEntry.syncId,
            },
          });
        });

        syncedOrdersCount++;
      } catch (err: any) {
        this.logger.error(`Offline order sync error: ${err.message}`);
        errors.push(`Failed to sync order with syncId ${orderEntry.syncId}: ${err.message}`);
      }
    }

    return {
      syncedListingsCount,
      syncedOrdersCount,
      errors,
      idMap: Object.fromEntries(tempIdMap),
    };
  }
}
