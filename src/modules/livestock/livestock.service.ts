import { Injectable, BadRequestException } from '@nestjs/common';
import { TransportEstimateDto } from './dto/transport-estimate.dto';

@Injectable()
export class LivestockService {
  
  estimateWeight(heartGirthInches: number, bodyLengthInches: number, animalType = 'cattle'): { estimatedWeightKg: number; formulaUsed: string } {
    if (heartGirthInches <= 0 || bodyLengthInches <= 0) {
      throw new BadRequestException('Dimensions must be positive values greater than zero');
    }

    let divisor = 300;
    let formulaName = "Schaeffer's Formula (Girth^2 * Length / 300)";

    const type = animalType.toLowerCase();
    if (type === 'pig') {
      divisor = 400;
      formulaName = "Pig Weight Formula (Girth^2 * Length / 400)";
    } else if (type === 'goat' || type === 'sheep') {
      divisor = 300;
      formulaName = "Goat/Sheep Girth-to-Weight Formula";
    }

    // Weight in Lbs = (Girth^2 * Length) / divisor
    const weightLbs = (Math.pow(heartGirthInches, 2) * bodyLengthInches) / divisor;
    // Convert to kg
    const weightKg = parseFloat((weightLbs * 0.45359237).toFixed(2));

    return {
      estimatedWeightKg: weightKg,
      formulaUsed: formulaName,
    };
  }

  async getTransportEstimate(dto: TransportEstimateDto) {
    const [lat1, lon1] = dto.fromCoordinates.split(',').map((c) => parseFloat(c.trim()));
    const [lat2, lon2] = dto.toCoordinates.split(',').map((c) => parseFloat(c.trim()));

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      throw new BadRequestException('Invalid geographic coordinates format');
    }

    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    
    // NGN 200 per km per animal + NGN 45,000 base mobilization fee
    const perKmRate = 200;
    const baseFee = 45000;
    const totalCost = baseFee + (distance * perKmRate * dto.headCount);

    return {
      distanceKm: parseFloat(distance.toFixed(2)),
      estimatedCostNaira: parseFloat(totalCost.toFixed(2)),
      perHeadRateNaira: parseFloat((totalCost / dto.headCount).toFixed(2)),
      suggestedCarrier: distance > 200 ? 'Arewa Long-haul Livestock' : 'Miyetti Regional Carriers',
      pickupCoordinates: dto.fromCoordinates,
      dropoffCoordinates: dto.toCoordinates,
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
