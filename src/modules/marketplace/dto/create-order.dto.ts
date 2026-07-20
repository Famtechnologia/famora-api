import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'The UUID of the listing being purchased',
    example: 'd9b626e2-2212-421c-a0e2-823871ad298a',
  })
  @IsNotEmpty()
  @IsString()
  listingId: string;

  @ApiProperty({
    description: 'The quantity being purchased',
    example: 5,
  })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
