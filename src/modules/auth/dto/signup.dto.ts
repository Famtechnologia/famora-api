import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class SignUpDto {
  @ApiProperty({
    description: 'The user’s full name or business name',
    example: 'Alhaji Musa Danjuma',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The email address used to sign in',
    example: 'musa@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The user’s phone number, used for SMS price alerts',
    example: '+2348012345678',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Password, at least 8 characters',
    example: 'a-strong-passphrase',
    minLength: 8,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description:
      'The 6-digit code emailed to the address above by POST /auth/otp/send. Proves the person signing up controls the email.',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'The agricultural marketplace role of the user',
    enum: UserRole,
    example: UserRole.FARMER,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: 'The geographic region or trading state (e.g. Kano, Oyo, Lagos)',
    example: 'Kano',
  })
  @IsOptional()
  @IsString()
  region?: string;
}
