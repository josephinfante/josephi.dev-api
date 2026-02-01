import { db } from '@shared/database/db.client';
import { musicHistory } from '@shared/database/schemas/music-history.schema';
import { and, desc, eq, isNull, notInArray } from 'drizzle-orm';
import { injectable } from 'tsyringe';

@injectable()
export class MusicRepository {
  async create(entry: typeof musicHistory.$inferInsert) {
    await db.insert(musicHistory).values(entry);
  }

  async closeActive() {
    await db.update(musicHistory).set({ endedAt: new Date() }).where(isNull(musicHistory.endedAt));
  }

  async existsByIdentity(entry: { title: string; artist: string; listenUrl: string | null }) {
    const where =
      entry.listenUrl === null
        ? and(
            eq(musicHistory.title, entry.title),
            eq(musicHistory.artist, entry.artist),
            isNull(musicHistory.listenUrl),
          )
        : and(
            eq(musicHistory.title, entry.title),
            eq(musicHistory.artist, entry.artist),
            eq(musicHistory.listenUrl, entry.listenUrl),
          );

    const rows = await db.select({ id: musicHistory.id }).from(musicHistory).where(where).limit(1);

    return rows.length > 0;
  }

  async trimForInsert(limit = 10) {
    const keep = await db
      .select({ id: musicHistory.id })
      .from(musicHistory)
      .orderBy(desc(musicHistory.startedAt))
      .limit(Math.max(0, limit - 1));

    const keepIds = keep.map((row) => row.id);

    if (keepIds.length === 0) {
      return;
    }

    await db.delete(musicHistory).where(notInArray(musicHistory.id, keepIds));
  }

  async findLast() {
    const rows = await db
      .select()
      .from(musicHistory)
      .orderBy(desc(musicHistory.startedAt))
      .limit(1);

    return rows[0] ?? null;
  }

  async findRecent(limit = 10) {
    return db.select().from(musicHistory).orderBy(desc(musicHistory.startedAt)).limit(limit);
  }
}
