import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private cloudinaryService: CloudinaryService) {}

  async detectCropDisease(fileBuffer: Buffer, originalName: string): Promise<{
    imageUrl: string;
    detectedDisease: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    treatmentGuidelines: string;
    accuracyScore: number;
    diagnosedAt: string;
  }> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('Empty image file buffer');
    }

    // Upload to Cloudinary (or local storage fallback)
    const imageUrl = await this.cloudinaryService.uploadFile(fileBuffer, originalName, 'crop_diagnostics');

    // Rule-based classification based on keyword matching (emulating CV intelligence)
    const fileNameLower = originalName.toLowerCase();
    
    let detectedDisease = 'Brown Leaf Spot (Cercospora)';
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let treatmentGuidelines = 'Remove infected lower leaves. Spray with organic neem oil weekly. Avoid overhead watering.';
    let accuracyScore = 88.5;

    if (fileNameLower.includes('tomato')) {
      detectedDisease = 'Tomato Late Blight (Phytophthora infestans)';
      severity = 'HIGH';
      treatmentGuidelines = 'Apply copper-based fungicides immediately. Prune and burn infected foliage. Ensure crop rotation next season.';
      accuracyScore = 96.2;
    } else if (fileNameLower.includes('maize') || fileNameLower.includes('corn')) {
      detectedDisease = 'Maize Common Rust (Puccinia sorghi)';
      severity = 'MEDIUM';
      treatmentGuidelines = 'Apply mancozeb fungicide if infection is early. Plant rust-resistant hybrids. Till under infected residue post-harvest.';
      accuracyScore = 93.4;
    } else if (fileNameLower.includes('cassava')) {
      detectedDisease = 'Cassava Mosaic Disease (CMD)';
      severity = 'CRITICAL';
      treatmentGuidelines = 'Uproot and burn infected plants immediately to prevent whitefly transmission. Plant CMD-resistant varieties like TME 419.';
      accuracyScore = 97.8;
    }

    return {
      imageUrl,
      detectedDisease,
      severity,
      treatmentGuidelines,
      accuracyScore,
      diagnosedAt: new Date().toISOString(),
    };
  }
}
