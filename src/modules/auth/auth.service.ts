import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { TermiiService } from '../../common/services/termii.service';
import { BrevoService } from '../../common/services/brevo.service';
import { SendOtpDto, OtpChannel } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';

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
}
