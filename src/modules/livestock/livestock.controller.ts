import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { LivestockService } from './livestock.service';
import { TransportEstimateDto } from './dto/transport-estimate.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Livestock Specialization')
@Controller('livestock')
export class LivestockController {
  constructor(private readonly livestockService: LivestockService) {}

  @Get('estimate-weight')
  @ApiOperation({
    summary: 'Estimate livestock weight via dimensions',
    description: 'Enables offline/low-connectivity calculations. Computes estimated live animal weight in kg based on chest girth and body length in inches.',
  })
  @ApiQuery({ name: 'heartGirthInches', required: true, type: Number, description: 'Circumference around animal heart girth in inches', example: 70 })
  @ApiQuery({ name: 'bodyLengthInches', required: true, type: Number, description: 'Length from shoulder point to tail head in inches', example: 60 })
  @ApiQuery({ name: 'animalType', required: false, description: 'Type of livestock (cattle, pig, goat, sheep)', example: 'cattle' })
  @ApiResponse({ status: 200, description: 'Weight estimation computed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid dimensions or missing inputs.' })
  async estimateWeight(
    @Query('heartGirthInches') girth: string,
    @Query('bodyLengthInches') length: string,
    @Query('animalType') animalType?: string,
  ) {
    return this.livestockService.estimateWeight(parseFloat(girth), parseFloat(length), animalType);
  }

  @Post('transport-estimate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Calculate specialized third-party livestock logistics rates',
    description: 'Provides instant transportation price quotes and matches verified carriers based on coordinate routing and animal headcount.',
  })
  @ApiResponse({ status: 200, description: 'Logistics transit estimate calculated successfully.' })
  @ApiResponse({ status: 400, description: 'Malformed coordinates.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async transportEstimate(@Body() dto: TransportEstimateDto) {
    return this.livestockService.getTransportEstimate(dto);
  }
}
