import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
    // A generous global ceiling so no endpoint is completely unprotected.
    // Auth routes tighten this with their own @Throttle decorators.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
