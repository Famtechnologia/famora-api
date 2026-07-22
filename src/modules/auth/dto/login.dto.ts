import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'The email address the account was registered with',
    example: 'musa@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The account password',
    example: 'a-strong-passphrase',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
