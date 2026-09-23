// WebGL renderer for the hero reel: draws the <video> on a subdivided plane
// that morphs from the small headline slot into the full-bleed card, twisting
// as it goes. Desktop-only enhancement — Hero.tsx falls back to a plain
// clip-path <video> on mobile / reduced-motion / no-WebGL.
//
// WHY A SUBDIVIDED MESH (and not a single quad):
// the twist comes from giving every vertex its OWN morph schedule. A vertex
// near one corner starts moving before one near the opposite corner, so the
// plane peels/unfolds rather than uniformly scaling. With only 4 corner
// vertices there's nothing to bend; with a grid, the interpolation between
// staggered vertices IS the curve. Three effects stack in the vertex shader:
//
//   1. corner-weighted stagger — per-vertex progress (`sr`), the peel itself
//   2. transient tilt — a rotation about the rect centre that is zero at both
//      ends and peaks mid-morph, so it resolves cleanly instead of landing
//      crooked
//   3. horizontal wobble — small lateral swell through the transition
//
// Technique follows upsunday.co's reel (same stagger/tilt/wobble structure,
// which is itself after Lusion's curl); written here from scratch against our
// own rect/uniform setup.
//
// Coordinates: rects and viewport are CSS px, top-left origin, y down — the
// same space getBoundingClientRect reports, so Hero.tsx passes them straight
// through. DPR only affects the drawing-buffer size, never the math.

const GRID = 32; // quads per side — enough vertices for a smooth bend

const VERTEX_SRC = `
attribute vec2 a_uv;
uniform vec4 u_from;      // x,y,w,h of the small slot, CSS px
uniform vec4 u_to;        // x,y,w,h of the full card, CSS px
uniform float u_progress; // 0..1 morph
uniform float u_twist;    // 0 disables the peel/tilt, 1 = full
uniform vec2 u_viewport;  // CSS px
varying vec2 v_uv;
varying vec2 v_rectWH;

void main() {
  vec2 p = a_uv;

  // 1. Corner-weighted stagger. pw varies across the plane, so the
  //    smoothstep window shifts per vertex and each one crosses the morph at
  //    a different time. This is the peel.
  float pw = 1.0 - (pow(p.x * p.x, 0.75) + pow(1.0 - p.y, 1.5)) * 0.5;
  float spread = 0.45 * u_twist;
  float sr = smoothstep(pw * spread, (1.0 - spread) + pw * spread, u_progress);

  vec4 rect = mix(u_from, u_to, sr);

  // 3. Lateral wobble — swells through the middle, back to zero at the ends.
  rect.x += mix(rect.z, 0.0, cos(sr * 6.2831853) * 0.5 + 0.5) * 0.06 * u_twist;

  vec2 sp = rect.xy + p * rect.zw;

  // 2. Transient tilt about the rect centre. (smoothstep(sr) - sr) is zero at
  //    sr=0 and sr=1 and peaks between, so the rotation always unwinds.
  float rot = (smoothstep(0.0, 1.0, sr) - sr) * -1.05 * u_twist;
  vec2 ctr = rect.xy + rect.zw * 0.5;
  vec2 rel = sp - ctr;
  float s = sin(rot), c = cos(rot);
  sp = ctr + mat2(c, -s, s, c) * rel;

  // CSS px (top-left, y down) -> clip space (centre origin, y up)
  gl_Position = vec4(
    sp.x / u_viewport.x * 2.0 - 1.0,
    1.0 - sp.y / u_viewport.y * 2.0,
    0.0,
    1.0
  );

  v_uv = a_uv;
  v_rectWH = rect.zw;
}
`;

const FRAGMENT_SRC = `
precision highp float;
uniform sampler2D u_video;
uniform float u_videoAspect;
uniform float u_radius;
uniform float u_velocity;
uniform float u_time;
varying vec2 v_uv;
varying vec2 v_rectWH;

void main() {
  // object-fit: cover — shrink the sampled window on whichever axis is
  // over-long for the current rect aspect.
  float planeAspect = v_rectWH.x / max(v_rectWH.y, 1.0);
  vec2 s = planeAspect > u_videoAspect
    ? vec2(1.0, u_videoAspect / planeAspect)
    : vec2(planeAspect / u_videoAspect, 1.0);
  vec2 uv = (v_uv - 0.5) * s + 0.5;

  // Scroll-velocity ripple. upsunday samples a real fluid velocity field here;
  // this is a cheap standing wave scaled by scroll speed — same intent,
  // no fluid sim.
  uv.x += sin(uv.y * 8.0 + u_time * 1.6) * u_velocity * 0.02;

  vec3 col = texture2D(u_video, clamp(uv, 0.0, 1.0)).rgb;

  // Rounded-rect mask in UNDISTORTED rect space, so corners stay clean even
  // while the geometry is twisting.
  vec2 pp = v_uv * v_rectWH;
  vec2 halfWH = v_rectWH * 0.5;
  float r = min(u_radius, min(halfWH.x, halfWH.y));
  vec2 q = abs(pp - halfWH) - (halfWH - vec2(r));
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  float alpha = 1.0 - smoothstep(-1.0, 1.0, d);

  gl_FragColor = vec4(col, alpha);
}
`;

export interface RectPx {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HeroReelGL {
  /** Both endpoint rects live; the shader interpolates per-vertex. */
  setMorph(from: RectPx, to: RectPx, progress: number, radiusPx: number): void;
  setVelocity(v: number): void;
  setVisible(visible: boolean): void;
  resize(): void;
  destroy(): void;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log}`);
  }
  return shader;
}

/** Returns null if WebGL isn't usable — caller falls back to the plain video. */
export function createHeroReelGL(canvas: HTMLCanvasElement, video: HTMLVideoElement): HeroReelGL | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false }) as WebGLRenderingContext | null;
  if (!gl) return null;

  let program: WebGLProgram;
  try {
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    const p = gl.createProgram();
    if (!p) throw new Error("Failed to create program");
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(`Program link error: ${gl.getProgramInfoLog(p)}`);
    }
    program = p;
  } catch (err) {
    // Some drivers create a context fine but fail to compile — treat as "no
    // WebGL" so the caller falls back instead of showing a blank canvas.
    console.warn("Hero WebGL shader failed, falling back to plain video:", err);
    return null;
  }

  gl.useProgram(program);

  // Subdivided grid over 0..1, indexed.
  const verts: number[] = [];
  for (let y = 0; y <= GRID; y++) {
    for (let x = 0; x <= GRID; x++) verts.push(x / GRID, y / GRID);
  }
  const indices: number[] = [];
  const stride = GRID + 1;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const i = y * stride + x;
      indices.push(i, i + 1, i + stride, i + 1, i + stride + 1, i + stride);
    }
  }

  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  const uvLoc = gl.getAttribLocation(program, "a_uv");
  gl.enableVertexAttribArray(uvLoc);
  gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  const indexCount = indices.length;

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // MUST stay false: v_uv is y-down (0 = top of the rect, matching DOM
  // coordinates), so we need texture v=0 to be the video's TOP row, which is
  // what an unflipped upload gives. Setting true flips the video.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const uFrom = gl.getUniformLocation(program, "u_from");
  const uTo = gl.getUniformLocation(program, "u_to");
  const uProgress = gl.getUniformLocation(program, "u_progress");
  const uTwist = gl.getUniformLocation(program, "u_twist");
  const uViewport = gl.getUniformLocation(program, "u_viewport");
  const uVideoAspect = gl.getUniformLocation(program, "u_videoAspect");
  const uRadius = gl.getUniformLocation(program, "u_radius");
  const uVelocity = gl.getUniformLocation(program, "u_velocity");
  const uTime = gl.getUniformLocation(program, "u_time");
  const uVideoSampler = gl.getUniformLocation(program, "u_video");

  let from: RectPx = { x: 0, y: 0, width: 0, height: 0 };
  let to: RectPx = { x: 0, y: 0, width: 0, height: 0 };
  let progress = 0;
  let radius = 0;
  let velocity = 0;
  let visible = true;
  let destroyed = false;
  const startTime = performance.now();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    gl!.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();

  function frame() {
    if (destroyed) return;
    requestAnimationFrame(frame);

    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);

    if (!visible) return;
    // No decoded frame yet — skip rather than upload a black/stale texture.
    if (video.readyState < video.HAVE_CURRENT_DATA || video.videoWidth === 0) return;

    gl!.bindTexture(gl!.TEXTURE_2D, texture);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, video);

    gl!.uniform4f(uFrom, from.x, from.y, from.width, from.height);
    gl!.uniform4f(uTo, to.x, to.y, to.width, to.height);
    gl!.uniform1f(uProgress, progress);
    gl!.uniform1f(uTwist, 1);
    gl!.uniform2f(uViewport, window.innerWidth, window.innerHeight);
    gl!.uniform1f(uVideoAspect, video.videoWidth / video.videoHeight);
    gl!.uniform1f(uRadius, radius);
    gl!.uniform1f(uVelocity, velocity);
    gl!.uniform1f(uTime, (performance.now() - startTime) / 1000);
    gl!.uniform1i(uVideoSampler, 0);

    gl!.drawElements(gl!.TRIANGLES, indexCount, gl!.UNSIGNED_SHORT, 0);
  }
  requestAnimationFrame(frame);

  return {
    setMorph(f, t, p, radiusPx) {
      from = f;
      to = t;
      progress = p;
      radius = radiusPx;
    },
    setVelocity(v) {
      velocity = v;
    },
    setVisible(v) {
      visible = v;
    },
    resize,
    destroy() {
      destroyed = true;
      gl!.deleteTexture(texture);
      gl!.deleteBuffer(uvBuffer);
      gl!.deleteBuffer(indexBuffer);
      gl!.deleteProgram(program);
    },
  };
}
