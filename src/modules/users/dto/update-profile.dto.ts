import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'The updated full name or business name',
    example: 'Musa Danjuma & Sons Ltd.',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'The updated location description of the farm',
    example: 'Kano-Wudil Road, Kano State',
  })
  @IsOptional()
  @IsString()
  farmLocation?: string;

  @ApiPropertyOptional({
    description: 'The updated geographic region or trading state',
    example: 'Kano',
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated categories for price alerts (e.g. Grains,Vegetables)',
    example: 'Grains,Vegetables,Livestock',
  })
  @IsOptional()
  @IsString()
  categorySubscriptions?: string;

  @ApiPropertyOptional({
    description: 'Enable or disable daily SMS alerts',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  smsAlertActive?: boolean;
}
