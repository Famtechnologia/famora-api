import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY') || '';
    // famtech.org is not a domain we own; mail from it was silently dropped.
    // famtech.llc is the authenticated sending domain.
    this.senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL') || 'no-reply@famtech.llc';
    this.senderName = this.configService.get<string>('BREVO_SENDER_NAME') || 'Famora';
  }

  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Content: ${htmlContent}`);
      return true;
    }

    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: this.senderName, email: this.senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent,
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 201 || response.status === 200) {
        this.logger.log(`Email successfully sent to ${to} via Brevo`);
        return true;
      }

      this.logger.error(`Brevo Email failed: ${JSON.stringify(response.data)}`);
      return false;
    } catch (error: any) {
      this.logger.error(`Error sending Brevo email: ${error.message}`);
      if (error.response) {
        this.logger.error(`Brevo Error details: ${JSON.stringify(error.response.data)}`);
      }
      return false;
    }
  }

  async sendOtp(to: string, code: string): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Your Famora verification code</h2>
        <p>You asked for a verification code for your Famora account.</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 5 minutes. If you did not ask for it, you can ignore this email.</p>
        <br>
        <p>Best regards,</p>
        <p><strong>The Famora Team</strong></p>
      </div>
    `;
    return this.sendEmail(to, 'Your Famora verification code', htmlContent);
  }

  async sendPasswordReset(to: string, code: string): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Reset your Famora password</h2>
        <p>We received a request to reset the password on your Famora account. Enter this code to choose a new one.</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 15 minutes. If you did not request a password reset, you can ignore this email — your password will not change.</p>
        <br>
        <p>Best regards,</p>
        <p><strong>The Famora Team</strong></p>
      </div>
    `;
    return this.sendEmail(to, 'Reset your Famora password', htmlContent);
  }
}
