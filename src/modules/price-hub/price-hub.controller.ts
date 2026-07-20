import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PriceHubService } from './price-hub.service';
import { RecordPriceDto } from './dto/record-price.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Price Hub')
@Controller('price-hub')
export class PriceHubController {
  constructor(private readonly priceHubService: PriceHubService) {}

  @Get('prices')
  @ApiOperation({
    summary: 'Get live market commodity prices dashboard',
    description: 'Fetch the latest tracked commodity prices across Nigeria’s main trading hubs (Bodija, Mile 12, Aba Market, Kano Dawanau, Onitsha).',
  })
  @ApiResponse({ status: 200, description: 'Live price dashboard retrieved successfully.' })
  async getLatestPrices() {
    return this.priceHubService.getLatestPrices();
  }

  @Post('prices')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Record a verified commodity price update',
    description: 'Records pricing updates from major strategic agricultural hubs. Limited to Administrators/Staff.',
  })
  @ApiResponse({ status: 201, description: 'Market price logged successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized JWT.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async recordPrice(@Body() dto: RecordPriceDto) {
    return this.priceHubService.recordPrice(dto);
  }

  @Post('trigger-alerts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Manually trigger pricing broadcast alerts',
    description: 'Pushes personalized pricing alerts via Termii SMS or Brevo email to all users with active alerts configurations.',
  })
  @ApiResponse({ status: 200, description: 'Broadcasting completed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized JWT.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async triggerAlerts() {
    return this.priceHubService.triggerPriceAlerts();
  }
}
