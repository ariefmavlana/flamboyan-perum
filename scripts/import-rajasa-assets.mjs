// Explicit, resumable content import. Default is a read-only plan; see docs/rajasa-assets.md.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { setTimeout as pause } from "node:timers/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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
    bytes.length > 5 * 1024 * 1024 ||
    createHash("sha256").update(bytes).digest("hex") !== asset.sha256
  )
    throw Error(`Source changed: ${asset.key}`);
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
  const keys = new Set();
  const importedHashes = new Set();
  for (const a of manifest.assets) {
    if (
      !/^https:\/\/rumahrajasa\.com\/(foto_iklan|foto_produkk|foto_berita)\/[a-zA-Z0-9_-]+\.webp$/.test(
        a.url,
      ) ||
      !/^\d+$/.test(a.key) ||
      keys.has(a.key) ||
      !/^[a-f0-9]{64}$/.test(a.sha256) ||
      !Number.isInteger(a.bytes) ||
      a.bytes <= 0 ||
      a.bytes > 5 * 1024 * 1024
    )
      throw Error("Invalid source asset");
    keys.add(a.key);
    if (!["import", "reference_only"].includes(a.action))
      throw Error("Unknown asset action");
    if (a.action === "import") {
      if (
        !types.includes(a.house_type) ||
        !a.alt?.endsWith(`[RR:${a.key}]`) ||
        a.alt.length > 240 ||
        importedHashes.has(a.sha256)
      )
        throw Error("Invalid or duplicate gallery asset");
      importedHashes.add(a.sha256);
    }
  }
  for (const type of types) {
    const assets = manifest.assets
      .filter((a) => a.action === "import" && a.house_type === type)
      .sort((a, b) => a.position - b.position);
    if (!assets.length || assets.some((a, i) => a.position !== i))
      throw Error("Missing cover or invalid gallery order");
  }
}
export function propertyFingerprint(property) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(property)
        .filter(([key]) => !["version", "updated_at", "owner"].includes(key))
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
}
export function planProperty(property, media, assets) {
  if (
    property.publication !== "PUBLISHED" ||
    property.house_type !== assets[0].house_type ||
    property.slug !==
      `bukit-flamboyan-indah-2-${property.house_type.replace("/", "-")}`
  )
    throw Error("Property identity/status mismatch");
  const selected = assets.map((asset) => {
    const matches = media.filter((m) => m.alt?.includes(`[RR:${asset.key}]`));
    if (matches.length > 1) throw Error("Duplicate import marker");
    const existing = matches[0];
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
  if (
    media.filter((m) => m.kind === "PHOTO").length +
      selected.filter((s) => !s.existing).length >
    20
  )
    throw Error("Photo capacity exceeded");
  return selected;
}

async function main() {
  if (process.argv.slice(2).some((a) => a !== "--apply"))
    throw Error("Supported option: --apply");
  const apply = process.argv.includes("--apply");
  const origin = validateOrigin(process.env.RAJASA_ORIGIN);
  if (!process.env.RAJASA_ADMIN_EMAIL || !process.env.RAJASA_ADMIN_PASSWORD)
    throw Error("Set RAJASA_ADMIN_EMAIL and RAJASA_ADMIN_PASSWORD");
  const manifest = JSON.parse(
    await fs.readFile(
      path.join(root, "scripts/rajasa-house-assets.json"),
      "utf8",
    ),
  );
  validateManifest(manifest);
  const folder = path.join(
    root,
    ".tools/rajasa-import",
    new URL(origin).hostname,
  );
  const cache = path.join(root, ".tools/rajasa-import/originals");
  await fs.mkdir(cache, { recursive: true });
  await fs.mkdir(folder, { recursive: true });
  // Cache every inventoried original, including duplicates/reference-only posters, without publishing them.
  for (const asset of manifest.assets) {
    const file = path.join(cache, `${asset.key}.webp`);
    let bytes;
    try {
      bytes = await fs.readFile(file);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      const response = await fetch(asset.url, {
        redirect: "error",
        signal: AbortSignal.timeout(30000),
      });
      if (
        !response.ok ||
        !response.headers.get("content-type")?.startsWith("image/")
      )
        throw Error(`Download failed: ${asset.key}`);
      const chunks = [];
      let size = 0;
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > 5 * 1024 * 1024) throw Error("Source exceeds limit");
        chunks.push(chunk);
      }
      bytes = Buffer.concat(chunks);
      verifyBytes(asset, bytes);
      await fs.writeFile(file, bytes, { flag: "wx" });
    }
    verifyBytes(asset, bytes);
  }
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
        email: process.env.RAJASA_ADMIN_EMAIL,
        password: process.env.RAJASA_ADMIN_PASSWORD,
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
        .filter(
          (a) => a.action === "import" && a.house_type === mapping.house_type,
        )
        .sort((a, b) => a.position - b.position);
      plans.push({
        property,
        endpoint,
        current,
        selected: planProperty(property, current.data, assets),
      });
    }
    const report = {
      origin,
      apply,
      started_at: new Date().toISOString(),
      properties: plans.map((p) => ({
        id: p.property.id,
        type: p.property.house_type,
        new: p.selected.filter((s) => !s.existing).length,
        reused: p.selected.filter((s) => s.existing).length,
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
      // Use the preflight version chain; concurrent edits cause HTTP 409, never automatic overwrite.
      const selectedIds = [];
      for (const { asset, existing } of plan.selected) {
        let media = existing;
        if (!media) {
          const result = await call(plan.endpoint, {
            method: "POST",
            multipart: {
              version: String(version),
              kind: "PHOTO",
              alt: asset.alt,
              file: {
                name: `rajasa-${asset.key}.webp`,
                mimeType: "image/webp",
                buffer: await fs.readFile(
                  path.join(cache, `${asset.key}.webp`),
                ),
              },
            },
          });
          version = result.property_version;
          media = result.data;
        }
        selectedIds.push(media.id);
      }
      // Queue workers can finish asynchronously. Existing cover stays until every selected image is ready.
      let ready;
      for (let attempt = 0; attempt < 20; attempt++) {
        ready = await call(`${plan.endpoint}?per_page=50`);
        if (ready.property_version !== version)
          throw Error("Concurrent property change; review before rerunning");
        if (
          selectedIds.every((id) =>
            ready.data.some((m) => m.id === id && m.state === "READY"),
          )
        )
          break;
        if (
          ready.data.some(
            (m) => selectedIds.includes(m.id) && m.state === "FAILED",
          ) ||
          attempt === 19
        )
          throw Error(
            "Media processing incomplete; review queue before rerunning",
          );
        if (ready.process_in_request)
          await call(`${plan.endpoint}/process`, { method: "POST" });
        await pause(1500);
      }
      for (const [position, id] of selectedIds.entries()) {
        const media = ready.data.find((m) => m.id === id);
        const asset = plan.selected[position].asset;
        if (
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
      const oldPhotos = plan.current.data
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
      const after = (
        await call(`/api/v1/internal/properties/${plan.property.id}`)
      ).data;
      if (propertyFingerprint(after) !== propertyFingerprint(plan.property))
        throw Error(
          "Property metadata changed during import; inspect snapshot",
        );
      console.log(
        `Tipe ${plan.property.house_type}: ${selectedIds.length} gambar READY; metadata properti tetap.`,
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
      "Import complete. Original files and rollback snapshots are stored privately in .tools/rajasa-import.",
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
