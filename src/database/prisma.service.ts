import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL || 'file:./dev.db',
    });
    super({
      adapter,
      // The password hash is stripped from every query in the application, so
      // no endpoint can leak it by returning a user object — including the
      // ones that pull users in through a relation. The two places that need
      // it opt back in explicitly with `omit: { password: false }`.
      omit: {
        user: { password: true },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
