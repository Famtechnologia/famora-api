import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const url = process.env.DATABASE_URL;

    // No fallback to a local file. A container-local database looks like it
    // works and then loses every row on the next deploy, which is far worse
    // than refusing to start.
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Point it at the Postgres database before starting the API.',
      );
    }

    const adapter = new PrismaPg({ connectionString: url });
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
