import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { setTimeout as pause } from "node:timers/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const photoCounts = new Map([
  ["36/60", 9],
  ["36/90", 8],
  ["56/90", 10],
  ["62/70", 14],
  ["69/80", 9],
]);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const isHash = (value) => /^[a-f0-9]{64}$/.test(value);

export function validateOptions(args) {
  if (args.length > 1 || args.some((a) => a !== "--apply"))
    throw Error("Supported option: --apply (default: read-only dry-run)");
  return { apply: args.includes("--apply") };
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

export function validateManifest(manifest) {
  if (
    manifest.schema_version !== 1 ||
    !Array.isArray(manifest.properties) ||
    manifest.properties.length !== photoCounts.size ||
    new Set(manifest.properties.map((p) => p.house_type)).size !==
      photoCounts.size ||
    !Array.isArray(manifest.assets) ||
    manifest.assets.length !== 55
  )
    throw Error("Expected five house types and 55 images");
  for (const p of manifest.properties) {
    if (
      !photoCounts.has(p.house_type) ||
      p.slug !== `bukit-flamboyan-indah-2-${p.house_type.replace("/", "-")}`
    )
      throw Error("Unexpected property mapping");
  }
  const keys = new Set();
  const hashes = new Set();
  const files = new Set();
  for (const a of manifest.assets) {
    if (
      !/^[a-zA-Z0-9_-]{1,80}$/.test(a.key) ||
      keys.has(a.key) ||
      !photoCounts.has(a.house_type) ||
      !["PHOTO", "FLOOR_PLAN"].includes(a.kind) ||
      !/^\.tools\/real-flamboyan-assets\/import\/[a-zA-Z0-9_/-]+\.webp$/.test(
        a.file,
      ) ||
      a.file.includes("//") ||
      files.has(a.file) ||
      !isHash(a.sha256) ||
      hashes.has(a.sha256) ||
      !Number.isInteger(a.bytes) ||
      a.bytes < 1 ||
      a.bytes > 5 * 1024 * 1024 ||
      !Number.isInteger(a.width) ||
      !Number.isInteger(a.height) ||
      a.width < 1 ||
      a.height < 1 ||
      a.width > 20000 ||
      a.height > 20000 ||
      a.width * a.height > 40000000 ||
      typeof a.alt !== "string" ||
      !a.alt.endsWith(`[BFI2:${a.key}]`) ||
      a.alt.length > 240 ||
      !Number.isInteger(a.position)
    )
      throw Error(`Invalid or duplicate source asset: ${a.key}`);
    keys.add(a.key);
    hashes.add(a.sha256);
    files.add(a.file);
  }
  for (const [houseType, count] of photoCounts) {
    const assets = manifest.assets
      .filter((a) => a.house_type === houseType)
      .sort((a, b) => a.position - b.position);
    if (
      assets.length !== count + 1 ||
      assets.some(
        (a, i) =>
          a.position !== i || a.kind !== (i < count ? "PHOTO" : "FLOOR_PLAN"),
      )
    )
      throw Error(
        `Missing photos, floor plan or contiguous order: ${houseType}`,
      );
  }
}

function webpDimensions(bytes) {
  if (
    bytes.length < 30 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WEBP" ||
    bytes.readUInt32LE(4) + 8 !== bytes.length
  )
    throw Error("Invalid WebP source");
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const kind = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (data + size > bytes.length) throw Error("Truncated WebP source");
    if (kind === "VP8X" && size >= 10)
      return {
        width: bytes.readUIntLE(data + 4, 3) + 1,
        height: bytes.readUIntLE(data + 7, 3) + 1,
      };
    if (kind === "VP8L" && size >= 5 && bytes[data] === 0x2f) {
      const bits = bytes.readUInt32LE(data + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
      };
    }
    if (
      kind === "VP8 " &&
      size >= 10 &&
      bytes.toString("hex", data + 3, data + 6) === "9d012a"
    )
      return {
        width: bytes.readUInt16LE(data + 6) & 0x3fff,
        height: bytes.readUInt16LE(data + 8) & 0x3fff,
      };
    offset = data + size + (size % 2);
  }
  throw Error("Missing WebP dimensions");
}

export function verifyBytes(asset, bytes) {
  if (bytes.length !== asset.bytes || sha256(bytes) !== asset.sha256)
    throw Error(`Source changed: ${asset.key}`);
  const dimensions = webpDimensions(bytes);
  if (dimensions.width !== asset.width || dimensions.height !== asset.height)
    throw Error(`Source dimensions changed: ${asset.key}`);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}

export function manifestFingerprint(manifest) {
  return sha256(JSON.stringify(canonical(manifest)));
}

export function propertyFingerprint(property) {
  return JSON.stringify(
    canonical(
      Object.fromEntries(
        Object.entries(property).filter(
          ([key]) => !["version", "updated_at", "owner"].includes(key),
        ),
      ),
    ),
  );
}

function checkMedia(property, asset, media, entry) {
  const width = Math.min(asset.width, 1920);
  const height = Math.max(1, Math.round((asset.height * width) / asset.width));
  if (
    entry.key !== asset.key ||
    entry.source_sha256 !== asset.sha256 ||
    entry.property_id !== property.id ||
    entry.media_id !== media.id ||
    !["PROCESSING", "READY"].includes(entry.state) ||
    media.property_id !== property.id ||
    media.kind !== asset.kind ||
    media.alt !== asset.alt ||
    media.mime !== "image/webp" ||
    media.size_bytes !== asset.bytes ||
    !["PROCESSING", "READY"].includes(media.state) ||
    (entry.state === "READY" && media.state !== "READY") ||
    media.published !== entry.published ||
    media.position !== entry.position ||
    (media.state === "READY" &&
      (media.width !== width || media.height !== height))
  )
    throw Error(
      `Journal-bound media changed: ${asset.key} (id ${entry.media_id})`,
    );
}

export function planProperty(property, media, assets, entries = []) {
  if (
    property.publication !== "PUBLISHED" ||
    property.house_type !== assets[0]?.house_type ||
    property.slug !==
      `bukit-flamboyan-indah-2-${property.house_type.replace("/", "-")}`
  )
    throw Error("Property identity/status mismatch");
  if (
    new Set(entries.map((e) => e.key)).size !== entries.length ||
    new Set(entries.map((e) => e.media_id)).size !== entries.length
  )
    throw Error("Duplicate journal receipt");
  const selected = assets.map((asset) => {
    const entry = entries.find((e) => e.key === asset.key);
    const markers = media.filter((m) => m.alt?.includes(`[BFI2:${asset.key}]`));
    if (markers.length > 1)
      throw Error(`Duplicate import marker: ${asset.key}`);
    if (!entry) {
      if (markers.length)
        throw Error(
          `Unconfirmed upload without source-hash receipt: ${asset.key}`,
        );
      return { asset, existing: null, entry: null };
    }
    const existing = media.find((m) => m.id === entry.media_id);
    if (!existing) throw Error(`Recorded media missing: ${asset.key}`);
    checkMedia(property, asset, existing, entry);
    return { asset, existing, entry };
  });
  for (const [kind, limit] of [
    ["PHOTO", 20],
    ["FLOOR_PLAN", 5],
  ]) {
    const current = media.filter(
      (m) => m.kind === kind && m.state !== "ARCHIVED",
    );
    const missing = selected.filter(
      (s) => s.asset.kind === kind && !s.existing,
    ).length;
    if (current.length + missing > limit)
      throw Error(
        `${kind} capacity exceeded for ${property.house_type}: ${current.length} active + ${missing} new > ${limit}; review existing IDs ${current.map((m) => `${m.id}:${m.state}:${m.published}`).join(",")}. No originals were archived.`,
      );
  }
  return selected;
}

export function storagePreflight(selected) {
  const reserved = selected.reduce(
    (sum, s) => sum + (s.existing ? 0 : s.asset.bytes * 4),
    0,
  );
  if (reserved > 100 * 1024 * 1024)
    throw Error(`Storage import budget exceeded: ${reserved} bytes > 100 MiB`);
  return reserved;
}

export function validateJournal(journal, manifest, origin, properties) {
  if (
    journal.schema_version !== 1 ||
    journal.origin !== origin ||
    journal.manifest_sha256 !== manifestFingerprint(manifest) ||
    !Array.isArray(journal.properties) ||
    journal.properties.length !== properties.length ||
    new Set(journal.properties.map((p) => p.property.id)).size !==
      properties.length
  )
    throw Error(
      "Import journal belongs to another manifest/origin/property set",
    );
  if (journal.pending)
    throw Error(
      `Unconfirmed API write in journal: ${journal.pending.operation}; review its response before any retry`,
    );
  for (const snapshot of journal.properties) {
    const property = properties.find((p) => p.id === snapshot.property.id);
    if (
      !property ||
      property.version !== snapshot.version ||
      propertyFingerprint(property) !== propertyFingerprint(snapshot.property)
    )
      throw Error(
        `Concurrent property change: ${snapshot.property.id}; review snapshot before rerunning`,
      );
    if (!Array.isArray(snapshot.entries) || !Array.isArray(snapshot.media))
      throw Error("Invalid import journal snapshot");
    for (const entry of snapshot.entries) {
      const asset = manifest.assets.find((a) => a.key === entry.key);
      if (
        !asset ||
        asset.house_type !== property.house_type ||
        entry.source_sha256 !== asset.sha256 ||
        entry.property_id !== property.id ||
        !Number.isInteger(entry.media_id) ||
        entry.media_id < 1 ||
        typeof entry.published !== "boolean" ||
        !Number.isInteger(entry.position) ||
        !["PROCESSING", "READY"].includes(entry.state)
      )
        throw Error("Invalid source-bound journal receipt");
    }
  }
}

export async function importAssets({
  manifest,
  origin,
  apply = false,
  call,
  readAsset,
  readVariant,
  journal,
  saveJournal,
  pause: wait = pause,
}) {
  validateOrigin(origin);
  validateManifest(manifest);
  const sources = new Map();
  for (const asset of manifest.assets) {
    const bytes = await readAsset(asset);
    verifyBytes(asset, bytes);
    sources.set(asset.key, bytes);
  }
  const catalog = [];
  for (let page = 1; page <= 100; page++) {
    const result = await call(
      `/api/v1/internal/properties?per_page=48&page=${page}`,
    );
    catalog.push(...result.data);
    if (page >= result.meta.last_page) break;
    if (page === 100) throw Error("Property pagination exceeded");
  }
  const properties = manifest.properties.map((mapping) => {
    const matches = catalog.filter((p) => p.slug === mapping.slug);
    if (matches.length !== 1)
      throw Error(`Missing or duplicate property ${mapping.slug}`);
    return matches[0];
  });
  if (journal) validateJournal(journal, manifest, origin, properties);
  const plans = [];
  for (const property of properties) {
    const endpoint = `/api/v1/internal/properties/${property.id}/media`;
    const current = await call(`${endpoint}?per_page=50`);
    if (
      current.meta.last_page > 1 ||
      current.property_version !== property.version
    )
      throw Error(
        "Media pagination or concurrent property change; stopped before writes",
      );
    if (apply && current.supports_unpublished_uploads !== true)
      throw Error(
        `API does not support unpublished uploads for property ${property.id}; deploy a compatible backend before --apply`,
      );
    const snapshot = journal?.properties.find(
      (p) => p.property.id === property.id,
    );
    const assets = manifest.assets
      .filter((a) => a.house_type === property.house_type)
      .sort((a, b) => a.position - b.position);
    plans.push({
      property,
      endpoint,
      current,
      snapshot,
      selected: planProperty(property, current.data, assets, snapshot?.entries),
    });
  }
  const selected = plans.flatMap((p) => p.selected);
  const reserved = storagePreflight(selected);
  const report = {
    origin,
    apply,
    new: selected.filter((s) => !s.existing).length,
    reused: selected.filter((s) => s.existing).length,
    storage_reserved_bytes: reserved,
    supports_unpublished_uploads: plans.every(
      (p) => p.current.supports_unpublished_uploads === true,
    ),
    properties: plans.map((p) => ({
      id: p.property.id,
      house_type: p.property.house_type,
      new: p.selected.filter((s) => !s.existing).length,
      reused: p.selected.filter((s) => s.existing).length,
      supports_unpublished_uploads:
        p.current.supports_unpublished_uploads === true,
    })),
  };
  // A marker cannot prove original bytes after server re-encoding. Receipts bind the source hash and processed variant hash to its exact API ID.
  const verifiedVariants = new Set();
  for (const s of selected.filter((s) => s.entry?.processed_sha256)) {
    if (
      !isHash(s.entry.processed_sha256) ||
      sha256(await readVariant(s.entry.media_id)) !== s.entry.processed_sha256
    )
      throw Error(`Processed media bytes changed: ${s.asset.key}`);
    verifiedVariants.add(s.entry.media_id);
  }
  if (!apply) return report;
  if (!journal) {
    journal = {
      schema_version: 1,
      origin,
      manifest_sha256: manifestFingerprint(manifest),
      started_at: new Date().toISOString(),
      pending: null,
      properties: plans.map((p) => ({
        property: p.property,
        version: p.property.version,
        media: p.current.data,
        entries: [],
      })),
    };
    await saveJournal(journal);
    for (const plan of plans)
      plan.snapshot = journal.properties.find(
        (p) => p.property.id === plan.property.id,
      );
  }
  async function write(plan, operation, url, options, asset) {
    const snapshot = plan.snapshot;
    journal.pending = {
      operation,
      property_id: plan.property.id,
      expected_version: snapshot.version,
      key: asset?.key,
      source_sha256: asset?.sha256,
      url,
      fields: options.data ?? {
        kind: asset.kind,
        alt: asset.alt,
        published: false,
      },
      baseline_media_ids: plan.current.data.map((m) => m.id),
    };
    await saveJournal(journal);
    const result = await call(url, options);
    if (result.property_version !== snapshot.version + 1)
      throw Error(
        "Unexpected property version after write; inspect pending journal",
      );
    snapshot.version = result.property_version;
    return result.data;
  }
  async function confirm() {
    journal.pending = null;
    await saveJournal(journal);
  }
  for (const plan of plans) {
    for (const s of plan.selected) {
      if (s.existing) continue;
      const media = await write(
        plan,
        "upload",
        plan.endpoint,
        {
          method: "POST",
          multipart: {
            version: String(plan.snapshot.version),
            kind: s.asset.kind,
            alt: s.asset.alt,
            published: "0",
            file: {
              name: `flamboyan-${s.asset.key}.webp`,
              mimeType: "image/webp",
              buffer: sources.get(s.asset.key),
            },
          },
        },
        s.asset,
      );
      const entry = {
        key: s.asset.key,
        source_sha256: s.asset.sha256,
        property_id: plan.property.id,
        media_id: media.id,
        published: false,
        position: media.position,
        state: media.state,
      };
      checkMedia(plan.property, s.asset, media, entry);
      s.existing = media;
      s.entry = entry;
      plan.snapshot.entries.push(entry);
      await confirm();
    }
  }
  for (const plan of plans) {
    let current;
    for (let attempt = 0; attempt < 40; attempt++) {
      current = await call(`${plan.endpoint}?per_page=50`);
      if (current.property_version !== plan.snapshot.version)
        throw Error("Concurrent property change while waiting for media");
      for (const s of plan.selected) {
        const media = current.data.find((m) => m.id === s.entry.media_id);
        if (!media) throw Error(`Uploaded media missing: ${s.asset.key}`);
        checkMedia(plan.property, s.asset, media, s.entry);
        s.existing = media;
      }
      if (plan.selected.every((s) => s.existing.state === "READY")) break;
      if (attempt === 39)
        throw Error("Media processing incomplete; rerun after queue review");
      if (current.process_in_request)
        await call(`${plan.endpoint}/process`, { method: "POST" });
      await wait(1500);
    }
    for (const s of plan.selected) {
      if (!verifiedVariants.has(s.entry.media_id))
        s.entry.processed_sha256 = sha256(await readVariant(s.entry.media_id));
      s.entry.state = "READY";
    }
    await saveJournal(journal);
  }
  // Keep every old published gallery intact until all five replacement galleries are READY.
  for (const plan of plans) {
    const fresh = (
      await call(`/api/v1/internal/properties/${plan.property.id}`)
    ).data;
    if (
      fresh.version !== plan.snapshot.version ||
      propertyFingerprint(fresh) !== propertyFingerprint(plan.snapshot.property)
    )
      throw Error(
        "Property metadata changed before publication; inspect journal",
      );
  }
  for (const plan of plans) {
    for (const s of plan.selected) {
      const changes = {};
      if (!s.entry.published) changes.published = true;
      if (s.entry.position !== s.asset.position)
        changes.position = s.asset.position;
      if (!Object.keys(changes).length) continue;
      const media = await write(
        plan,
        "publish/order",
        `${plan.endpoint}/${s.entry.media_id}`,
        {
          method: "PATCH",
          data: { version: plan.snapshot.version, ...changes },
        },
        s.asset,
      );
      const next = { ...s.entry, published: true, position: s.asset.position };
      checkMedia(plan.property, s.asset, media, next);
      Object.assign(s.entry, next);
      await confirm();
    }
    const selectedIds = new Set(plan.selected.map((s) => s.entry.media_id));
    const current = await call(`${plan.endpoint}?per_page=50`);
    if (current.property_version !== plan.snapshot.version)
      throw Error("Concurrent property change before hiding superseded media");
    for (const before of plan.snapshot.media.filter(
      (m) =>
        ["PHOTO", "FLOOR_PLAN"].includes(m.kind) &&
        m.published &&
        !selectedIds.has(m.id),
    )) {
      const media = current.data.find((m) => m.id === before.id);
      if (
        !media ||
        media.property_id !== plan.property.id ||
        media.kind !== before.kind ||
        media.alt !== before.alt ||
        media.state !== before.state ||
        media.position !== before.position
      )
        throw Error(
          `Superseded media changed: ${before.id}; stopped before hiding it`,
        );
      if (!media.published) continue;
      await write(
        plan,
        "unpublish superseded",
        `${plan.endpoint}/${media.id}`,
        {
          method: "PATCH",
          data: { version: plan.snapshot.version, published: false },
        },
      );
      await confirm();
    }
    const after = (
      await call(`/api/v1/internal/properties/${plan.property.id}`)
    ).data;
    if (
      after.version !== plan.snapshot.version ||
      propertyFingerprint(after) !== propertyFingerprint(plan.snapshot.property)
    )
      throw Error("Property metadata changed during import; inspect journal");
  }
  journal.completed_at = new Date().toISOString();
  await saveJournal(journal);
  return { ...report, completed: true };
}

async function main() {
  const { apply } = validateOptions(process.argv.slice(2));
  const origin = validateOrigin(process.env.FLAMBOYAN_ORIGIN);
  if (
    !process.env.FLAMBOYAN_ADMIN_EMAIL ||
    !process.env.FLAMBOYAN_ADMIN_PASSWORD
  )
    throw Error("Set FLAMBOYAN_ADMIN_EMAIL and FLAMBOYAN_ADMIN_PASSWORD");
  const manifest = JSON.parse(
    await fs.readFile(
      path.join(root, "scripts/flamboyan-house-assets.json"),
      "utf8",
    ),
  );
  validateManifest(manifest);
  const folder = path.join(
    root,
    ".tools/real-flamboyan-assets/import-state",
    new URL(origin).host.replace(":", "-"),
  );
  const journalFile = path.join(folder, "journal.json");
  let journal;
  try {
    journal = JSON.parse(await fs.readFile(journalFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  let lock;
  const { request } =
    await import("../apps/web/node_modules/@playwright/test/index.mjs");
  const api = await request.newContext({
    baseURL: origin,
    extraHTTPHeaders: {
      Accept: "application/json",
      Origin: origin,
      Referer: origin,
    },
    timeout: 60000,
  });
  try {
    if (apply) {
      await fs.mkdir(folder, { recursive: true });
      lock = await fs.open(path.join(folder, "import.lock"), "wx");
    }
    const csrf = await api.get("/sanctum/csrf-cookie", { maxRedirects: 0 });
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
        email: process.env.FLAMBOYAN_ADMIN_EMAIL,
        password: process.env.FLAMBOYAN_ADMIN_PASSWORD,
      },
    });
    if (login.data.role !== "ADMIN")
      throw Error("An active admin session is required");
    const sourceFolder = await fs.realpath(
      path.join(root, ".tools/real-flamboyan-assets/import"),
    );
    const report = await importAssets({
      manifest,
      origin,
      apply,
      journal,
      call,
      async readAsset(asset) {
        const file = await fs.realpath(path.join(root, asset.file));
        const relative = path.relative(sourceFolder, file);
        if (!relative || relative.startsWith("..") || path.isAbsolute(relative))
          throw Error(`Source escapes import folder: ${asset.key}`);
        return fs.readFile(file);
      },
      async readVariant(id) {
        await pause(650);
        const response = await api.get(`/api/v1/internal/media/${id}/1920`, {
          maxRedirects: 0,
        });
        if (
          !response.ok() ||
          !response.headers()["content-type"]?.startsWith("image/webp")
        )
          throw Error(`Processed variant unavailable: ${id}`);
        return response.body();
      },
      async saveJournal(value) {
        const temporary = `${journalFile}.tmp`;
        await fs.writeFile(temporary, JSON.stringify(value, null, 2), {
          mode: 0o600,
        });
        await fs.rename(temporary, journalFile);
      },
    });
    console.log(JSON.stringify(report, null, 2));
    if (apply)
      console.log(
        `Import journal and original gallery snapshot: ${journalFile}. Originals remain stored; no deletion or archival was performed.`,
      );
  } finally {
    await api.dispose();
    if (lock) {
      await lock.close();
      await fs.unlink(path.join(folder, "import.lock"));
    }
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
