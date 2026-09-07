/** Lightweight Duo-style feedback tones via Web Audio (no asset files). */

let sharedCtx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  sharedCtx ??= new AudioCtx();
  if (sharedCtx.state === "suspended") void sharedCtx.resume();
  return sharedCtx;
}

function tone(
  ctx: AudioContext,
  {
    frequency,
    start,
    duration,
    type = "sine",
    gain = 0.08,
    slideTo,
  }: {
    frequency: number;
    start: number;
    duration: number;
    type?: OscillatorType;
    gain?: number;
    slideTo?: number;
  },
) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  if (slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), start + duration);
  }
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Bright rising chime — Duo-like “correct!” cue. */
export function playCorrectChime() {
  const ctx = context();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, { frequency: 523.25, start: t, duration: 0.12, type: "triangle", gain: 0.07 });
  tone(ctx, { frequency: 659.25, start: t + 0.08, duration: 0.14, type: "triangle", gain: 0.08 });
  tone(ctx, { frequency: 783.99, start: t + 0.16, duration: 0.22, type: "sine", gain: 0.09 });
}

/** Soft low thud — incorrect cue. */
export function playIncorrectThud() {
  const ctx = context();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, { frequency: 180, start: t, duration: 0.18, type: "square", gain: 0.045, slideTo: 90 });
  tone(ctx, { frequency: 120, start: t + 0.05, duration: 0.2, type: "triangle", gain: 0.04, slideTo: 70 });
}

/** Longer fanfare for badge unlock. */
export function playBadgeFanfare() {
  const ctx = context();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, { frequency: 392, start: t, duration: 0.14, type: "triangle", gain: 0.07 });
  tone(ctx, { frequency: 523.25, start: t + 0.1, duration: 0.16, type: "triangle", gain: 0.08 });
  tone(ctx, { frequency: 659.25, start: t + 0.22, duration: 0.18, type: "sine", gain: 0.09 });
  tone(ctx, { frequency: 783.99, start: t + 0.36, duration: 0.28, type: "sine", gain: 0.1 });
  tone(ctx, { frequency: 1046.5, start: t + 0.48, duration: 0.35, type: "triangle", gain: 0.07 });
}
