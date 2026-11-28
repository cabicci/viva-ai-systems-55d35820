export function encodeWave(samples: Float32Array, rate: number) {
  const buf = new ArrayBuffer(44 + samples.length * 2),
    view = new DataView(buf);
  const tag = (at: number, s: string) =>
    Array.from(s).forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  tag(0, "RIFF");
  view.setUint32(4, buf.byteLength - 8, true);
  tag(8, "WAVE");
  tag(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  tag(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((x, i) =>
    view.setInt16(44 + 2 * i, Math.round(Math.max(-1, Math.min(1, x)) * 32767), true),
  );
  return new Blob([buf], { type: "audio/wav" });
}
