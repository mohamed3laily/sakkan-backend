import { pgEnum } from 'drizzle-orm/pg-core';

export const attachableTypeEnum = pgEnum('attachment_entity_type', ['LISTING']);

export const attachmentFileTypeEnum = pgEnum('attachment_file_type', ['IMAGE']);
