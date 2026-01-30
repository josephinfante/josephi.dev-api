import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',

  schema: './src/shared/database/schemas/*.schema.ts',

  out: './src/shared/database/migrations',

  dbCredentials: {
    url: process.env.DB_URL!,
  },
});
