import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateListingDto {
  @ApiProperty({
    description: 'The title of the commodity listing',
    example: 'Premium Yellow Maize (Dry)',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Optional description of quality, moisture content, etc.',
    example: 'Moisture content < 12%, pesticide-free, packaged in 100kg bags.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Price per unit in Nigerian Naira (NGN)',
    example: 45000,
  })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Available quantity in stock',
    example: 50,
  })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({
    description: 'The standard measurement unit',
    example: 'bag',
  })
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty({
    description: 'Agricultural category (GRAINS, VEGETABLES, LIVESTOCK, PIG_FARMING, B2B_SUPPLY, EXPORT)',
    example: 'GRAINS',
  })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiPropertyOptional({
    description: 'URL of the commodity image uploaded to Cloudinary',
    example: 'https://res.cloudinary.com/famtech/image/upload/v1/maize.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'The date the crop was harvested',
    example: '2026-07-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  harvestDate?: string;

  @ApiPropertyOptional({
    description: 'GPS coordinates of the farm origin (lat,lng)',
    example: '7.3775,3.9470',
  })
  @IsOptional()
  @IsString()
  originCoordinates?: string;

  @ApiPropertyOptional({
    description: 'Quality or agricultural certification seals',
    example: 'NADA Certified Organic',
  })
  @IsOptional()
  @IsString()
  qualityCertification?: string;

  // Livestock specialized fields
  @ApiPropertyOptional({
    description: 'Livestock breed (for Cattle, Goats, Pigs, Poultry)',
    example: 'Large White',
  })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiPropertyOptional({
    description: 'Digital health and vaccination logs history',
    example: 'De-wormed June 2026, fully vaccinated against ASF.',
  })
  @IsOptional()
  @IsString()
  healthRecords?: string;

  @ApiPropertyOptional({
    description: 'Weight of the animal in kilograms',
    example: 85.5,
  })
  @IsOptional()
  @IsNumber()
  weight?: number;

  // Export fields
  @ApiPropertyOptional({
    description: 'Indicates if listing complies with export standards',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  exportCompliant?: boolean;
}
