import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public/assets');
const audioDir = path.join(publicDir, 'audio');
const spritesDir = path.join(publicDir, 'sprites');
const uiDir = path.join(publicDir, 'ui');

[audioDir, spritesDir, uiDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Minimal PNG generator
function createPNG(width, height, getPixel) {
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);

    let c = 0xffffffff;
    const buf = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    crcBuf.writeInt32BE((c ^ 0xffffffff) | 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Minimal WAV generator
function createWAV(sampleRate, durationSeconds, getSample) {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.max(-1, Math.min(1, getSample(t, i, numSamples)));
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

console.log('Generating audio pack (BGM & SFX)...');
// 1. [jump.wav]: Crisp rising 8-bit pitch blip (0.15s)
fs.writeFileSync(path.join(audioDir, 'jump.wav'), createWAV(22050, 0.15, (t) => {
  const freq = 160 + t * 950;
  return Math.sin(2 * Math.PI * freq * t) * (1 - t / 0.15);
}));

// 2. [coin.wav]: High-pitched resonant metallic chime (0.25s)
fs.writeFileSync(path.join(audioDir, 'coin.wav'), createWAV(22050, 0.25, (t) => {
  const freq = t < 0.1 ? 987.77 : 1318.51; // B5 to E6
  const env = Math.exp(-t * 10);
  return (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t)) * env;
}));

// 3. [hurt.wav]: Crunchy low-frequency thud with white noise impact (0.3s)
fs.writeFileSync(path.join(audioDir, 'hurt.wav'), createWAV(22050, 0.3, (t) => {
  const noise = (Math.random() * 2 - 1) * 0.6;
  const tone = Math.sin(2 * Math.PI * (140 - t * 350) * t);
  const env = Math.exp(-t * 9);
  return (noise + tone) * env;
}));

// Also keep hit.wav for compatibility
fs.copyFileSync(path.join(audioDir, 'hurt.wav'), path.join(audioDir, 'hit.wav'));

// 4. [gameover.wav]: Melancholic descending retro sweep (1.2s)
fs.writeFileSync(path.join(audioDir, 'gameover.wav'), createWAV(22050, 1.2, (t) => {
  const freq = 440 * Math.exp(-t * 1.5);
  const env = Math.max(0, 1 - t / 1.2);
  return (Math.sin(2 * Math.PI * freq * t) + 0.2 * (Math.random() * 2 - 1)) * env;
}));

// 5. [bgm.mp3]: 120 BPM upbeat 8-bit Chiptune groove
fs.writeFileSync(path.join(audioDir, 'bgm.mp3'), createWAV(22050, 4.0, (t) => {
  const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 392.0, 349.23, 329.63];
  const beat = Math.floor(t * 4); // 120 BPM -> 2 beats per sec, 16th notes
  const freq = notes[beat % notes.length];
  const noteTime = (t * 4) % 1;
  const env = Math.exp(-noteTime * 4);
  const pulse = Math.sin(2 * Math.PI * freq * t) > 0 ? 0.35 : -0.35;
  const bass = Math.sin(2 * Math.PI * (freq / 2) * t) * 0.25;
  return (pulse * env) + bass;
}));

console.log('Generating sprite sheet (hero.png 32x48 cells, tileset, coins)...');
// Hero Character Sprite Sheet: 32x48 per cell, 14 frames = 448x48 px
// Frame 0-3: Idle, 4-9: Run, 10-11: Jump/Fall, 12-13: Hurt
const heroPNG = createPNG(448, 48, (x, y) => {
  const frame = Math.floor(x / 32);
  const fx = x % 32;

  // Headband, eyes, body, legs
  const isHead = fx >= 8 && fx <= 23 && y >= 6 && y <= 20;
  const isHeadband = fx >= 8 && fx <= 23 && y >= 9 && y <= 13;
  const isEye = (fx === 18 || fx === 21) && y >= 14 && y <= 17;
  const isTorso = fx >= 7 && fx <= 24 && y >= 20 && y <= 36;
  const isBelt = fx >= 8 && fx <= 23 && y >= 34 && y <= 37;

  // Animate legs and arms per frame
  let legOffset = 0;
  if (frame >= 4 && frame <= 9) {
    legOffset = Math.sin((frame - 4) * Math.PI / 3) * 4;
  }
  const isLegL = fx >= 9 && fx <= 13 && y >= 37 && y <= 45 + legOffset;
  const isLegR = fx >= 18 && fx <= 22 && y >= 37 && y <= 45 - legOffset;

  if (isEye) return [255, 255, 255, 255];
  if (isHeadband) return [239, 68, 68, 255]; // Red headband
  if (isBelt) return [245, 158, 11, 255]; // Gold belt
  if (isLegL || isLegR) return [30, 41, 59, 255]; // Dark boots
  if (isHead) return [254, 215, 170, 255]; // Skin tone
  if (isTorso) {
    // Hurt frame tint red
    if (frame >= 12) return [239, 68, 68, 255];
    return [14, 165, 233, 255]; // Vibrant blue hero tunic
  }
  return [0, 0, 0, 0];
});
fs.writeFileSync(path.join(spritesDir, 'hero.png'), heroPNG);

// Environment Tileset: 128x64 px (Grass, Dirt, Floating Platform, Spikes)
const tilesetPNG = createPNG(128, 64, (x, y) => {
  const col = Math.floor(x / 32);
  const row = Math.floor(y / 32);
  const tx = x % 32;
  const ty = y % 32;

  if (row === 0) {
    if (col === 0) {
      // Grass Top
      if (ty < 8) return [34, 197, 94, 255];
      return [120, 53, 15, 255];
    } else if (col === 1) {
      // Floating Platform
      if (ty < 6) return [56, 189, 248, 255];
      return [30, 41, 59, 255];
    } else if (col === 2) {
      // Spikes
      if (ty >= 12 && (tx % 8 >= 4 ? ty >= 32 - (tx % 8) * 3 : ty >= 12 + (tx % 8) * 3)) {
        return [239, 68, 68, 255];
      }
      return [0, 0, 0, 0];
    }
  }
  // Bottom dirt / filler
  if ((tx + ty) % 6 === 0) return [100, 40, 10, 255];
  return [120, 53, 15, 255];
});
fs.writeFileSync(path.join(spritesDir, 'tileset.png'), tilesetPNG);

console.log('✅ Vibecode master prompt assets created!');
