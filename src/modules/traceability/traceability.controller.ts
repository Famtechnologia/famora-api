import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TraceabilityService } from './traceability.service';

@ApiTags('Produce Traceability')
@Controller('traceability')
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  @Get('qr/:listingId')
  @ApiOperation({
    summary: 'Generate scannable QR-Code traceability profile',
    description: 'Retrieves agricultural provenance data for a listing and returns a Base64-encoded QR-Code image string detailing coordinates, harvest timestamp, and organic certs.',
  })
  @ApiResponse({ status: 200, description: 'QR data URL and payload generated successfully.' })
  @ApiResponse({ status: 404, description: 'Listing not found.' })
  async getProvenanceQr(@Param('listingId') listingId: string) {
    return this.traceabilityService.getProvenance(listingId);
  }
}
