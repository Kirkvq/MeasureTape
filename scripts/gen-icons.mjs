import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function lerp(a, b, t) { return a + (b - a) * t; }

function makeIcon(size) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  // brand purple gradient, top-left to bottom-right
  const c1 = [124, 58, 237]; // violet-600
  const c2 = [67, 56, 202]; // indigo-700

  // ruler geometry: a diagonal "tape measure" strip with tick marks
  const margin = size * 0.14;

  for (let y = 0; y < size; y++) {
    let rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter byte
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size);
      let r = lerp(c1[0], c2[0], t);
      let g = lerp(c1[1], c2[1], t);
      let b = lerp(c1[2], c2[2], t);

      // rounded-square mask
      const rad = size * 0.22;
      const dx = Math.max(margin - x, x - (size - margin), 0);
      const dy = Math.max(margin - y, y - (size - margin), 0);
      let alpha = 255;
      if (x < margin || x > size - margin || y < margin || y > size - margin) {
        const cornerDist = Math.sqrt(dx * dx + dy * dy);
        alpha = cornerDist > rad ? 0 : 255;
      }

      // draw a white ruler bar diagonally with tick marks
      const cx = size / 2, cy = size / 2;
      const rel = (x - cx) * 0.7071 + (y - cy) * 0.7071; // along diagonal
      const perp = -(x - cx) * 0.7071 + (y - cy) * 0.7071; // across diagonal
      const barHalf = size * 0.09;
      const barLen = size * 0.62;
      if (Math.abs(perp) < barHalf && Math.abs(rel) < barLen) {
        r = 255; g = 255; b = 255;
        // ticks every ~size*0.09 along rel, varying length
        const tickSpacing = size * 0.08;
        const posInTick = ((rel + barLen) % tickSpacing);
        const tickIndex = Math.floor((rel + barLen) / tickSpacing);
        const tickLenFactor = tickIndex % 4 === 0 ? 1 : (tickIndex % 2 === 0 ? 0.65 : 0.4);
        if (posInTick < size * 0.012 && Math.abs(perp) < barHalf * tickLenFactor) {
          r = 124; g = 58; b = 237;
        }
      }

      const idx = rowStart + 1 + x * 4;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = alpha;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
for (const size of [180, 192, 512]) {
  writeFileSync(`public/icons/icon-${size}.png`, makeIcon(size));
  console.log(`wrote icon-${size}.png`);
}
