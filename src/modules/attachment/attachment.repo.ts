import { Injectable } from '@nestjs/common';
import { eq, inArray, notExists, and } from 'drizzle-orm';
import { DrizzleService } from 'src/modules/db/drizzle.service';
import { attachments, InsertAttachment } from 'src/modules/db/schemas/attachments/attachments';
import { listings } from '../db/schemas/listing/listing';

const ENTITY_TABLE: Record<string, any> = {
  LISTING: listings,
};

@Injectable()
export class AttachmentRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  insertMany(values: InsertAttachment[]) {
    return this.drizzle.db.insert(attachments).values(values).returning();
  }

  async findOrphans() {
    const results = await Promise.all(
      Object.entries(ENTITY_TABLE).map(([type, table]) =>
        this.drizzle.db
          .select({ id: attachments.id, key: attachments.key })
          .from(attachments)
          .where(
            and(
              eq(attachments.attachableType, type as any),
              notExists(
                this.drizzle.db
                  .select({ id: table.id })
                  .from(table)
                  .where(eq(table.id, attachments.attachableId)),
              ),
            ),
          ),
      ),
    );

    return results.flat();
  }

  async deleteByIds(ids: number[]) {
    return this.drizzle.db.delete(attachments).where(inArray(attachments.id, ids));
  }
}
