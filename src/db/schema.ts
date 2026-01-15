import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const MessagesTable = pgTable("messages", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  message: varchar().notNull(),
  link: varchar().notNull().unique(),
  currentViews: integer().default(0),
  maxViews: integer().notNull(),
  iv: varchar().notNull(),
  expiresAt: timestamp(),
  createdAt: timestamp().defaultNow(),
});
