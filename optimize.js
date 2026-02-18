// optimize.js
// „OptiFine” dla twojej przeglądarki. Czyli zdrowy rozsądek w kodzie.

export function logFactory(el) {
  return (msg) => {
    el.textContent += msg + "\n";
    el.scrollTop = el.scrollHeight;
  };
}

export function clampSize(size) {
  const MAX = 24000; // powyżej wielu przeglądarek się poddaje
  const MIN = 4000;
  if (Number.isNaN(size)) return 8000;
  return Math.max(MIN, Math.min(MAX, size));
}

export async function smartYield() {
  if ("scheduler" in window && "yield" in scheduler) {
    await scheduler.yield();
  } else {
    await new Promise(r => setTimeout(r, 0));
  }
}

export function composeLayers(ctx, canvases) {
  const W = canvases[0].width;
  const H = canvases[0].height;
  ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(canvases[0], 0, 0);
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(canvases[1], 0, 0);
  ctx.globalCompositeOperation = "overlay";
  ctx.drawImage(canvases[2], 0, 0);
  ctx.globalCompositeOperation = "source-over";
}

export function saveCanvas(canvas, name) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = name;
  a.click();
}

export function throttle(fn, wait = 16) {
  let t = 0;
  return (...args) => {
    const now = performance.now();
    if (now - t >= wait) {
      t = now;
      return fn(...args);
    }
  };
}

export function detectGPU() {
  const c = document.createElement("canvas");
  const gl = c.getContext("webgl2") || c.getContext("webgl");
  return !!gl;
}

export function memoryHint() {
  if ("deviceMemory" in navigator) {
    return navigator.deviceMemory;
  }
  return 4;
}

export function pickTile(baseTile) {
  const mem = memoryHint();
  if (mem >= 16) return baseTile;
  if (mem >= 8) return Math.max(16, Math.floor(baseTile * 0.75));
  return Math.max(8, Math.floor(baseTile * 0.5));
}

export function bigArrayGuard(width, height) {
  const pixels = width * height;
  if (pixels > 400000000) {
    throw new Error("Za duże. Zmniejsz wymiar albo kup lepszy sprzęt.");
  }
}

export function progressBar(el, total) {
  let last = 0;
  return (v) => {
    if (v - last > total * 0.01) {
      el.textContent = `Postęp: ${Math.floor((v/total)*100)}%`;
      last = v;
    }
  };
}

export function noop() {}

export function seedRand(seed) {
  let t = seed >>> 0;
  return () => {
    t ^= t << 13; t ^= t >> 17; t ^= t << 5;
    return (t >>> 0) / 4294967296;
  };
}

export function blendAdd(ctx, src) {
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}

export function blendMultiply(ctx, src) {
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}

export function blendOverlay(ctx, src) {
  ctx.globalCompositeOperation = "overlay";
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}

export function makeOffscreen(w, h) {
  if ("OffscreenCanvas" in window) {
    return new OffscreenCanvas(w, h);
  }
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}
