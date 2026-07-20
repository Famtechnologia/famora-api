import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { GeoService } from './geo.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Geolocation Finder')
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('nearest-buyers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Find nearest verified buyers, aggregators, or processors',
    description: 'Calculates the distance of local agro-buyers from the coordinates supplied, filtered by radius (km) with routing URLs.',
  })
  @ApiQuery({ name: 'lat', required: true, type: Number, description: 'Latitude coordinate of the search origin', example: 7.3775 })
  @ApiQuery({ name: 'lng', required: true, type: Number, description: 'Longitude coordinate of the search origin', example: 3.9470 })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, description: 'Search radius in kilometers (default: 50km)', example: 100 })
  @ApiResponse({ status: 200, description: 'List of nearest buyers matching criteria.' })
  @ApiResponse({ status: 400, description: 'Missing or malformed coordinates.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findNearest(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    const searchRadius = radiusKm ? parseFloat(radiusKm) : 50;
    return this.geoService.findNearestBuyers(parseFloat(lat), parseFloat(lng), searchRadius);
  }
}
