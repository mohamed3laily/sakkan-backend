import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import * as schema from './schemas/schema-index';

import { shouldLogDbQueries } from '../../common/logging/logging.config';

@Injectable()
export class DrizzleService implements OnApplicationBootstrap {
  public db: NodePgDatabase<typeof schema>;
  private readonly logger = new Logger(DrizzleService.name);

  constructor(private readonly configService: ConfigService) {}

  async onApplicationBootstrap() {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    const pool = new Pool({
      connectionString: databaseUrl,
    });

    const logQueries = shouldLogDbQueries(this.configService);

    this.db = drizzle(pool, {
      schema,
      logger: logQueries
        ? {
            logQuery: (query, params) => {
              this.logger.debug({ query, params }, 'SQL query');
            },
          }
        : undefined,
    });
  }
}
