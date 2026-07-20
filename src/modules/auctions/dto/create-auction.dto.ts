import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateAuctionDto {
  @ApiProperty({
    description: 'The UUID of the commodity listing being auctioned',
    example: 'd9b626e2-2212-421c-a0e2-823871ad298a',
  })
  @IsNotEmpty()
  @IsString()
  listingId: string;

  @ApiProperty({
    description: 'The starting bid price in NGN',
    example: 30000,
  })
  @IsNotEmpty()
  @IsNumber()
  startPrice: number;

  @ApiProperty({
    description: 'The reserve (minimum selling) price in NGN',
    example: 45000,
  })
  @IsNotEmpty()
  @IsNumber()
  reservePrice: number;

  @ApiProperty({
    description: 'The ending date/time of the auction block',
    example: '2026-07-15T12:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  endsAt: string;
}
