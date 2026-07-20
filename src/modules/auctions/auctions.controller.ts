import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Auctions Engine')
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Publish a commodity listing for bidding',
    description: 'Creates a timed auction block with a starting bid price and reserve threshold. Restricted to Farmers and Admins.',
  })
  @ApiResponse({ status: 201, description: 'Auction published successfully.' })
  @ApiResponse({ status: 400, description: 'Bidding already exists for this listing or invalid dates.' })
  @ApiResponse({ status: 401, description: 'Unauthorized JWT.' })
  async createAuction(@Body() dto: CreateAuctionDto) {
    return this.auctionsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all active auctions',
    description: 'Returns all published auction blocks along with their current highest bid, listing details, and remaining time.',
  })
  @ApiResponse({ status: 200, description: 'Auctions list loaded successfully.' })
  async getAuctions() {
    return this.auctionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve auction details and full bid history',
    description: 'Returns metadata for a specific auction room including full chronological logs of all bids placed.',
  })
  @ApiResponse({ status: 200, description: 'Auction details fetched successfully.' })
  @ApiResponse({ status: 404, description: 'Auction not found.' })
  async getAuction(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }
}
