import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  async findNearestBuyers(lat: number, lng: number, radiusKm = 50) {
    if (isNaN(lat) || isNaN(lng)) {
      throw new BadRequestException('Invalid latitude or longitude coordinate parameters');
    }

    const buyers = await this.prisma.user.findMany({
      where: {
        role: UserRole.BUYER,
        farmCoordinates: { not: null },
      },
    });

    const results = buyers
      .map((buyer) => {
        const [buyerLat, buyerLng] = buyer.farmCoordinates!.split(',').map((coord) => parseFloat(coord.trim()));
        
        if (isNaN(buyerLat) || isNaN(buyerLng)) {
          return null;
        }

        const distance = this.calculateHaversine(lat, lng, buyerLat, buyerLng);
        
        // Mock rating between 4.0 and 5.0 for the aggregator
        const rating = parseFloat((4.0 + (buyer.name.charCodeAt(0) % 11) * 0.1).toFixed(1));

        return {
          id: buyer.id,
          name: buyer.name,
          phoneNumber: buyer.phoneNumber,
          email: buyer.email,
          locationName: buyer.farmLocation,
          coordinates: buyer.farmCoordinates,
          distanceKm: parseFloat(distance.toFixed(2)),
          rating,
          routingUrl: `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${buyerLat},${buyerLng}&travelmode=driving`,
        };
      })
      .filter((res): res is NonNullable<typeof res> => res !== null && res.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return results;
  }

  private calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
