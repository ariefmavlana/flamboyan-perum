import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsRoot = path.join(root, ".tools/flamboyan-assets");
const outputFile = path.join(root, "scripts/flamboyan-house-assets.json");

export const types = [
  "36/60",
  "36/72",
  "36/90",
  "62/70",
  "62/84",
  "69/80",
  "56/90",
  "56/108",
  "62/140",
];
export const photoTypes = ["36/60", "36/90", "56/90", "62/70", "69/80"];
export const maxBytes = 5 * 1024 * 1024;
export const maxPixels = 40_000_000;
export const maxDimension = 20000;
const maxAltLength = 240;

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\.jpe?g$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function jpegSize(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8)
    throw new Error("Bukan JPEG");
  let offset = 2;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) throw new Error("Marker JPEG tidak valid");
    const marker = buffer[offset + 1];
    offset += 2;
    if (
      marker === 0xd8 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    )
      continue;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length)
      throw new Error("Segmen JPEG tidak valid");
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    )
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    offset += length;
  }
  throw new Error("Dimensi JPEG tidak ditemukan");
}

function propertySlug(houseType) {
  return `bukit-flamboyan-indah-2-${houseType.replace("/", "-")}`;
}

function orderKey(name) {
  const numbered = /(\d+)\.jpe?g$/i.exec(name);
  if (numbered) return { group: 0, rank: Number(numbered[1]), name };
  return { group: 1, rank: 0, name };
}

export function sortFiles(names) {
  return [...names].sort((a, b) => {
    const left = orderKey(a);
    const right = orderKey(b);
    if (left.group !== right.group) return left.group - right.group;
    if (left.rank !== right.rank) return left.rank - right.rank;
    return left.name.localeCompare(right.name);
  });
}

export async function buildManifest() {
  const seen = new Map();
  const skipped = [];
  const assets = [];
  for (const houseType of photoTypes) {
    const folder = path.join(assetsRoot, "edited", houseType.replace("/", "-"));
    const entries = sortFiles(
      (await fs.readdir(folder)).filter((name) => /\.jpe?g$/i.test(name)),
    );
    const videos = (await fs.readdir(folder)).filter((name) =>
      /\.mp4$/i.test(name),
    );
    for (const video of videos)
      skipped.push({
        file: `edited/${houseType.replace("/", "-")}/${video}`,
        reason: "video — menunggu URL YouTube untuk embed",
      });
    let photoIndex = 0;
    let position = 0;
    for (const name of entries) {
      const relative = `edited/${houseType.replace("/", "-")}/${name}`;
      const bytes = await fs.readFile(path.join(assetsRoot, relative));
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      if (seen.has(sha256)) {
        skipped.push({
          file: relative,
          reason: `duplikat byte identik dari ${seen.get(sha256)}`,
        });
        continue;
      }
      seen.set(sha256, relative);
      const { width, height } = jpegSize(bytes);
      if (bytes.length > maxBytes)
        throw new Error(`Melebihi 5 MiB: ${relative}`);
      if (width > maxDimension || height > maxDimension)
        throw new Error(`Dimensi di luar batas: ${relative}`);
      if (width * height > maxPixels)
        throw new Error(`Melebihi 40 MP: ${relative}`);
      const isGenerated = /^gemini/i.test(name);
      const slug = slugify(name);
      if (!isGenerated) photoIndex += 1;
      const alt =
        isGenerated
          ? `Ilustrasi AI · tipe ${houseType} · bukan foto kondisi aktual. [ED:${slug}]`
          : `Dokumentasi tipe ${houseType} #${photoIndex} · Foto dokumentasi pengguna; kondisi unit dikonfirmasi saat kunjungan. [ED:${slug}]`;
      if (alt.length > maxAltLength)
        throw new Error(`Alt melebihi ${maxAltLength} karakter: ${relative}`);
      assets.push({
        key: slug,
        file: relative,
        sha256,
        bytes: bytes.length,
        width,
        height,
        kind: "PHOTO",
        house_type: houseType,
        alt,
        position,
      });
      position += 1;
    }
    if (position === 0)
      throw new Error(`Tidak ada foto untuk tipe ${houseType}`);
  }
  const siteplanFile = "shared/Siteplan.jpg";
  const siteplanBytes = await fs.readFile(path.join(assetsRoot, siteplanFile));
  const siteplanSha = createHash("sha256").update(siteplanBytes).digest("hex");
  if (seen.has(siteplanSha))
    throw new Error("Siteplan identik dengan foto galeri");
  const siteplanSize = jpegSize(siteplanBytes);
  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    note: "Sumber privat di .tools/flamboyan-assets; jangan commit berkas asli.",
    photo_types: photoTypes,
    properties: types.map((houseType) => ({
      house_type: houseType,
      slug: propertySlug(houseType),
    })),
    siteplan: {
      key: "siteplan",
      file: siteplanFile,
      sha256: siteplanSha,
      bytes: siteplanBytes.length,
      width: siteplanSize.width,
      height: siteplanSize.height,
      kind: "MASTERPLAN",
      alt: "Site plan Bukit Flamboyan Indah 2 · dokumentasi pengguna; warna bukan status ketersediaan. [ED:siteplan]",
    },
    videos: [],
    assets,
    skipped,
  };
}

async function main() {
  const manifest = await buildManifest();
  await fs.writeFile(outputFile, `${JSON.stringify(manifest, null, 2)}\n`);
  const perType = photoTypes.map(
    (houseType) => ({
      type: houseType,
      photos: manifest.assets.filter((a) => a.house_type === houseType).length,
    }),
  );
  console.log(
    JSON.stringify(
      {
        output: path.relative(root, outputFile),
        photos_total: manifest.assets.length,
        per_type: perType,
        siteplan: {
          bytes: manifest.siteplan.bytes,
          width: manifest.siteplan.width,
          height: manifest.siteplan.height,
        },
        skipped: manifest.skipped,
      },
      null,
      2,
    ),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
