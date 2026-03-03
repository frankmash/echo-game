/**
 * Echo Game — Sound Engine
 * All sounds are synthesized via Web Audio API. No audio files needed.
 */

let ctx = null;
let muted = false;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function master(gain = 0.4) {
  const g = getCtx().createGain();
  g.gain.value = gain;
  g.connect(getCtx().destination);
  return g;
}

// ─── Primitive builders ────────────────────────────────────────────────────

function osc(type, freq, start, duration, gainVal, out, pitchEnd = null) {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (pitchEnd !== null) o.frequency.exponentialRampToValueAtTime(pitchEnd, start + duration);
  g.gain.setValueAtTime(gainVal, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + duration);
  o.connect(g);
  g.connect(out);
  o.start(start);
  o.stop(start + duration + 0.01);
}

function noise(start, duration, gainVal, out, filterFreq = 2000) {
  const c = getCtx();
  const bufSize = c.sampleRate * duration;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(gainVal, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(out);
  src.start(start);
}

// ─── Sound definitions ─────────────────────────────────────────────────────

export function playAccept() {
  if (muted) return;
  const c = getCtx();
  const out = master(0.35);
  const t = c.currentTime;
  // Bright upward chime: C5 → E5 → G5
  osc('sine', 523, t,        0.25, 0.5, out);
  osc('sine', 659, t + 0.1,  0.25, 0.5, out);
  osc('sine', 784, t + 0.2,  0.35, 0.5, out);
  // Subtle sparkle overtone
  osc('sine', 1568, t + 0.2, 0.2,  0.15, out);
}

export function playReject() {
  if (muted) return;
  const c = getCtx();
  const out = master(0.4);
  const t = c.currentTime;
  // Downward buzzer: descending dissonant pair
  osc('sawtooth', 220, t,       0.15, 0.4, out, 110);
  osc('sawtooth', 196, t + 0.05, 0.2, 0.4, out, 98);
  // Low thud
  osc('sine', 80, t, 0.15, 0.6, out, 40);
}

export function playVoteYes() {
  if (muted) return;
  const c = getCtx();
  const out = master(0.2);
  const t = c.currentTime;
  osc('sine', 880, t, 0.12, 0.4, out, 1046);
}

export function playVoteNo() {
  if (muted) return;
  const c = getCtx();
  const out = master(0.2);
  const t = c.currentTime;
  osc('square', 220, t, 0.1, 0.25, out, 180);
}

export function playTick(urgency = 0) {
  // urgency: 0 = normal, 1 = warning (last 5s)
  if (muted) return;
  const c = getCtx();
  const out = master(urgency ? 0.3 : 0.15);
  const t = c.currentTime;
  const freq = urgency ? 880 : 660;
  osc('square', freq, t, 0.04, 0.8, out);
}

export function playTimerExpire() {
  if (muted) return;
  const c = getCtx();
  const out = master(0.45);
  const t = c.currentTime;
  // Descending alarm
  for (let i = 0; i < 3; i++) {
    osc('sawtooth', 440, t + i * 0.12, 0.1, 0.5, out, 330);
  }
  noise(t, 0.3, 0.15, out, 800);
}

export function playStreakBonus() {
  if (muted) return;
  const c = getCtx();
  const out = master(0.4);
  const t = c.currentTime;
  // Fanfare: ascending arpeggio + shimmer
  const notes = [523, 659, 784, 1046, 1318];
  notes.forEach((freq, i) => {
    osc('sine', freq, t + i * 0.07, 0.3, 0.5, out);
    osc('triangle', freq * 2, t + i * 0.07, 0.2, 0.15, out);
  });
}

export function playDoubleActivate() {
  if (muted) return;
  const c = getCtx();
  const out = master(0.3);
  const t = c.currentTime;
  // Rising power-up sound
  osc('sine', 400, t,       0.15, 0.5, out, 800);
  osc('sine', 600, t + 0.1, 0.15, 0.2, out, 1200);
  osc('triangle', 1200, t + 0.25, 0.15, 0.3, out);
}

export function playSkipSound() {
  if (muted) return;
  const c = getCtx();
  const out = master(0.3);
  const t = c.currentTime;
  // Quick whoosh
  osc('sawtooth', 600, t, 0.12, 0.4, out, 200);
  noise(t, 0.12, 0.1, out, 3000);
}

export function playChallengeSound() {
  if (muted) return;
  const c = getCtx();
  const out = master(0.35);
  const t = c.currentTime;
  // Dramatic sting
  osc('sawtooth', 150, t,       0.08, 0.6, out);
  osc('sawtooth', 300, t + 0.08, 0.1, 0.5, out);
  osc('square',   600, t + 0.16, 0.1, 0.4, out);
  noise(t + 0.08, 0.2, 0.12, out, 1200);
}

export function playWordSubmit() {
  if (muted) return;
  const c = getCtx();
  const out = master(0.2);
  const t = c.currentTime;
  osc('sine', 440, t, 0.08, 0.4, out, 550);
}

export function playRoundStart() {
  if (muted) return;
  const c = getCtx();
  const out = master(0.35);
  const t = c.currentTime;
  // Short attention chime
  osc('sine', 523, t,        0.2, 0.5, out);
  osc('sine', 784, t + 0.15, 0.25, 0.5, out);
  osc('sine', 1046, t + 0.3, 0.2, 0.4, out);
}

export function playGameOver() {
  if (muted) return;
  const c = getCtx();
  const out = master(0.4);
  const t = c.currentTime;
  // Resolving cadence
  const melody = [523, 659, 523, 392, 523];
  melody.forEach((freq, i) => {
    osc('sine', freq, t + i * 0.18, 0.25, 0.5, out);
    osc('triangle', freq / 2, t + i * 0.18, 0.25, 0.2, out);
  });
}

export function playJoin() {
  if (muted) return;
  const c = getCtx();
  const out = master(0.2);
  const t = c.currentTime;
  osc('sine', 440, t,       0.1, 0.4, out);
  osc('sine', 550, t + 0.1, 0.12, 0.3, out);
}

// ─── Mute control ─────────────────────────────────────────────────────────

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

export function unlockAudio() {
  getCtx();
}