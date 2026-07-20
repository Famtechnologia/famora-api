import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TermiiService {
  private readonly logger = new Logger(TermiiService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly senderId: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TERMII_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('TERMII_BASE_URL') || 'https://api.ng.termii.com';
    this.senderId = this.configService.get<string>('TERMII_SENDER_ID') || 'Famtech';
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn(`[MOCK SMS] To: ${to} | Message: ${message}`);
      return true;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/api/sms/send`, {
        api_key: this.apiKey,
        to,
        from: this.senderId,
        sms: message,
        type: 'plain',
        channel: 'generic',
      });

      if (response.data && response.data.message === 'Successfully Sent') {
        this.logger.log(`SMS successfully sent to ${to} via Termii`);
        return true;
      }

      this.logger.error(`Termii SMS failed: ${JSON.stringify(response.data)}`);
      return false;
    } catch (error: any) {
      this.logger.error(`Error sending Termii SMS: ${error.message}`);
      if (error.response) {
        this.logger.error(`Termii Error details: ${JSON.stringify(error.response.data)}`);
      }
      return false;
    }
  }

  async sendOtp(to: string, code: string): Promise<boolean> {
    const message = `Your Famtech verification OTP is: ${code}. It expires in 5 minutes.`;
    return this.sendSms(to, message);
  }
}
