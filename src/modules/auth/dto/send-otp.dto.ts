import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum OtpChannel {
  SMS = 'sms',
  EMAIL = 'email',
}

export class SendOtpDto {
  @ApiProperty({
    description: 'The target destination for the OTP (phone number +234... or email address)',
    example: '+2348012345678',
  })
  @IsNotEmpty()
  @IsString()
  target: string;

  @ApiProperty({
    description: 'The delivery channel for the OTP code (sms or email)',
    enum: OtpChannel,
    example: OtpChannel.SMS,
  })
  @IsNotEmpty()
  @IsEnum(OtpChannel)
  channel: OtpChannel;
}
