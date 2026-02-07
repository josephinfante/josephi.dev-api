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

export type SteamPresence = {
  state: 'OFFLINE' | 'ONLINE_IDLE' | 'PLAYING';
  profile: {
    steamId: string;
    nickname: string;
    profileUrl: string;
    avatar: string;
    frameUrl: string;
    backgroundSmall: string;
    backgroundLarge: string;
  };
  game: {
    appId: string;
    name: string;
    iconUrl: string | null;
  } | null;
  session: {
    startedAt: number;
    elapsedMs: number;
    elapsedLabel: string;
  } | null;
  lastUpdatedAt: number;
};

export type SteamRecentGame = {
  appId: string;
  name: string;
  iconUrl: string | null;
  playtime2WeeksMs: number | null;
  playtimeForeverMs: number | null;
};

export type SteamProfileAssets = {
  frameUrl: string;
  backgroundSmall: string;
  backgroundLarge: string;
};

export type Presence = {
  music: MusicPresence | null;
  steam: SteamPresence | null;
  // github: GithubPresence | null;
  updatedAt: number;
};
