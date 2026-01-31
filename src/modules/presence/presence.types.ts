export type MusicPresence = {
  title: string;
  artist: string;
  cover: string | null;
  progressPercent: number | null;
  progressText: string | null;
  state: 'PLAYING' | 'PAUSED' | 'STOPPED';
  listenUrl: string | null;
  timestamp: number;
  // trackId?: string; // opcional futuro
};

export type Presence = {
  music: MusicPresence | null;
  //   steam: SteamPresence | null;
  // github: GithubPresence | null;
  updatedAt: number;
};
