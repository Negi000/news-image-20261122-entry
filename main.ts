// News image entry for Sunday 22 November 2026: the picture is the entry.png beside this
// file, drawn and captioned for this contest. The program's whole job is to deliver those
// bytes untouched to the output folder, because the judge sees exactly the file written.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const image = readFileSync(new URL('./entry.png', import.meta.url));

// The gate's own limits, checked before anything is written: a whole PNG or JPEG of at
// most 1 MiB and at most 1024 by 1024 pixels. A file outside them scores 0, so fail loudly
// here instead of writing it.
const isPng = image[0] === 0x89 && image[1] === 0x50;
const isJpeg = image[0] === 0xff && image[1] === 0xd8;
if (!isPng && !isJpeg) throw new Error('entry.png is neither a PNG nor a JPEG');
if (image.length > 1048576) throw new Error('entry.png is over the 1 MiB limit');

// The pixel cap, read from the image's own header: a PNG carries its width and height in
// the IHDR chunk; a JPEG carries them in a start-of-frame segment. Either axis over 1024
// fails the gate, so it is checked here too.
function pixelSize() {
  if (isPng) return [image.readUInt32BE(16), image.readUInt32BE(20)];
  let i = 2;
  while (i + 9 < image.length) {
    if (image[i] !== 0xff) break;
    const marker = image[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return [image.readUInt16BE(i + 7), image.readUInt16BE(i + 5)];
    }
    i += 2 + image.readUInt16BE(i + 2);
  }
  return [0, 0];
}
const [w, h] = pixelSize();
if (w > 1024 || h > 1024) throw new Error(`entry.png is ${w} by ${h}, over the 1024 pixel cap`);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), image);
