// gpu.js
// WebGL pass: szybkie wypełnianie losowym kolorem w kafelkach.
// Minimalny shader, zero romantyzmu.

export function initWebGL(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error("Brak WebGL2. Sprzęt mówi 'nie'.");
  return gl;
}

function createShader(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error("Shader error: " + info);
  }
  return sh;
}

function createProgram(gl, vsSrc, fsSrc) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const pr = gl.createProgram();
  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(pr);
    gl.deleteProgram(pr);
    throw new Error("Program error: " + info);
  }
  return pr;
}

const VS = `#version 300 es
in vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FS = `#version 300 es
precision highp float;
uniform vec2 u_seed;
out vec4 outColor;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
void main() {
  vec2 uv = gl_FragCoord.xy + u_seed;
  float r = hash(uv);
  float g = hash(uv.yx + 13.37);
  float b = hash(uv + 42.0);
  outColor = vec4(r, g, b, 1.0);
}
`;

function setup(gl) {
  const program = createProgram(gl, VS, FS);
  const pos = gl.getAttribLocation(program, "a_pos");
  const seed = gl.getUniformLocation(program, "u_seed");

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  const verts = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  return { program, seed };
}

export async function runGpuPass(gl, ctx2d, W, H, tile, cycles, log) {
  const { program, seed } = setup(gl);
  gl.useProgram(program);
  gl.viewport(0, 0, W, H);

  let done = 0;
  for (let y = 0; y < H && done < cycles; y += tile) {
    for (let x = 0; x < W && done < cycles; x += tile) {
      const w = Math.min(tile, W - x);
      const h = Math.min(tile, H - y);

      gl.uniform2f(seed, Math.random() * 1000.0, Math.random() * 1000.0);
      gl.scissor(x, y, w, h);
      gl.enable(gl.SCISSOR_TEST);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disable(gl.SCISSOR_TEST);

      const pixels = new Uint8Array(w * h * 4);
      gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      const img = new ImageData(new Uint8ClampedArray(pixels), w, h);
      ctx2d.putImageData(img, x, H - y - h);

      done++;
      if (done % 2000 === 0) {
        log("GPU cykle: " + done);
        await new Promise(r => setTimeout(r, 0));
      }
    }
  }
  log("GPU pass zakończony
: " + done);
}
