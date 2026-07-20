import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'The user’s phone number or email (must match the target verified by OTP)',
    example: '+2348012345678',
  })
  @IsNotEmpty()
  @IsString()
  target: string;

  @ApiProperty({
    description: 'The user’s full name or business name',
    example: 'Alhaji Musa Danjuma',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The agricultural marketplace role of the user',
    enum: UserRole,
    example: UserRole.FARMER,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: 'The physical address or coordinates description of the farm',
    example: 'Gwagwalada Area, Abuja FCT',
  })
  @IsOptional()
  @IsString()
  farmLocation?: string;

  @ApiPropertyOptional({
    description: 'The geographic region or trading state (e.g. Kano, Oyo, Lagos)',
    example: 'Kano',
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({
    description: 'Optional comma-separated list of market price alert categories to subscribe to (e.g., Grains,Vegetables)',
    example: 'Grains,Vegetables',
  })
  @IsOptional()
  @IsString()
  categorySubscriptions?: string;
}
