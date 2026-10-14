// Explicit, resumable content import for the operator asset set. Default is a read-only plan; see docs/flamboyan-assets.md.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { setTimeout as pause } from "node:timers/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsRoot = path.join(root, ".tools/flamboyan-assets");
const manifestFile = path.join(root, "scripts/flamboyan-house-assets.json");

const types = [
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
export const descriptionOld =
  "Gambar merupakan ilustrasi desain developer, bukan foto kondisi unit.";
export const descriptionNew =
  "Gambar mencakup dokumentasi lapangan dan ilustrasi desain developer; kondisi unit dikonfirmasi sebelum transaksi.";

export function markerFor(key) {
  return `[ED:${key}]`;
}

export function validateOrigin(value) {
  if (
    !["http://127.0.0.1:3000", "https://flamboyan-web.vercel.app"].includes(
      value,
    )
  )
    throw Error("Unsupported import origin");
  return value;
}

export function verifyBytes(asset, bytes) {
  if (
    bytes.length !== asset.bytes ||
    bytes.length > maxBytes ||
    createHash("sha256").update(bytes).digest("hex") !== asset.sha256
  )
    throw Error(`Source changed: ${asset.key}`);
}

export function youtubeId(value) {
  const match =
    /^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})(?:&\S*)?$/.exec(
      value,
    );
  if (!match) throw Error(`Invalid YouTube URL: ${value}`);
  return match[1];
}

export function validateManifest(manifest) {
  if (
    manifest.schema_version !== 1 ||
    manifest.properties.length !== 9 ||
    new Set(manifest.properties.map((p) => p.house_type)).size !== 9
  )
    throw Error("Expected nine unique house types");
  for (const p of manifest.properties) {
    if (
      !types.includes(p.house_type) ||
      p.slug !== `bukit-flamboyan-indah-2-${p.house_type.replace("/", "-")}`
    )
      throw Error("Unexpected property mapping");
  }
  if (!Array.isArray(manifest.assets) || !manifest.assets.length)
    throw Error("Missing gallery assets");
  const keys = new Set();
  const hashes = new Set();
  for (const asset of manifest.assets) {
    if (
      !photoTypes.includes(asset.house_type) ||
      asset.kind !== "PHOTO" ||
      typeof asset.file !== "string" ||
      asset.file.includes("..") ||
      !/^[a-f0-9]{64}$/.test(asset.sha256) ||
      !Number.isInteger(asset.bytes) ||
      asset.bytes <= 0 ||
      asset.bytes > maxBytes ||
      !Number.isInteger(asset.width) ||
      !Number.isInteger(asset.height) ||
      keys.has(asset.key) ||
      hashes.has(asset.sha256) ||
      !asset.alt?.endsWith(markerFor(asset.key)) ||
      asset.alt.length > 240 ||
      /ilustrasi|inspirasi/i.test(asset.alt) === !/^gemini/i.test(asset.key)
    )
      throw Error("Invalid gallery asset");
    keys.add(asset.key);
    hashes.add(asset.sha256);
  }
  for (const type of photoTypes) {
    const assets = manifest.assets
      .filter((a) => a.house_type === type)
      .sort((a, b) => a.position - b.position);
    if (!assets.length || assets.some((a, i) => a.position !== i))
      throw Error("Missing cover or invalid gallery order");
    if (
      assets.some((a) => /^gemini/i.test(a.key)) &&
      !assets.some((a) => !/^gemini/i.test(a.key))
    )
      throw Error("Generated assets must not lead a gallery");
  }
  const siteplan = manifest.siteplan;
  if (
    !siteplan ||
    siteplan.kind !== "MASTERPLAN" ||
    typeof siteplan.file !== "string" ||
    siteplan.file.includes("..") ||
    !/^[a-f0-9]{64}$/.test(siteplan.sha256) ||
    !Number.isInteger(siteplan.bytes) ||
    siteplan.bytes <= 0 ||
    siteplan.bytes > maxBytes ||
    !siteplan.alt?.endsWith(markerFor("siteplan")) ||
    !Number.isInteger(siteplan.width) ||
    !Number.isInteger(siteplan.height)
  )
    throw Error("Invalid siteplan definition");
  if (!Array.isArray(manifest.videos)) throw Error("Invalid videos list");
  for (const video of manifest.videos) {
    if (
      !types.includes(video.house_type) ||
      !video.alt?.endsWith(markerFor(`video-${video.house_type.replace("/", "-")}`)) ||
      video.alt.length > 240
    )
      throw Error("Invalid video definition");
    youtubeId(video.url);
  }
}

export function findByMarker(media, key) {
  const marker = markerFor(key);
  const matches = media.filter((m) => m.alt?.includes(marker));
  if (matches.length > 1) throw Error(`Duplicate import marker: ${key}`);
  return matches[0];
}

export function planPropertyPhotos(property, media, assets) {
  if (
    property.publication !== "PUBLISHED" ||
    property.slug !==
      `bukit-flamboyan-indah-2-${property.house_type.replace("/", "-")}`
  )
    throw Error("Property identity/status mismatch");
  const selected = assets.map((asset) => {
    const existing = findByMarker(media, asset.key);
    if (
      existing &&
      (existing.alt !== asset.alt ||
        existing.kind !== "PHOTO" ||
        !existing.published ||
        existing.state !== "READY" ||
        existing.width !== asset.width ||
        existing.height !== asset.height)
    )
      throw Error(`Imported media changed or not ready: ${asset.key}`);
    return { asset, existing };
  });
  const capacity =
    media.filter((m) => m.kind === "PHOTO").length +
    selected.filter((s) => !s.existing).length;
  if (capacity > 20) throw Error("Photo capacity exceeded");
  return selected;
}

export function planSiteplan(media, siteplan) {
  const existing = findByMarker(media, "siteplan");
  if (
    existing &&
    (existing.alt !== siteplan.alt ||
      existing.kind !== "MASTERPLAN" ||
      !existing.published ||
      existing.state !== "READY" ||
      existing.width !== siteplan.width ||
      existing.height !== siteplan.height)
  )
    throw Error("Imported siteplan changed or not ready");
  const archive = media.filter(
    (m) => m.kind === "MASTERPLAN" && m.id !== existing?.id,
  );
  return { existing, archive };
}

export function nextDescription(description) {
  if (description.includes(descriptionNew)) return { state: "done" };
  if (!description.includes(descriptionOld))
    throw Error("Description sentence not found; review before importing");
  return {
    state: "update",
    value: description.replace(descriptionOld, descriptionNew),
  };
}

export function propertyFingerprint(property) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(property)
        .filter(
          ([key]) =>
            !["version", "updated_at", "owner", "description"].includes(key),
        )
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
}

async function loadAssetBytes(file) {
  return fs.readFile(path.join(assetsRoot, file));
}

async function main() {
  if (process.argv.slice(2).some((a) => a !== "--apply"))
    throw Error("Supported option: --apply");
  const apply = process.argv.includes("--apply");
  const origin = validateOrigin(process.env.FLAMBOYAN_IMPORT_ORIGIN);
  if (
    !process.env.FLAMBOYAN_IMPORT_ADMIN_EMAIL ||
    !process.env.FLAMBOYAN_IMPORT_ADMIN_PASSWORD
  )
    throw Error(
      "Set FLAMBOYAN_IMPORT_ADMIN_EMAIL and FLAMBOYAN_IMPORT_ADMIN_PASSWORD",
    );
  const manifest = JSON.parse(await fs.readFile(manifestFile, "utf8"));
  validateManifest(manifest);
  const photoBytes = new Map();
  for (const asset of manifest.assets) {
    const bytes = await loadAssetBytes(asset.file);
    verifyBytes(asset, bytes);
    photoBytes.set(asset.key, bytes);
  }
  const siteplanBytes = await loadAssetBytes(manifest.siteplan.file);
  verifyBytes({ ...manifest.siteplan, key: "siteplan" }, siteplanBytes);
  const folder = path.join(
    root,
    ".tools/flamboyan-import",
    new URL(origin).hostname,
  );
  await fs.mkdir(folder, { recursive: true });
  const { request } =
    await import("../apps/web/node_modules/@playwright/test/index.mjs");
  const api = await request.newContext({
    baseURL: origin,
    extraHTTPHeaders: {
      Accept: "application/json",
      Origin: origin,
      Referer: origin,
    },
    timeout: 90000,
  });
  try {
    const csrf = await api.get("/sanctum/csrf-cookie");
    if (!csrf.ok()) throw Error("CSRF initialization failed");
    async function call(url, options = {}) {
      await pause(650);
      const cookies = (await api.storageState()).cookies;
      const xsrf = decodeURIComponent(
        cookies.find((c) => c.name === "XSRF-TOKEN")?.value ?? "",
      );
      const response = await api.fetch(url, {
        ...options,
        maxRedirects: 0,
        headers: { "X-XSRF-TOKEN": xsrf },
      });
      if (!response.ok())
        throw Error(
          `${options.method ?? "GET"} ${url}: HTTP ${response.status()}; stopped without retrying writes`,
        );
      return response.status() === 204 ? null : response.json();
    }
    const login = await call("/auth/login", {
      method: "POST",
      data: {
        email: process.env.FLAMBOYAN_IMPORT_ADMIN_EMAIL,
        password: process.env.FLAMBOYAN_IMPORT_ADMIN_PASSWORD,
      },
    });
    if (login.data.role !== "ADMIN")
      throw Error("An active admin session is required");
    const properties = [];
    for (let page = 1; page <= 100; page++) {
      const result = await call(
        `/api/v1/internal/properties?per_page=48&page=${page}`,
      );
      properties.push(...result.data);
      if (page >= result.meta.last_page) break;
      if (page === 100) throw Error("Property pagination exceeded");
    }
    const plans = [];
    for (const mapping of manifest.properties) {
      const matches = properties.filter((p) => p.slug === mapping.slug);
      if (matches.length !== 1)
        throw Error(`Missing or duplicate property ${mapping.slug}`);
      const property = matches[0];
      const endpoint = `/api/v1/internal/properties/${property.id}/media`;
      const current = await call(`${endpoint}?per_page=50`);
      if (current.meta.last_page > 1)
        throw Error("Unexpected media pagination");
      const assets = manifest.assets
        .filter((a) => a.house_type === property.house_type)
        .sort((a, b) => a.position - b.position);
      const photos = assets.length
        ? planPropertyPhotos(property, current.data, assets)
        : [];
      const siteplan = planSiteplan(current.data, manifest.siteplan);
      const description = photoTypes.includes(property.house_type)
        ? nextDescription(property.description)
        : { state: "done" };
      plans.push({
        property,
        endpoint,
        current,
        assets,
        photos,
        siteplan,
        description,
        videos: manifest.videos.filter(
          (v) => v.house_type === property.house_type,
        ),
      });
    }
    const report = {
      origin,
      apply,
      started_at: new Date().toISOString(),
      properties: plans.map((p) => ({
        id: p.property.id,
        type: p.property.house_type,
        photos_new: p.photos.filter((s) => !s.existing).length,
        photos_reused: p.photos.filter((s) => s.existing).length,
        masterplan_archive: p.siteplan.archive.length,
        masterplan: p.siteplan.existing ? "reused" : "new",
        description: p.description.state,
      })),
    };
    console.log(JSON.stringify(report, null, 2));
    if (!apply) return;
    const snapshot = path.join(folder, `before-${Date.now()}.json`);
    await fs.writeFile(
      snapshot,
      JSON.stringify(
        {
          origin,
          properties: plans.map((p) => ({
            property: p.property,
            media: p.current.data,
          })),
        },
        null,
        2,
      ),
      { flag: "wx" },
    );
    for (const plan of plans) {
      let version = plan.current.property_version;
      const selectedIds = [];
      const newPhotoIds = [];
      for (const { asset, existing } of plan.photos) {
        let media = existing;
        if (!media) {
          const result = await call(plan.endpoint, {
            method: "POST",
            multipart: {
              version: String(version),
              kind: "PHOTO",
              alt: asset.alt,
              file: {
                name: `flamboyan-${asset.key}.jpg`,
                mimeType: "image/jpeg",
                buffer: photoBytes.get(asset.key),
              },
            },
          });
          version = result.property_version;
          media = result.data;
          newPhotoIds.push(media.id);
        }
        selectedIds.push(media.id);
      }
      if (newPhotoIds.length) {
        for (let attempt = 0; attempt < 40; attempt++) {
          const listing = await call(`${plan.endpoint}?per_page=50`);
          if (listing.property_version !== version)
            throw Error("Concurrent property change; review before rerunning");
          const pending = newPhotoIds.map((id) =>
            listing.data.find((m) => m.id === id),
          );
          if (pending.every((m) => m && m.state === "READY")) break;
          if (pending.some((m) => m?.state === "FAILED") || attempt === 39)
            throw Error(
              "Media processing incomplete; review queue before rerunning",
            );
          if (listing.process_in_request)
            await call(`${plan.endpoint}/process`, { method: "POST" });
          await pause(1500);
        }
      }
      if (selectedIds.length) {
        const listing = await call(`${plan.endpoint}?per_page=50`);
        if (listing.property_version !== version)
          throw Error("Concurrent property change; review before rerunning");
        for (const [position, id] of selectedIds.entries()) {
          const media = listing.data.find((m) => m.id === id);
          const asset = plan.photos[position].asset;
          if (
            !media ||
            media.state !== "READY" ||
            media.width !== asset.width ||
            media.height !== asset.height ||
            !media.published
          )
            throw Error("Processed media dimensions/publication mismatch");
          if (media.position !== position) {
            const result = await call(`${plan.endpoint}/${id}`, {
              method: "PATCH",
              data: { version, position },
            });
            version = result.property_version;
          }
        }
      }
      if (!plan.siteplan.existing) {
        let masterplan = null;
        for (const media of plan.siteplan.archive) {
          const result = await call(`${plan.endpoint}/${media.id}`, {
            method: "PATCH",
            data: { version, archived: true },
          });
          version = result.property_version;
        }
        const uploaded = await call(plan.endpoint, {
          method: "POST",
          multipart: {
            version: String(version),
            kind: "MASTERPLAN",
            alt: manifest.siteplan.alt,
            file: {
              name: "flamboyan-siteplan.jpg",
              mimeType: "image/jpeg",
              buffer: siteplanBytes,
            },
          },
        });
        version = uploaded.property_version;
        masterplan = uploaded.data;
        let readyMasterplan;
        for (let attempt = 0; attempt < 40; attempt++) {
          const listing = await call(`${plan.endpoint}?per_page=50`);
          if (listing.property_version !== version)
            throw Error("Concurrent property change; review before rerunning");
          readyMasterplan = listing.data.find((m) => m.id === masterplan.id);
          if (readyMasterplan?.state === "READY") break;
          if (readyMasterplan?.state === "FAILED" || attempt === 39)
            throw Error(
              "Siteplan processing incomplete; review queue before rerunning",
            );
          if (listing.process_in_request)
            await call(`${plan.endpoint}/process`, { method: "POST" });
          await pause(1500);
        }
        if (
          readyMasterplan.width !== manifest.siteplan.width ||
          readyMasterplan.height !== manifest.siteplan.height ||
          !readyMasterplan.published
        )
          throw Error("Processed siteplan dimensions/publication mismatch");
        if (readyMasterplan.position !== 1) {
          const result = await call(`${plan.endpoint}/${masterplan.id}`, {
            method: "PATCH",
            data: { version, position: 1 },
          });
          version = result.property_version;
        }
      }
      for (const video of plan.videos) {
        const key = `video-${video.house_type.replace("/", "-")}`;
        if (findByMarker(plan.current.data, key)) continue;
        const result = await call(plan.endpoint, {
          method: "POST",
          multipart: {
            version: String(version),
            kind: "VIDEO",
            alt: video.alt,
            url: video.url,
          },
        });
        version = result.property_version;
      }
      const currentAfterMedia = await call(`${plan.endpoint}?per_page=50`);
      if (currentAfterMedia.property_version !== version)
        throw Error("Concurrent property change; review before rerunning");
      const oldPhotos = currentAfterMedia.data
        .filter((m) => m.kind === "PHOTO" && !selectedIds.includes(m.id))
        .sort((a, b) => a.position - b.position || a.id - b.id);
      for (const [index, media] of oldPhotos.entries()) {
        const position = 100 + index;
        if (media.position === position) continue;
        const result = await call(`${plan.endpoint}/${media.id}`, {
          method: "PATCH",
          data: { version, position },
        });
        version = result.property_version;
      }
      let expectedDescription = plan.property.description;
      if (plan.description.state === "update") {
        const result = await call(
          `/api/v1/internal/properties/${plan.property.id}`,
          {
            method: "PATCH",
            data: { version, description: plan.description.value },
          },
        );
        version = result.data.version;
        expectedDescription = plan.description.value;
      }
      const after = (
        await call(`/api/v1/internal/properties/${plan.property.id}`)
      ).data;
      if (after.version !== version)
        throw Error("Unexpected property version after writes");
      if (after.description !== expectedDescription)
        throw Error("Property description mismatch after import");
      if (propertyFingerprint(after) !== propertyFingerprint(plan.property))
        throw Error(
          "Property metadata changed during import; inspect snapshot",
        );
      console.log(
        `Tipe ${plan.property.house_type}: ${
          selectedIds.length ? `${selectedIds.length} foto READY` : "foto tetap"
        }; masterplan ${plan.siteplan.existing ? "reused" : "baru"}; deskripsi ${plan.description.state}.`,
      );
    }
    await fs.writeFile(
      path.join(folder, `result-${Date.now()}.json`),
      JSON.stringify(
        { ...report, completed_at: new Date().toISOString(), snapshot },
        null,
        2,
      ),
    );
    console.log(
      "Import complete. Source files and rollback snapshots are stored privately in .tools/flamboyan-assets and .tools/flamboyan-import.",
    );
  } finally {
    await api.dispose();
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
