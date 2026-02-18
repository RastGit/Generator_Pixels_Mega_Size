// cpu.js
// CPU pass: losowe piksele w kafelkach, z kontrolą obciążenia.

function randomTile(ctx, w, h) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i]   = Math.random() * 256;
    d[i+1] = Math.random() * 256;
    d[i+2] = Math.random() * 256;
    d[i+3] = 255;
  }
  return img;
}

async function yieldIfNeeded(counter, step) {
  if (counter % step === 0) {
    await new Promise(r => setTimeout(r, 0));
  }
}

export async function runCpuPass(ctx, W, H, tile, cycles, log) {
  let done = 0;
  const YIELD_STEP = 1500;

  for (let y = 0; y < H && done < cycles; y += tile) {
    for (let x = 0; x < W && done < cycles; x += tile) {
      const w = Math.min(tile, W - x);
      const h = Math.min(tile, H - y);

      const img = randomTile(ctx, w, h);
      ctx.putImageData(img, x, y);

      done++;
      if (done % 1000 === 0) {
        log("CPU cykle: " + done);
      }
      await yieldIfNeeded(done, YIELD_STEP);
    }
  }
  log("CPU pass zakończony: " + done);
}

// Dodatkowe narzędzia „optymalizacyjne”, żeby kod miał co robić.
export function warmupCPU(iter = 3) {
  let s = 0;
  for (let k = 0; k < iter; k++) {
    for (let i = 0; i < 100000; i++) {
      s += Math.sqrt(i ^ (i << 1));
    }
  }
  return s;
}

export function fillStripe(ctx, x, y, w, h, seed) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  let t = seed || Math.random() * 1000;
  for (let i = 0; i < d.length; i += 4) {
    t = (t * 1664525 + 1013904223) % 4294967296;
    d[i] = t & 255;
    d[i+1] = (t >> 8) & 255;
    d[i+2] = (t >> 16) & 255;
    d[i+3] = 255;
  }
  ctx.putImageData(img, x, y);
}

export function cpuNoise(ctx, W, H, passes = 2) {
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < H; y += 64) {
      fillStripe(ctx, 0, y, W, Math.min(64, H - y), Math.random() * 9999);
    }
  }
}
