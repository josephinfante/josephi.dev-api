console.log("YT Now Playing loaded");

const socket = new WebSocket(
  "ws://localhost:3001/ws/music?token=mi_token_ultra_secreto",
);

socket.onopen = () => console.log("WS connected");
socket.onerror = (e) => console.log("WS error", e);

/* ---------------- PLAYER SELECTORS ---------------- */

function getPlayer() {
  return document.querySelector("ytmusic-player-bar");
}

function getTitle() {
  return (
    document.querySelector("ytmusic-player-bar yt-formatted-string.title")
      ?.innerText || null
  );
}

function getArtist() {
  const el = document.querySelector(
    "ytmusic-player-bar .subtitle yt-formatted-string",
  );
  if (!el) return "";
  return el.innerText.split("•")[0].trim();
}

function getCover() {
  return document.querySelector("ytmusic-player-bar img.image")?.src || null;
}

function getProgressText() {
  return (
    document.querySelector("ytmusic-player-bar .time-info")?.innerText || null
  );
}

function getProgressPercent() {
  const bar = document.querySelector("ytmusic-player-bar #progress-bar");
  if (!bar) return null;

  const value = Number(bar.getAttribute("value"));
  const max = Number(bar.getAttribute("aria-valuemax"));

  if (!max) return null;
  return Math.round((value / max) * 100);
}

function isPlaying() {
  return !!document.querySelector(
    "ytmusic-player-bar #play-pause-button[title='Pause']",
  );
}

function getListenUrl() {
  const link = document.querySelector("a.ytp-title-link");
  if (!link) return null;

  const href = link.getAttribute("href");
  if (!href) return null;

  try {
    const url = new URL(href);
    const videoId = url.searchParams.get("v");
    if (!videoId) return null;
    return `https://music.youtube.com/watch?v=${videoId}`;
  } catch {
    return null;
  }
}

/* ---------------- STATE LOGIC ---------------- */

function getState(song) {
  if (!song) return "STOPPED";
  if (!song.isPlaying) return "PAUSED";
  return "PLAYING";
}

function getSong() {
  if (!getPlayer()) return null;

  const title = getTitle();
  if (!title) return null;

  return {
    title,
    artist: getArtist(),
    cover: getCover(),
    progressText: getProgressText(),
    progressPercent: getProgressPercent(),
    isPlaying: isPlaying(),
  };
}

/* ---------------- DIFF LOGIC ---------------- */

let lastSent = null;

function shouldSend(prev, next) {
  if (!prev) return true;

  if (prev.title !== next.title) return true;
  if (prev.artist !== next.artist) return true;
  if (prev.state !== next.state) return true;
  if (prev.listenUrl !== next.listenUrl) return true;

  if (next.state !== "PLAYING") return false;

  if (
    next.progressPercent !== null &&
    prev.progressPercent !== null &&
    Math.abs(next.progressPercent - prev.progressPercent) >= 3
  ) {
    return true;
  }

  return false;
}

/* ---------------- LOOP CONTROL ---------------- */

setInterval(() => {
  const song = getSong();
  const state = getState(song);

  if (state === "STOPPED") {
    if (!lastSent || lastSent.state !== "STOPPED") {
      socket.send(JSON.stringify({ type: "STOPPED" }));
      console.log("Sent: STOPPED");
      lastSent = { state: "STOPPED" };
    }
    return;
  }

  const payload = {
    type: "NOW_PLAYING",
    ...song,
    state,
    listenUrl: getListenUrl(),
  };

  if (!shouldSend(lastSent, payload)) return;

  const finalPayload = {
    ...payload,
    timestamp: Date.now(),
  };

  socket.send(JSON.stringify(finalPayload));
  console.log("Sent:", finalPayload);

  lastSent = payload;
}, 2000);
