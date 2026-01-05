import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in the environment variables');
}

export default defineConfig({
  out: './drizzle',
  schema: './src/modules/db/schemas',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      servername: 'ep-fancy-sunset-agumpje5.c-2.eu-central-1.aws.neon.tech',
    },
  },
});
