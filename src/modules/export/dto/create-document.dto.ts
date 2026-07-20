import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'The type of regulatory export document (e.g. Phytosanitary Certificate, Certificate of Origin, NEPC Export Declaration)',
    example: 'Certificate of Origin',
  })
  @IsNotEmpty()
  @IsString()
  documentType: string;

  @ApiProperty({
    description: 'A JSON object mapping compliance form fields to values',
    example: {
      exporterName: 'Famtech Agro-Export Ltd',
      importerName: 'Global Foods Inc',
      commodityType: 'Ginger (Dried)',
      netWeightKgs: 25000,
      portOfLoading: 'Apapa Port, Lagos',
      portOfDischarge: 'Port of Houston, USA',
    },
  })
  @IsNotEmpty()
  @IsObject()
  data: Record<string, any>;
}
