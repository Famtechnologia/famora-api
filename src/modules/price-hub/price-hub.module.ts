import { Module } from '@nestjs/common';
import { PriceHubService } from './price-hub.service';
import { PriceHubController } from './price-hub.controller';

@Module({
  controllers: [PriceHubController],
  providers: [PriceHubService],
  exports: [PriceHubService],
})
export class PriceHubModule {}
