import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TermiiService } from '../../common/services/termii.service';
import { BrevoService } from '../../common/services/brevo.service';
import { RecordPriceDto } from './dto/record-price.dto';

@Injectable()
export class PriceHubService {
  private readonly logger = new Logger(PriceHubService.name);

  constructor(
    private prisma: PrismaService,
    private termiiService: TermiiService,
    private brevoService: BrevoService,
  ) {}

  async recordPrice(dto: RecordPriceDto) {
    return this.prisma.marketPrice.create({
      data: {
        hubName: dto.hubName,
        commodity: dto.commodity,
        price: dto.price,
        unit: dto.unit,
      },
    });
  }

  async getLatestPrices() {
    // SQLite compatible query to get the most recent price record per (hubName, commodity)
    const allPrices = await this.prisma.marketPrice.findMany({
      orderBy: { recordedAt: 'desc' },
    });

    // Grouping manually to guarantee database compatibility
    const uniqueMap = new Map<string, typeof allPrices[0]>();
    for (const p of allPrices) {
      const key = `${p.hubName}-${p.commodity}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, p);
      }
    }

    return Array.from(uniqueMap.values());
  }

  async triggerPriceAlerts(): Promise<{ success: boolean; smsSent: number; emailSent: number }> {
    const users = await this.prisma.user.findMany({
      where: {
        smsAlertActive: true,
      },
    });

    const latestPrices = await this.getLatestPrices();
    let smsSent = 0;
    let emailSent = 0;

    for (const user of users) {
      const subs = user.categorySubscriptions
        ? user.categorySubscriptions.split(',').map((s) => s.trim().toLowerCase())
        : [];
      
      if (subs.length === 0) continue;

      // Filter prices relevant to user subscription commodities/categories
      const userPrices = latestPrices.filter((p) =>
        subs.some((sub) => p.commodity.toLowerCase().includes(sub) || p.hubName.toLowerCase().includes(sub))
      );

      if (userPrices.length === 0) continue;

      const priceSummary = userPrices
        .map((p) => `${p.commodity} (${p.hubName}): ₦${p.price}/${p.unit}`)
        .join(', ');

      if (user.phoneNumber) {
        const smsMessage = `Famtech Price Alert: Today's prices: ${priceSummary}. Login to Famtech to trade!`;
        const success = await this.termiiService.sendSms(user.phoneNumber, smsMessage);
        if (success) smsSent++;
      }

      if (user.email) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2e7d32;">Famtech Africa - Local Price Alert</h2>
            <p>Hello <strong>${user.name}</strong>, here are the latest commodity market updates matching your subscriptions:</p>
            <ul>
              ${userPrices.map((p) => `<li><strong>${p.commodity}</strong> at <em>${p.hubName}</em>: ₦${p.price} per ${p.unit}</li>`).join('')}
            </ul>
            <p>Trade directly or contact verified buyers on the Famtech Agricultural Marketplace.</p>
            <br>
            <p>Best regards,</p>
            <p><strong>Famtech Africa Pricing Hub</strong></p>
          </div>
        `;
        const success = await this.brevoService.sendEmail(user.email, 'Famtech Daily Price Alert', emailHtml);
        if (success) emailSent++;
      }
    }

    return {
      success: true,
      smsSent,
      emailSent,
    };
  }
}
