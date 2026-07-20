import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RecordPriceDto {
  @ApiProperty({
    description: 'The name of the strategic trading hub in Nigeria (e.g. Mile 12, Bodija, Onitsha, Kano Dawanau, Aba Market)',
    example: 'Kano Dawanau',
  })
  @IsNotEmpty()
  @IsString()
  hubName: string;

  @ApiProperty({
    description: 'The agricultural commodity name',
    example: 'Maize',
  })
  @IsNotEmpty()
  @IsString()
  commodity: string;

  @ApiProperty({
    description: 'The current verified trading price in NGN',
    example: 450,
  })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'The unit of measurement corresponding to the price',
    example: 'kg',
  })
  @IsNotEmpty()
  @IsString()
  unit: string;
}
