import axios from 'axios';
import type { SteamPresence, SteamRecentGame } from '@modules/presence/presence.types';
import type { PresenceCache } from '@modules/presence/presence.cache';
import { PresenceService } from '@modules/presence/presence.service';
import { shouldEmitSteamRecent } from '@modules/presence/presence.helper';
import { TOKENS } from '@shared/container/tokens';
import { environment } from '@shared/config/environment';
import { logger } from '@shared/logger';
import { container } from 'tsyringe';

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const RECOVERY_INTERVAL_MS = 60 * 1000;
const RECOVERY_WINDOW_MS = 5 * 60 * 1000;
const STEAM_ICON_BASE = 'https://media.steampowered.com/steamcommunity/public/images/apps';

type SteamPlayerSummaryResponse = {
  response: {
    players: SteamPlayerSummary[];
  };
};

type SteamPlayerSummary = {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium?: string;
  avatarfull?: string;
  personastate: number;
  gameid?: string;
  gameextrainfo?: string;
};

type SteamRecentlyPlayedResponse = {
  response: {
    total_count: number;
    games?: SteamRecentlyPlayedGame[];
  };
};

type SteamRecentlyPlayedGame = {
  appid: number;
  name: string;
  img_icon_url?: string;
  playtime_2weeks?: number;
  playtime_forever?: number;
};

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function buildIconUrl(appId: string, iconHash?: string | null): string | null {
  if (!iconHash) return null;
  return `${STEAM_ICON_BASE}/${appId}/${iconHash}.jpg`;
}

function buildSteamPresence(
  player: SteamPlayerSummary,
  recent: SteamRecentlyPlayedGame[] | undefined,
  previous: SteamPresence | null,
): SteamPresence {
  const now = Date.now();
  const isOffline = player.personastate === 0;
  const isPlaying = Boolean(player.gameid);

  let state: SteamPresence['state'] = 'ONLINE_IDLE';
  if (isOffline) {
    state = 'OFFLINE';
  } else if (isPlaying) {
    state = 'PLAYING';
  }

  let game: SteamPresence['game'] = null;

  if (state === 'PLAYING') {
    const appId = player.gameid ? String(player.gameid) : '';
    const match = recent?.find((entry) => String(entry.appid) === appId);
    const name = player.gameextrainfo || match?.name || 'Unknown';
    const iconUrl = appId ? buildIconUrl(appId, match?.img_icon_url ?? null) : null;

    if (appId) {
      game = {
        appId,
        name,
        iconUrl,
      };
    }
  }

  let session: SteamPresence['session'] = null;

  if (state === 'PLAYING' && game) {
    const startedAt =
      previous?.state === 'PLAYING' &&
      previous.game?.appId === game.appId &&
      previous.session?.startedAt
        ? previous.session.startedAt
        : now;

    const elapsedMs = Math.max(0, now - startedAt);

    session = {
      startedAt,
      elapsedMs,
      elapsedLabel: formatElapsed(elapsedMs),
    };
  }

  return {
    state,
    profile: {
      steamId: player.steamid,
      nickname: player.personaname,
      profileUrl: player.profileurl,
      avatar: player.avatarfull || player.avatar || '',
      frameUrl: environment.STEAM_FRAME_URL ?? '',
      backgroundSmall: environment.STEAM_BRACKGROUND_SMALL ?? '',
      backgroundLarge: environment.STEAM_BRACKGROUND_LARGE ?? '',
    },
    game,
    session,
    lastUpdatedAt: now,
  };
}

async function fetchPlayerSummary(): Promise<SteamPlayerSummary | null> {
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2?key=${environment.STEAM_KEY}&steamids=${environment.STEAM_ID}&format=json`;
  const { data } = await axios.get<SteamPlayerSummaryResponse>(url, { timeout: 10000 });
  return data.response.players?.[0] ?? null;
}

async function fetchRecentlyPlayed(): Promise<SteamRecentlyPlayedGame[] | undefined> {
  const url = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001?key=${environment.STEAM_KEY}&steamid=${environment.STEAM_ID}&format=json`;
  const { data } = await axios.get<SteamRecentlyPlayedResponse>(url, { timeout: 10000 });
  return data.response.games;
}

type PollResult = { success: true } | { success: false };

// Internal poller state for deterministic recovery handling.
let timer: NodeJS.Timeout | null = null;
let isInRecoveryMode = false;
let recoveryStartedAt = 0;
let lastSuccessfulPollAt = 0;
let inFlight = false;

function scheduleNext(delayMs: number) {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(runPoll, delayMs);
}

async function pollOnce(): Promise<PollResult> {
  const presenceService = container.resolve(PresenceService);
  const presenceCache = container.resolve<PresenceCache>(TOKENS.PresenceCache);

  try {
    const [player, recent] = await Promise.all([fetchPlayerSummary(), fetchRecentlyPlayed()]);

    if (!player) {
      logger.warn('[STEAM] No player summary available');
      return { success: false };
    }

    const previous = await presenceCache.getSteam();
    const next = buildSteamPresence(player, recent, previous);

    const recentGames: SteamRecentGame[] =
      recent?.map((entry) => ({
        appId: String(entry.appid),
        name: entry.name,
        iconUrl: buildIconUrl(String(entry.appid), entry.img_icon_url ?? null),
        playtime2WeeksMs:
          typeof entry.playtime_2weeks === 'number' ? entry.playtime_2weeks * 60_000 : null,
        playtimeForeverMs:
          typeof entry.playtime_forever === 'number' ? entry.playtime_forever * 60_000 : null,
      })) ?? [];

    const prevRecent = await presenceCache.getSteamRecent();
    const filteredRecent = next.game?.appId
      ? recentGames.filter((entry) => entry.appId !== next.game?.appId)
      : recentGames;
    const limitedRecent = filteredRecent.slice(0, 3);

    if (shouldEmitSteamRecent(prevRecent, limitedRecent)) {
      await presenceCache.setSteamRecent(limitedRecent);
      await presenceCache.publish('steam.recent.updated', limitedRecent);
    } else if (prevRecent.length === 0 && limitedRecent.length > 0) {
      await presenceCache.setSteamRecent(limitedRecent);
    }

    await presenceService.updateSteam(next, previous);
    return { success: true };
  } catch (error) {
    logger.error({ err: error }, '[STEAM] Poll failed');
    return { success: false };
  }
}

async function markOfflineAfterRecovery() {
  const presenceService = container.resolve(PresenceService);
  const presenceCache = container.resolve<PresenceCache>(TOKENS.PresenceCache);
  const previous = await presenceCache.getSteam();
  const now = Date.now();

  const offline: SteamPresence = {
    state: 'OFFLINE',
    profile: previous?.profile ?? {
      steamId: environment.STEAM_ID,
      nickname: '',
      profileUrl: '',
      avatar: '',
      frameUrl: environment.STEAM_FRAME_URL ?? '',
      backgroundSmall: environment.STEAM_BRACKGROUND_SMALL ?? '',
      backgroundLarge: environment.STEAM_BRACKGROUND_LARGE ?? '',
    },
    game: null,
    session: null,
    lastUpdatedAt: now,
  };

  await presenceService.updateSteam(offline, previous);
}

function enterRecovery() {
  if (isInRecoveryMode) return;
  isInRecoveryMode = true;
  recoveryStartedAt = Date.now();
}

function exitRecovery() {
  isInRecoveryMode = false;
  recoveryStartedAt = 0;
}

async function handleSuccess() {
  lastSuccessfulPollAt = Date.now();
  if (isInRecoveryMode) {
    exitRecovery();
  }
  scheduleNext(POLL_INTERVAL_MS);
}

async function handleFailure() {
  if (!isInRecoveryMode) {
    enterRecovery();
  }

  // Only mark offline after the full recovery window is exhausted.
  const elapsed = Date.now() - recoveryStartedAt;
  if (elapsed >= RECOVERY_WINDOW_MS) {
    exitRecovery();
    await markOfflineAfterRecovery();
    scheduleNext(POLL_INTERVAL_MS);
    return;
  }

  scheduleNext(RECOVERY_INTERVAL_MS);
}

async function runPoll() {
  if (inFlight) {
    return;
  }
  inFlight = true;
  try {
    const result = await pollOnce();
    if (result.success) {
      await handleSuccess();
    } else {
      await handleFailure();
    }
  } finally {
    inFlight = false;
  }
}

export async function refreshSteamPresence(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    const result = await pollOnce();
    if (result.success) {
      await handleSuccess();
    } else {
      await handleFailure();
    }
  } finally {
    inFlight = false;
  }
}

export function startSteamPoller(): () => void {
  runPoll();
  return () => {
    if (timer) {
      clearTimeout(timer);
    }
  };
}
