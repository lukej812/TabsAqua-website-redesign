import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader";

export type OceanFrame = {
  /** Seconds since the scene started. */
  time: number;
  /** How far the camera has sunk, in screen heights. */
  scroll: number;
  /**
   * 0 to 1: blend the bottom of the frame into the end color. 1 to 2: the reef's
   * edge is on screen, (end - 1) of the way up; everything below it is end color.
   */
  end: number;
};

export type OceanSettings = {
  /** RGB, 0 to 1. The color of the section after the stage. */
  endColor: readonly [number, number, number];
  /** Sun position across the width, 0 to 1. */
  sunX: number;
  /** Waterline height at rest, 0 (bottom) to 1 (top). */
  water: number;
};

export type OceanRenderer = {
  /** Sets the drawing buffer size, in device pixels. */
  resize: (width: number, height: number) => void;
  render: (frame: OceanFrame) => void;
  settings: (next: Partial<OceanSettings>) => void;
  destroy: () => void;
};

/** Wrap time so float precision on phones never degrades the noise. */
const TIME_WRAP = 600;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Draws the ocean scene into a canvas with plain WebGL 1. Returns null when
 * WebGL is missing or the shader fails to compile, so the caller can keep the
 * static illustration instead.
 */
export function createOceanRenderer(canvas: HTMLCanvasElement, initial: OceanSettings): OceanRenderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One triangle that covers the whole screen.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const u = {
    res: gl.getUniformLocation(program, "uRes"),
    time: gl.getUniformLocation(program, "uTime"),
    scroll: gl.getUniformLocation(program, "uScroll"),
    end: gl.getUniformLocation(program, "uEnd"),
    endColor: gl.getUniformLocation(program, "uEndColor"),
    sunX: gl.getUniformLocation(program, "uSunX"),
    water: gl.getUniformLocation(program, "uWater"),
  };

  const settings = (next: Partial<OceanSettings>) => {
    if (next.endColor) gl.uniform3f(u.endColor, next.endColor[0], next.endColor[1], next.endColor[2]);
    if (next.sunX !== undefined) gl.uniform1f(u.sunX, next.sunX);
    if (next.water !== undefined) gl.uniform1f(u.water, next.water);
  };
  settings(initial);

  return {
    resize(width, height) {
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
    },
    render(frame) {
      gl.uniform1f(u.time, frame.time % TIME_WRAP);
      gl.uniform1f(u.scroll, frame.scroll);
      gl.uniform1f(u.end, frame.end);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    settings,
    destroy() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      // Free the context now rather than whenever the browser gets to it.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/** "#0a3656" to [r, g, b] in 0 to 1. */
export function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}
