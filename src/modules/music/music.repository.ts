import { db } from '@shared/database/db.client';
import { musicHistory } from '@shared/database/schemas/music-history.schema';
import { desc, isNull } from 'drizzle-orm';
import { injectable } from 'tsyringe';

@injectable()
export class MusicRepository {
  async create(entry: typeof musicHistory.$inferInsert) {
    await db.insert(musicHistory).values(entry);
  }

  async closeActive() {
    await db.update(musicHistory).set({ endedAt: new Date() }).where(isNull(musicHistory.endedAt));
  }

  async findLast() {
    const rows = await db
      .select()
      .from(musicHistory)
      .orderBy(desc(musicHistory.startedAt))
      .limit(1);

    return rows[0] ?? null;
  }
}
