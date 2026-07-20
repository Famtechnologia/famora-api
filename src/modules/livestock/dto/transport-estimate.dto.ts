import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TransportEstimateDto {
  @ApiProperty({
    description: 'Starting location coordinate (lat,lng)',
    example: '10.5105,7.4165', // Kaduna
  })
  @IsNotEmpty()
  @IsString()
  fromCoordinates: string;

  @ApiProperty({
    description: 'Destination location coordinate (lat,lng)',
    example: '6.5244,3.3792', // Lagos
  })
  @IsNotEmpty()
  @IsString()
  toCoordinates: string;

  @ApiProperty({
    description: 'Number of animal heads to transport',
    example: 15,
  })
  @IsNotEmpty()
  @IsNumber()
  headCount: number;
}
