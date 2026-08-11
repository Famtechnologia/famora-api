import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPositive, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'The UUID of the listing being purchased',
    example: 'd9b626e2-2212-421c-a0e2-823871ad298a',
  })
  @IsNotEmpty()
  @IsUUID()
  listingId: string;

  @ApiProperty({
    description: 'The quantity being purchased (must be greater than 0)',
    example: 5,
  })
  @IsNotEmpty()
  @IsPositive()
  quantity: number;
}
