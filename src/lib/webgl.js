function probe(attributes) {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', attributes) || canvas.getContext('webgl', attributes);
    gl?.getExtension('WEBGL_lose_context')?.loseContext(); // free the probe context right away
    return !!gl;
  } catch {
    return false;
  }
}

let available;
let accelerated;

/** Rough hint of a modest device: 4 or fewer CPU cores, or 4 GB of memory or less. */
export function lowEndDevice() {
  return (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
}

/** True when the browser can create a WebGL context (checked once with a throwaway canvas). */
export function webglAvailable() {
  available ??= probe();
  return available;
}

/** False when the browser warns that WebGL would be very slow (typically software rendering, no GPU). */
export function webglAccelerated() {
  accelerated ??= probe({ failIfMajorPerformanceCaveat: true });
  return accelerated;
}
