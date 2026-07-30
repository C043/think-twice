/**
 * Regenerates every PWA/favicon asset from the vector master.
 *
 * Run with `npm run icons` after changing think_twice.svg.
 *
 * The master is a landscape wordmark (~1.62:1) on a transparent canvas, which
 * makes a poor square icon on its own: launchers crop maskable icons to circles
 * and squircles, which would clip the outer bars. So every icon here sits the
 * mark in solid white on a full-bleed indigo plate, trimmed to its bounding box
 * and re-centred with the margin that target needs.
 */
import { Buffer } from "node:buffer";
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "think_twice.svg");
const ICON_DIR = path.join(ROOT, "public", "icons");
const APP_DIR = path.join(ROOT, "src", "app");

/** The plate: `--accent` from the dark theme down to `--accent-hover`. */
const PLATE_FROM = "#818cf8";
const PLATE_TO = "#4f46e5";

/** Density high enough that the plate gradient never bands after downscaling. */
const RENDER_WIDTH = 2560;

function plateSvg(size) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<defs><linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="${PLATE_FROM}"/>` +
      `<stop offset="100%" stop-color="${PLATE_TO}"/>` +
      `</linearGradient></defs>` +
      `<rect width="${size}" height="${size}" fill="url(#plate)"/></svg>`,
  );
}

/**
 * Renders the master once and trims it to the artwork. The trim offsets are kept
 * because `markSvg` needs the bounding box back in the master's own user units.
 */
async function loadArtwork() {
  const source = await readFile(SOURCE, "utf8");
  const viewBox = source.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (!viewBox) throw new Error("think_twice.svg has no integer viewBox");

  const scale = RENDER_WIDTH / Number(viewBox[1]);
  const rendered = await sharp(Buffer.from(source), { density: 384 })
    .resize({ width: RENDER_WIDTH })
    .png()
    .toBuffer();
  const { data, info } = await sharp(rendered)
    .trim({ threshold: 1 })
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    source,
    box: {
      x: info.trimOffsetLeft ? -info.trimOffsetLeft / scale : 0,
      y: info.trimOffsetTop ? -info.trimOffsetTop / scale : 0,
      width: info.width / scale,
      height: info.height / scale,
    },
  };
}

/** The mark as flat white: keep the alpha channel, replace every colour. */
async function whiteMark({ data }) {
  const { width, height } = await sharp(data).metadata();
  const alpha = await sharp(data).ensureAlpha().extractChannel("alpha").toBuffer();

  return sharp({ create: { width, height, channels: 3, background: "#ffffff" } })
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

/**
 * Composites the mark onto a square, leaving `1 - coverage` of the canvas as
 * margin. `plate` of false keeps the canvas transparent (notification badges).
 */
async function icon(mark, { size, coverage, plate = true, opaque = false }) {
  const box = Math.round(size * coverage);
  const inner = await sharp(mark)
    .resize({ width: box, height: box, fit: "inside" })
    .toBuffer({ resolveWithObject: true });

  const layers = [];
  if (plate) {
    layers.push({
      input: await sharp(plateSvg(size)).png().toBuffer(),
      left: 0,
      top: 0,
    });
  }
  layers.push({
    input: inner.data,
    left: Math.round((size - inner.info.width) / 2),
    top: Math.round((size - inner.info.height) / 2),
  });

  let canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(layers);

  // iOS does not composite alpha, it renders it black, so apple-touch-icon.png
  // ships with no alpha channel at all.
  if (opaque) canvas = canvas.flatten({ background: PLATE_TO }).removeAlpha();

  return canvas.png({ compressionLevel: 9 }).toBuffer();
}

/**
 * The same composition as `icon`, but as vector: the master's markup is inlined
 * with every fill forced to white, over the plate, scaled so the artwork's
 * bounding box lands centred inside a `size` square.
 */
function markSvg({ source, box }, { size, coverage }) {
  const inner = source
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/fill:\s*url\(#[^)]*\)/g, "fill: #ffffff")
    .replace(/fill="url\(#[^)]*\)"/g, 'fill="#ffffff"');

  const scale = (size * coverage) / Math.max(box.width, box.height);
  const left = (size - box.width * scale) / 2 - box.x * scale;
  const top = (size - box.height * scale) / 2 - box.y * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
<defs>
<linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${PLATE_FROM}"/>
<stop offset="100%" stop-color="${PLATE_TO}"/>
</linearGradient>
</defs>
<rect width="${size}" height="${size}" fill="url(#plate)"/>
<g transform="translate(${left.toFixed(3)} ${top.toFixed(3)}) scale(${scale.toFixed(6)})">${inner}</g>
</svg>
`;
}

/** Minimal ICO container wrapping PNG payloads (what browsers prefer today). */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette size: 0 for PNG payloads
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
}

const artwork = await loadArtwork();
const mark = await whiteMark(artwork);
await mkdir(ICON_DIR, { recursive: true });

const targets = [
  // `purpose: "any"`: shown uncropped, so the mark can run wider.
  { file: "icon-192.png", size: 192, coverage: 0.7 },
  { file: "icon-512.png", size: 512, coverage: 0.7 },
  // `purpose: "maskable"`: a launcher may crop to a circle, so stay well inside
  // the safe zone (a circle of 80% diameter).
  { file: "icon-192-maskable.png", size: 192, coverage: 0.62 },
  { file: "icon-512-maskable.png", size: 512, coverage: 0.62 },
  // iOS rounds the corners itself; 0.7 keeps the mark clear of them.
  { file: "apple-touch-icon.png", size: 180, coverage: 0.7, opaque: true },
];

for (const { file, ...options } of targets) {
  await writeFile(path.join(ICON_DIR, file), await icon(mark, options));
  console.log(`wrote public/icons/${file}`);
}

// Notification badges are masked to a flat colour by the OS: white mark, no plate.
await writeFile(
  path.join(ICON_DIR, "badge-96.png"),
  await icon(mark, { size: 96, coverage: 0.88, plate: false }),
);
console.log("wrote public/icons/badge-96.png");

// The plated mark as vector, for the browser tab on engines that take an SVG
// favicon. Kept out of src/app/ so it does not race the favicon.ico convention.
await writeFile(
  path.join(ICON_DIR, "icon.svg"),
  markSvg(artwork, { size: 512, coverage: 0.7 }),
);
// The untouched master, for in-app usage where the gradient mark belongs.
await copyFile(SOURCE, path.join(ICON_DIR, "logo.svg"));
console.log("wrote public/icons/icon.svg, public/icons/logo.svg");

const ico = buildIco(
  await Promise.all(
    // 64 is included so retina tabs have a native size to sample.
    [16, 32, 48, 64].map(async (size) => ({
      size,
      data: await icon(mark, { size, coverage: 0.78 }),
    })),
  ),
);
await writeFile(path.join(APP_DIR, "favicon.ico"), ico);
console.log("wrote src/app/favicon.ico");
