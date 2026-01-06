import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import * as schema from './schemas/schema-index';
import chalk from 'chalk';
@Injectable()
export class DrizzleService implements OnApplicationBootstrap {
  public db: NodePgDatabase<typeof schema>;

  constructor(private readonly configService: ConfigService) {}

  async onApplicationBootstrap() {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    this.db = drizzle(pool, {
      schema,
      logger: {
        logQuery: (query, params) => {
          console.log(
            chalk.green.bold('[SQL]'),
            chalk.cyan(query),
            params.length ? chalk.yellow(JSON.stringify(params)) : '',
          );
        },
      },
    });
  }
}
