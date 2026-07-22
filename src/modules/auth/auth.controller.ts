import { Controller, Post, Body, Headers, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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

  // ---- Email and password -------------------------------------------------

  @Post('signup')
  @ApiOperation({
    summary: 'Create an account with an email and password',
    description:
      'Registers a new user directly, without an OTP round trip. The account starts unverified: neither the email nor the phone number has been proven at this point.',
  })
  @ApiResponse({ status: 201, description: 'Account created. Returns a session JWT token.' })
  @ApiResponse({ status: 400, description: 'Validation failed, or the email or phone is already registered.' })
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('login')
  @HttpCode(200)
  // Ten attempts a minute per IP. Enough for a person fumbling their password,
  // far too slow to work through a password list.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Sign in with an email and password',
    description:
      'Returns a session JWT token. Accounts created through the OTP flow have no password and are told to set one via password reset.',
  })
  @ApiResponse({ status: 200, description: 'Signed in. Returns a session JWT token.' })
  @ApiResponse({ status: 401, description: 'Email or password incorrect, or the account has no password set.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('password/forgot')
  @HttpCode(200)
  // Tighter than login: this one sends email, so abuse costs real money and
  // lands the sender in spam filters.
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @ApiOperation({
    summary: 'Request a password reset code',
    description:
      'Emails a 6-digit reset code valid for 15 minutes. Always returns the same response whether or not the account exists, so it cannot be used to discover which emails are registered.',
  })
  @ApiResponse({ status: 200, description: 'Reset code sent if the account exists.' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('password/reset')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  @ApiOperation({
    summary: 'Set a new password using a reset code',
    description:
      'Consumes the 6-digit code from the reset email and sets a new password. Receiving the code proves control of the address, so the account is marked verified. Returns a session JWT token, signing the user straight in.',
  })
  @ApiResponse({ status: 200, description: 'Password changed. Returns a session JWT token.' })
  @ApiResponse({ status: 400, description: 'Reset code invalid or expired.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
