let cached;

/** True when the browser can create a WebGL context (checked once with a throwaway canvas). */
export function webglAvailable() {
  if (cached !== undefined) return cached;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    cached = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext(); // free the probe context right away
  } catch {
    cached = false;
  }
  return cached;
}
