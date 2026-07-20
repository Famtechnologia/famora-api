import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { TermiiService } from './services/termii.service';
import { BrevoService } from './services/brevo.service';
import { CloudinaryService } from './services/cloudinary.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, TermiiService, BrevoService, CloudinaryService],
  exports: [PrismaService, TermiiService, BrevoService, CloudinaryService],
})
export class CommonModule {}
