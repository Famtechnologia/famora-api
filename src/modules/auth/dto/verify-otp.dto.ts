import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'The phone number or email address that received the OTP',
    example: '+2348012345678',
  })
  @IsNotEmpty()
  @IsString()
  target: string;

  @ApiProperty({
    description: 'The 6-digit OTP code received by the user',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 characters' })
  code: string;
}
