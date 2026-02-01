import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

export const steamHistory = pgTable(
  'steam_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    appId: text('app_id').notNull(),
    name: text('name').notNull(),
    iconUrl: text('icon_url'),

    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('steam_history_started_idx').on(table.startedAt),
    index('steam_history_ended_idx').on(table.endedAt),
    index('steam_history_app_idx').on(table.appId),
  ],
);
