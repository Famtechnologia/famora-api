import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async createDocument(userId: string, dto: CreateDocumentDto) {
    const document = await this.prisma.exportDocument.create({
      data: {
        userId,
        documentType: dto.documentType,
        data: JSON.stringify(dto.data),
        status: 'SUBMITTED', // Default status upon automated submission
      },
    });

    return {
      ...document,
      data: dto.data,
    };
  }

  async getDocuments(userId: string) {
    const docs = await this.prisma.exportDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((doc) => ({
      ...doc,
      data: JSON.parse(doc.data),
    }));
  }

  async getCustomsChecklist(destinationCountry: string, commodity: string) {
    const country = destinationCountry.toUpperCase();
    const comm = commodity.toLowerCase();

    let checklists = [
      'Register as exporter with NEPC (Nigerian Export Promotion Council)',
      'Secure Quality Inspection and Phytosanitary Certificate from NAQS (Nigeria Agricultural Quarantine Service)',
      'Complete Clean Certificate of Inspection (CCI) issued by government-appointed pre-shipment inspection agents',
    ];

    let tariffIndicator = '3.5% standard duty';
    let estimatedTransitDays = 25; // Sea shipping estimate from Lagos

    if (country === 'USA' || country === 'US' || country === 'UNITED STATES') {
      checklists.push(
        'Obtain FDA (Food and Drug Administration) Facility Registration and Prior Notice declaration',
        'Verify USDA (Department of Agriculture) import permit eligibility',
        'Request AGOA (African Growth and Opportunity Act) Duty-Free Certification (allows 0% tariff for qualified agro-products)',
      );
      tariffIndicator = '0% tariff eligible under AGOA (African Growth and Opportunity Act)';
      estimatedTransitDays = 21;
    } else if (country === 'EU' || country === 'GERMANY' || country === 'FRANCE' || country === 'NETHERLANDS') {
      checklists.push(
        'Verify compliance with EU Maximum Residue Limits (MRLs) for pesticides',
        'Provide EORI (Economic Operators Registration and Identification) number of importing party',
        'Obtain EUR.1 movement certificate for preferential tariff agreements if applicable',
      );
      tariffIndicator = 'Preferential trade rate: 1.5% or 0% under EU-ACP economic partnership';
      estimatedTransitDays = 18;
    } else {
      checklists.push(
        `Check target customs import specifications for ${destinationCountry}`,
        'Verify standard bill of lading and packaging labeling compliance',
      );
    }

    if (comm.includes('cocoa')) {
      checklists.push('Register with the Federal Ministry of Industry, Trade and Investment (Cocoa Export License)');
    } else if (comm.includes('ginger') || comm.includes('cashew')) {
      checklists.push('Obtain SGS or Cotecna moisture content analysis report (< 8% dry target)');
    }

    return {
      destination: destinationCountry,
      commodity,
      checklists,
      tariffIndicator,
      estimatedTransitDays,
      customsAssistanceContact: 'NEPC Desk: export-help@nepc.gov.ng',
    };
  }
}
