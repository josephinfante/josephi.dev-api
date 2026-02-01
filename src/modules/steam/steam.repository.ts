import { db } from '@shared/database/db.client';
import { steamHistory } from '@shared/database/schemas/steam-history.schema';
import { desc } from 'drizzle-orm';
import { injectable } from 'tsyringe';

@injectable()
export class SteamRepository {
  async create(entry: typeof steamHistory.$inferInsert) {
    await db.insert(steamHistory).values(entry);
  }

  async replaceLatest(entry: typeof steamHistory.$inferInsert) {
    await db.delete(steamHistory);
    await db.insert(steamHistory).values(entry);
  }

  async findRecent(limit = 10) {
    return db.select().from(steamHistory).orderBy(desc(steamHistory.startedAt)).limit(limit);
  }
}
