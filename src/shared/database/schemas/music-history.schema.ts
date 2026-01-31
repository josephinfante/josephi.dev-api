import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

export const musicHistory = pgTable(
  'music_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    title: text('title').notNull(),
    artist: text('artist').notNull(),

    cover: text('cover'), // nullable
    listenUrl: text('listen_url'), // nullable

    // cuándo empezó a sonar
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),

    // cuándo terminó (null = aún activa)
    endedAt: timestamp('ended_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('music_history_started_idx').on(table.startedAt),
    index('music_history_ended_idx').on(table.endedAt),
    index('music_history_artist_idx').on(table.artist),
  ],
);
