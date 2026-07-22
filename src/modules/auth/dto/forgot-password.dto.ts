import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'The email address to send the password reset code to',
    example: 'musa@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
