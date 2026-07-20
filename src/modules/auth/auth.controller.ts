import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  @ApiOperation({
    summary: 'Request OTP verification code',
    description: 'Generates a random 6-digit verification code and delivers it to the target phone number (via Termii SMS) or email (via Brevo email) depending on the selected channel.',
  })
  @ApiResponse({ status: 201, description: 'OTP successfully sent to destination.' })
  @ApiResponse({ status: 400, description: 'Invalid payload or channel configuration.' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('otp/verify')
  @ApiOperation({
    summary: 'Verify OTP code and authenticate',
    description: 'Validates the delivered 6-digit OTP code. If the user profile exists, returns a session JWT token. If the user is new, returns a registration token required to invoke `/auth/register`.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP code verified. Returns session token or registration token.',
    schema: {
      example: {
        success: true,
        isNewUser: false,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'b6e82845-dfd2-430c-8068-07e0e7a17df3',
          name: 'Alhaji Musa Danjuma',
          role: 'FARMER',
          isVerified: true,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'OTP code invalid or expired.' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register new agricultural platform user profile',
    description: 'Completes onboarding for a new user. Expects the target identifier, details, and the registration token returned from a successful `/auth/otp/verify` call in the headers.',
  })
  @ApiHeader({
    name: 'x-registration-token',
    description: 'The short-lived registration JWT token returned from OTP verification.',
    required: true,
  })
  @ApiResponse({ status: 201, description: 'User successfully registered. Returns session JWT token.' })
  @ApiResponse({ status: 400, description: 'Registration validation failed or invalid token.' })
  @ApiResponse({ status: 401, description: 'Registration token expired or unauthorized.' })
  async register(
    @Body() dto: RegisterDto,
    @Headers('x-registration-token') regToken: string,
  ) {
    if (!regToken) {
      throw new BadRequestException('Missing x-registration-token header');
    }
    return this.authService.register(dto, regToken);
  }
}
