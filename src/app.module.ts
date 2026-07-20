import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { PriceHubModule } from './modules/price-hub/price-hub.module';
import { GeoModule } from './modules/geo/geo.module';
import { LivestockModule } from './modules/livestock/livestock.module';
import { TraceabilityModule } from './modules/traceability/traceability.module';
import { AiModule } from './modules/ai/ai.module';
import { AuctionsModule } from './modules/auctions/auctions.module';
import { ExportModule } from './modules/export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    MarketplaceModule,
    PriceHubModule,
    GeoModule,
    LivestockModule,
    TraceabilityModule,
    AiModule,
    AuctionsModule,
    ExportModule,
  ],
})
export class AppModule {}
