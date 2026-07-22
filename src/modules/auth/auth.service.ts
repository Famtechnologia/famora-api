import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { TermiiService } from '../../common/services/termii.service';
import { BrevoService } from '../../common/services/brevo.service';
import * as bcrypt from 'bcryptjs';
import { SendOtpDto, OtpChannel } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/** Cost factor for password hashing. 12 is a sensible 2020s default. */
const BCRYPT_ROUNDS = 12;

/** How long a password reset code stays valid. */
const RESET_CODE_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private termiiService: TermiiService,
    private brevoService: BrevoService,
    private jwtService: JwtService,
  ) {}

  async sendOtp(dto: SendOtpDto): Promise<{ success: boolean; message: string }> {
    const { target, channel } = dto;
    
    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Delete existing OTPs for this target
    await this.prisma.otpCode.deleteMany({
      where: { target },
    });

    // Store in DB
    await this.prisma.otpCode.create({
      data: {
        target,
        code,
        expiresAt,
      },
    });

    let sent = false;
    if (channel === OtpChannel.SMS) {
      sent = await this.termiiService.sendOtp(target, code);
    } else {
      sent = await this.brevoService.sendOtp(target, code);
    }

    if (!sent) {
      throw new BadRequestException(`Failed to send OTP via ${channel}`);
    }

    return {
      success: true,
      message: `Verification code successfully sent via ${channel} to ${target}`,
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    isNewUser: boolean;
    registrationToken?: string;
  }> {
    const { target, code } = dto;

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: { target, code },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid OTP verification code');
    }

    if (new Date() > otpRecord.expiresAt) {
      await this.prisma.otpCode.delete({ where: { id: otpRecord.id } });
      throw new BadRequestException('OTP verification code has expired');
    }

    // Clean up used OTP
    await this.prisma.otpCode.delete({ where: { id: otpRecord.id } });

    // Check if user exists
    const isEmail = target.includes('@');
    const user = await this.prisma.user.findFirst({
      where: isEmail ? { email: target } : { phoneNumber: target },
    });

    if (user) {
      // Existing User: Issue JWT
      const token = this.jwtService.sign({ sub: user.id, target });
      return {
        success: true,
        isNewUser: false,
        token,
        user,
      };
    } else {
      // New User: Create temporary registration token
      const registrationToken = this.jwtService.sign({ target }, { expiresIn: '15m' });
      return {
        success: true,
        isNewUser: true,
        registrationToken,
      };
    }
  }

  async register(dto: RegisterDto, regToken: string): Promise<{ success: boolean; token: string; user: any }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(regToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired registration token');
    }

    if (payload.target !== dto.target) {
      throw new BadRequestException('Target in registration DTO does not match verified target');
    }

    const isEmail = dto.target.includes('@');
    
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: isEmail ? { email: dto.target } : { phoneNumber: dto.target },
    });

    if (existingUser) {
      throw new BadRequestException('User is already registered');
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        role: dto.role,
        isVerified: true,
        email: isEmail ? dto.target : null,
        phoneNumber: isEmail ? null : dto.target,
        farmLocation: dto.farmLocation || null,
        region: dto.region || null,
        categorySubscriptions: dto.categorySubscriptions || null,
        smsAlertActive: dto.categorySubscriptions ? true : false,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, target: dto.target });

    return {
      success: true,
      token,
      user,
    };
  }

  // -------------------------------------------------------------------------
  // Email and password
  //
  // Runs alongside the OTP flow rather than replacing it: accounts created by
  // OTP have no password, and accounts created here still have a phone number
  // for SMS price alerts. `password` is null for the former, which is why
  // login has to check for it explicitly.
  // -------------------------------------------------------------------------

  /** Strip the hash before a user object ever leaves the service. */
  private withoutPassword<T extends { password?: string | null }>(user: T) {
    const { password: _omit, ...rest } = user;
    return rest;
  }

  async signUp(dto: SignUpDto): Promise<{
    success: boolean;
    isNewUser: boolean;
    token: string;
    user: any;
  }> {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phoneNumber: phone }] },
    });

    if (existing) {
      // Deliberately does not say which of the two matched: that would confirm
      // whether a given email or phone is registered to anyone asking.
      throw new BadRequestException(
        'An account already exists with that email or phone number',
      );
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        phoneNumber: phone,
        password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        role: dto.role,
        region: dto.region || null,
        // Signing up with a password proves control of neither the address nor
        // the number, so the account starts unverified.
        isVerified: false,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, target: email });

    return {
      success: true,
      isNewUser: true,
      token,
      user: this.withoutPassword(user),
    };
  }

  async login(dto: LoginDto): Promise<{
    success: boolean;
    isNewUser: boolean;
    token: string;
    user: any;
  }> {
    const email = dto.email.trim().toLowerCase();
    // The only query in the application that needs the hash back.
    const user = await this.prisma.user.findFirst({
      where: { email },
      omit: { password: false },
    });

    // One message for "no such account" and "wrong password" alike, so this
    // cannot be used to discover which emails are registered.
    const rejection = new UnauthorizedException(
      'That email or password is not correct',
    );

    if (!user) {
      // Hash anyway so a missing account does not return measurably faster
      // than a wrong password.
      await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
      throw rejection;
    }

    if (!user.password) {
      // An OTP-created account. Telling them plainly beats a wrong-password
      // message they can never satisfy.
      throw new UnauthorizedException(
        'This account was set up with a verification code. Use "Forgot password" to set a password.',
      );
    }

    const matches = await bcrypt.compare(dto.password, user.password);
    if (!matches) throw rejection;

    const token = this.jwtService.sign({ sub: user.id, target: email });

    return {
      success: true,
      isNewUser: false,
      token,
      user: this.withoutPassword(user),
    };
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { email } });

    // Always the same response whether or not the account exists, so this
    // endpoint cannot be used to enumerate registered addresses.
    const response = {
      success: true,
      message:
        'If an account exists for that email, a reset code is on its way.',
    };

    if (!user) return response;

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.otpCode.deleteMany({ where: { target: email } });
    await this.prisma.otpCode.create({
      data: {
        target: email,
        code,
        expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
      },
    });

    await this.brevoService.sendPasswordReset(email, code);

    return response;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{
    success: boolean;
    isNewUser: boolean;
    token: string;
    user: any;
  }> {
    const email = dto.email.trim().toLowerCase();

    const record = await this.prisma.otpCode.findFirst({
      where: { target: email, code: dto.code },
    });

    if (!record) {
      throw new BadRequestException('Invalid password reset code');
    }

    if (new Date() > record.expiresAt) {
      await this.prisma.otpCode.delete({ where: { id: record.id } });
      throw new BadRequestException('That password reset code has expired');
    }

    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      // The code was valid, so the account existed when it was issued. Being
      // deleted in between is possible but not something to leak detail about.
      await this.prisma.otpCode.delete({ where: { id: record.id } });
      throw new BadRequestException('Invalid password reset code');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        // Receiving the code proves control of the address.
        isVerified: true,
      },
    });

    // Burn the code so it cannot be replayed.
    await this.prisma.otpCode.delete({ where: { id: record.id } });

    const token = this.jwtService.sign({ sub: updated.id, target: email });

    return {
      success: true,
      isNewUser: false,
      token,
      user: this.withoutPassword(updated),
    };
  }
}
