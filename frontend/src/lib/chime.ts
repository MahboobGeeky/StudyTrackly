/** Soft two-tone chime using Web Audio API */
export function playSoftChime(volume: number) {
  const v = Math.min(1, Math.max(0, volume));
  if (v <= 0) return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.value = v * 0.12;

  const playTone = (freq: number, start: number, dur: number) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = 1;
    osc.connect(g);
    g.connect(gain);
    osc.start(ctx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    osc.stop(ctx.currentTime + start + dur + 0.05);
  };

  playTone(523.25, 0, 0.35);
  playTone(659.25, 0.12, 0.45);

  setTimeout(() => {
    void ctx.close();
  }, 900);
}
