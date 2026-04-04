/** SmartTimer ringtones using Web Audio API */

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (sharedCtx) return sharedCtx;
  const Ctx =
    window.AudioContext ||
    (window as unknown as {
      webkitAudioContext: typeof AudioContext;
    }).webkitAudioContext;
  if (!Ctx) return null;
  sharedCtx = new Ctx();
  return sharedCtx;
}

/**
 * "Prime" audio so the actual beep can play when the timer ends.
 * Some browsers block AudioContext creation/play unless it happens after a user gesture.
 */
export async function primeSoftChime(volume?: number) {
  const v = volume == null ? 0.45 : Math.min(1, Math.max(0, volume));
  if (v <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  } catch {
    // If resume fails due to autoplay policy, we'll try again at play time.
  }
}

function playToneSequence(
  volume: number,
  tones: Array<{ freq: number; start: number; dur: number }>
) {
  const v = Math.min(1, Math.max(0, volume));
  if (v <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // In case primeSoftChime wasn't called (or resumed failed), try once more.
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }

  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  /** Map 0–1 UI volume to audible gain (was `v * 0.12`, which made the slider feel broken). */
  gain.gain.value = v * 0.42;

  const now = ctx.currentTime;
  const lastEnd = Math.max(...tones.map((t) => t.start + t.dur), 0);
  for (const t of tones) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = t.freq;

    const g = ctx.createGain();
    g.gain.value = 1;

    osc.connect(g);
    g.connect(gain);

    osc.start(now + t.start);
    g.gain.exponentialRampToValueAtTime(0.001, now + t.start + t.dur);
    osc.stop(now + t.start + t.dur + 0.05);
  }

  // Cleanup nodes after the scheduled tones finish.
  setTimeout(() => {
    try {
      gain.disconnect();
    } catch {
      // ignore
    }
  }, Math.ceil((lastEnd + 0.15) * 1000));
}

export type SmartTimerRingtone =
  | "soft_chime"
  | "classic_bell"
  | "triple_ping"
  | "alert_beep";

export function playSoftChime(volume: number) {
  // Gentle two-tone chime.
  playToneSequence(volume, [
    { freq: 523.25, start: 0, dur: 0.35 },
    { freq: 659.25, start: 0.12, dur: 0.45 },
  ]);
}

function playClassicBell(volume: number) {
  // Slightly richer "bell" feel using three notes.
  playToneSequence(volume, [
    { freq: 440, start: 0, dur: 0.18 },
    { freq: 554.37, start: 0.08, dur: 0.2 },
    { freq: 659.25, start: 0.18, dur: 0.28 },
  ]);
}

function playTriplePing(volume: number) {
  playToneSequence(volume, [
    { freq: 523.25, start: 0, dur: 0.18 },
    { freq: 523.25, start: 0.16, dur: 0.18 },
    { freq: 659.25, start: 0.32, dur: 0.22 },
  ]);
}

function playAlertBeep(volume: number) {
  // More urgent / attention-grabbing.
  playToneSequence(volume, [
    { freq: 880, start: 0, dur: 0.12 },
    { freq: 880, start: 0.16, dur: 0.12 },
    { freq: 659.25, start: 0.32, dur: 0.2 },
  ]);
}

export function playSmartTimerRingtone(
  ringtone: SmartTimerRingtone,
  volume: number
) {
  switch (ringtone) {
    case "classic_bell":
      return playClassicBell(volume);
    case "triple_ping":
      return playTriplePing(volume);
    case "alert_beep":
      return playAlertBeep(volume);
    case "soft_chime":
    default:
      return playSoftChime(volume);
  }
}
