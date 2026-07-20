import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.isConfigured = true;
      this.logger.log('Cloudinary successfully configured');
    } else {
      this.logger.warn('Cloudinary credentials missing. File uploads will fall back to local disk storage.');
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, folder = 'famtech'): Promise<string> {
    if (this.isConfigured) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: path.parse(fileName).name,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              this.logger.error(`Cloudinary upload failed: ${error.message}`);
              reject(error);
            } else {
              resolve(result!.secure_url);
            }
          }
        );
        uploadStream.end(fileBuffer);
      });
    } else {
      // Local fallback
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const sanitizedName = fileName.replace(/\s+/g, '-');
      const uniqueFileName = `${Date.now()}-${sanitizedName}`;
      const filePath = path.join(uploadDir, uniqueFileName);
      fs.writeFileSync(filePath, fileBuffer);
      
      this.logger.log(`File saved locally: ${filePath}`);
      return `/uploads/${uniqueFileName}`;
    }
  }
}
