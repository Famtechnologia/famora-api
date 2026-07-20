import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class TraceabilityService {
  constructor(private prisma: PrismaService) {}

  async getProvenance(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            farmLocation: true,
            region: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${listingId} not found`);
    }

    const payload = {
      listingId: listing.id,
      commodity: listing.title,
      category: listing.category,
      originCoordinates: listing.originCoordinates || 'Unavailable',
      farmLocation: listing.farmer.farmLocation || 'Unavailable',
      region: listing.farmer.region || 'Unavailable',
      harvestDate: listing.harvestDate || 'Unavailable',
      qualityCertification: listing.qualityCertification || 'Standard Grade',
      farmerName: listing.farmer.name,
      traceabilityVersion: '1.0.0-crypto-ready',
      verifiedTimestamp: new Date().toISOString(),
    };

    // Generate QR Code data URL containing the JSON representation
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(payload));

    return {
      qrCodeDataUrl,
      payload,
    };
  }
}
