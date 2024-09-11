import { sql } from "drizzle-orm";
import { text, integer, blob, sqliteTable} from "drizzle-orm/sqlite-core";

export const pastr_files = sqliteTable('pastr_files', {
  id: text('id').primaryKey().notNull(),
  file_content: blob('file_content').notNull(),
  
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`).notNull(),
});