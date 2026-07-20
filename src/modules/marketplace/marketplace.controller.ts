import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { SyncOfflineDto } from './dto/sync-offline.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('listings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER, UserRole.LIVESTOCK_PRODUCER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new marketplace listing',
    description: 'Publishes a new commodity or livestock listing. Restricted to Farmers, Livestock Producers, and Admins.',
  })
  @ApiResponse({ status: 201, description: 'Listing created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized JWT.' })
  @ApiResponse({ status: 403, description: 'Forbidden (incorrect role).' })
  async createListing(@CurrentUser() user: User, @Body() dto: CreateListingDto) {
    return this.marketplaceService.create(user.id, dto);
  }

  @Get('listings')
  @ApiOperation({
    summary: 'Retrieve all listings',
    description: 'Fetch and filter published listings across all active categories with optional text query searches.',
  })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category (e.g. GRAINS, VEGETABLES, LIVESTOCK)' })
  @ApiQuery({ name: 'search', required: false, description: 'Text search inside title or breed fields' })
  @ApiQuery({ name: 'exportCompliant', required: false, type: Boolean, description: 'Filter only export-ready listings' })
  @ApiResponse({ status: 200, description: 'Listings fetched successfully.' })
  async getListings(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('exportCompliant') exportCompliant?: string,
  ) {
    const isExportCompliant = exportCompliant === 'true' ? true : exportCompliant === 'false' ? false : undefined;
    return this.marketplaceService.findAll({ category, search, exportCompliant: isExportCompliant });
  }

  @Get('listings/:id')
  @ApiOperation({
    summary: 'Get details of a single listing',
    description: 'Returns all fields of a specific commodity listing, including origin coordinates and seller details.',
  })
  @ApiResponse({ status: 200, description: 'Listing details loaded successfully.' })
  @ApiResponse({ status: 404, description: 'Listing not found.' })
  async getListing(@Param('id') id: string) {
    return this.marketplaceService.findOne(id);
  }

  @Post('orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Purchase listing (Create order)',
    description: 'Places a direct purchase order against a commodity listing. Deducts matching stock in a database transaction.',
  })
  @ApiResponse({ status: 201, description: 'Purchase completed successfully.' })
  @ApiResponse({ status: 400, description: 'Insufficient stock or invalid request parameters.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createOrder(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.marketplaceService.createOrder(user.id, dto);
  }

  @Post('sync')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Synchronize offline drafts & queued transactions',
    description: 'Enables offline mode synchronization. Processes a batch of listings and order drafts generated offline, maps temporary keys, and enforces transaction idempotence.',
  })
  @ApiResponse({ status: 201, description: 'Offline sync batch processed. Returns details of successfully synced elements and errors.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async syncOffline(@CurrentUser() user: User, @Body() dto: SyncOfflineDto) {
    return this.marketplaceService.syncOfflineData(user.id, dto);
  }
}
