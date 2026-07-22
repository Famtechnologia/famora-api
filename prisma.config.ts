import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Deliberately no fallback: a migration run against a stray local file
    // silently does nothing to the real database.
    url: process.env.DATABASE_URL,
  },
});
