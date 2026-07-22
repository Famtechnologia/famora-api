// Prisma 7 no longer reads .env by itself, and the CLI resolves this file
// before the application ever starts. Without this, `prisma db push` and
// friends see no DATABASE_URL when run locally. Real environment variables
// still win, so deployed environments are unaffected.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Deliberately no fallback: a migration run against a stray local file
    // silently does nothing to the real database.
    url: process.env.DATABASE_URL,
  },
});
