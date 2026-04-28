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
  tones: Array<{ freq: number; start: number; dur: number }>,
  repeats: number = 1
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
  
  const originalLastEnd = Math.max(...tones.map((t) => t.start + t.dur), 0);
  const gapBetweenRepeats = 1.0; 
  
  const allTones = [];
  for (let r = 0; r < repeats; r++) {
    const offset = r * (originalLastEnd + gapBetweenRepeats);
    for (const t of tones) {
      allTones.push({
        freq: t.freq,
        start: t.start + offset,
        dur: t.dur
      });
    }
  }

  const lastEnd = Math.max(...allTones.map((t) => t.start + t.dur), 0);
  for (const t of allTones) {
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
  | "alert_beep"
  | "long_chime"
  | "digital_alarm"
  | "zen_gong";

export function playSoftChime(volume: number, repeats: number = 1) {
  // Gentle two-tone chime.
  playToneSequence(volume, [
    { freq: 523.25, start: 0, dur: 0.35 },
    { freq: 659.25, start: 0.12, dur: 0.45 },
  ], repeats);
}

function playClassicBell(volume: number, repeats: number = 1) {
  // Slightly richer "bell" feel using three notes.
  playToneSequence(volume, [
    { freq: 440, start: 0, dur: 0.18 },
    { freq: 554.37, start: 0.08, dur: 0.2 },
    { freq: 659.25, start: 0.18, dur: 0.28 },
  ], repeats);
}

function playTriplePing(volume: number, repeats: number = 1) {
  playToneSequence(volume, [
    { freq: 523.25, start: 0, dur: 0.18 },
    { freq: 523.25, start: 0.16, dur: 0.18 },
    { freq: 659.25, start: 0.32, dur: 0.22 },
  ], repeats);
}

function playAlertBeep(volume: number, repeats: number = 1) {
  // More urgent / attention-grabbing. Four bursts.
  playToneSequence(volume, [
    // Burst 1
    { freq: 880, start: 0, dur: 0.12 },
    { freq: 880, start: 0.16, dur: 0.12 },
    { freq: 659.25, start: 0.32, dur: 0.2 },
    // Burst 2
    { freq: 880, start: 0.8, dur: 0.12 },
    { freq: 880, start: 0.96, dur: 0.12 },
    { freq: 659.25, start: 1.12, dur: 0.2 },
    // Burst 3
    { freq: 880, start: 1.6, dur: 0.12 },
    { freq: 880, start: 1.76, dur: 0.12 },
    { freq: 659.25, start: 1.92, dur: 0.2 },
    // Burst 4
    { freq: 880, start: 2.4, dur: 0.12 },
    { freq: 880, start: 2.56, dur: 0.12 },
    { freq: 659.25, start: 2.72, dur: 0.2 },
  ], repeats);
}

function playLongChime(volume: number, repeats: number = 1) {
  // A gentle sweeping 3-second chime
  playToneSequence(volume, [
    { freq: 440, start: 0, dur: 1.0 },
    { freq: 554.37, start: 0.5, dur: 1.0 },
    { freq: 659.25, start: 1.0, dur: 1.0 },
    { freq: 880, start: 1.5, dur: 1.5 },
  ], repeats);
}

function playDigitalAlarm(volume: number, repeats: number = 1) {
  // 3 seconds of repeated digital beeps
  const tones = [];
  for (let i = 0; i < 12; i++) {
    tones.push({ freq: 1000, start: i * 0.25, dur: 0.1 });
    tones.push({ freq: 1200, start: i * 0.25 + 0.1, dur: 0.1 });
  }
  playToneSequence(volume, tones, repeats);
}

function playZenGong(volume: number, repeats: number = 1) {
  // A long resonating gong/bell sound
  playToneSequence(volume, [
    { freq: 200, start: 0, dur: 3.0 },
    { freq: 205, start: 0, dur: 3.0 },
    { freq: 400, start: 0, dur: 2.0 },
  ], repeats);
}

export function playSmartTimerRingtone(
  ringtone: SmartTimerRingtone,
  volume: number,
  repeats: number = 1
) {
  switch (ringtone) {
    case "classic_bell":
      return playClassicBell(volume, repeats);
    case "triple_ping":
      return playTriplePing(volume, repeats);
    case "alert_beep":
      return playAlertBeep(volume, repeats);
    case "long_chime":
      return playLongChime(volume, repeats);
    case "digital_alarm":
      return playDigitalAlarm(volume, repeats);
    case "zen_gong":
      return playZenGong(volume, repeats);
    case "soft_chime":
    default:
      return playSoftChime(volume, repeats);
  }
}
