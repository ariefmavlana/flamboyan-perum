// Opt-in curation for the dedicated local SQLite demo. Never imported by the app.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as pause } from "node:timers/promises";
import { request } from "../apps/web/node_modules/@playwright/test/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = await fs.readFile(path.join(root, "apps/api/.env"), "utf8");
const env = (key) =>
  envText
    .match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]
    .trim()
    .replace(/^"|"$/g, "");
if (process.env.CURATE_DEMO_PHOTOS !== "1" || !process.env.DEMO_PASSWORD)
  throw Error("Set CURATE_DEMO_PHOTOS=1 and DEMO_PASSWORD explicitly.");
if (
  !["local", "testing"].includes(env("APP_ENV")) ||
  env("DB_CONNECTION") !== "sqlite" ||
  path.resolve(env("DB_DATABASE") ?? "") !==
    path.join(root, ".tools/dynamic-demo.sqlite")
)
  throw Error(
    "Only the dedicated local .tools/dynamic-demo.sqlite fixture is supported.",
  );
const manifest = JSON.parse(
  await fs.readFile(path.join(root, "scripts/demo-photos.json"), "utf8"),
);
const folder = path.join(root, ".tools/curated-photos");
await fs.mkdir(folder, { recursive: true });
for (const photo of manifest.photos) {
  photo.file = path.join(folder, `${photo.key}.webp`);
  try {
    await fs.access(photo.file);
  } catch {
    const url = new URL(photo.cdn);
    if (url.origin !== "https://images.unsplash.com")
      throw Error("Unexpected photo host");
    url.search = "auto=format&fit=crop&fm=webp&q=82&w=1920";
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.startsWith("image/")
    )
      throw Error(`Photo download failed: ${photo.key}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 5 * 1024 * 1024)
      throw Error("Photo exceeds upload limit");
    await fs.writeFile(photo.file, bytes);
  }
  photo.alt = `Ilustrasi demo · ${photo.description}. Foto: ${photo.author} / Unsplash [${photo.source.split("/").at(-1)}]. Bukan foto unit dijual.`;
}
const origin = "http://127.0.0.1:3000";
const api = await request.newContext({
  baseURL: origin,
  extraHTTPHeaders: {
    Accept: "application/json",
    Origin: origin,
    Referer: origin,
  },
});
try {
  await api.get("/sanctum/csrf-cookie");
  async function call(url, options = {}) {
    await pause(700); // Stay below the internal API's 120 requests/minute limit.
    const state = await api.storageState();
    const xsrf = decodeURIComponent(
      state.cookies.find((c) => c.name === "XSRF-TOKEN")?.value ?? "",
    );
    const response = await api.fetch(url, {
      headers: { "X-XSRF-TOKEN": xsrf },
      ...options,
    });
    if (!response.ok())
      throw Error(
        `${options.method ?? "GET"} ${url}: HTTP ${response.status()}`,
      );
    return response.json();
  }
  await call("/auth/login", {
    method: "POST",
    data: { email: "admin@example.test", password: process.env.DEMO_PASSWORD },
  });
  const properties = [];
  let page = 1;
  do {
    const result = await call(
      `/api/v1/internal/properties?per_page=48&page=${page}`,
    );
    properties.push(
      ...result.data.filter(
        (p) =>
          /^demo-[a-z0-9]{16}$/.test(p.slug) &&
          p.title.startsWith("Rumah Demo ") &&
          p.description.startsWith("DATA DEMO"),
      ),
    );
    if (page >= result.meta.last_page) break;
    page++;
  } while (page <= 20);
  if (!properties.length) throw Error("No DemoSeeder properties found");
  properties.sort((a, b) => a.id - b.id);
  let uploads = 0;
  let reused = 0;
  const exteriors = manifest.photos.filter((p) => p.role === "exterior");
  const interiors = manifest.photos.filter((p) => p.role === "interior");
  for (const [index, property] of properties.entries()) {
    const endpoint = `/api/v1/internal/properties/${property.id}/media`;
    let current = await call(`${endpoint}?per_page=50`);
    let version = current.property_version;
    const snapshot = path.join(folder, `before-${property.id}.json`);
    try {
      await fs.access(snapshot);
    } catch {
      await fs.writeFile(
        snapshot,
        JSON.stringify(
          {
            property_id: property.id,
            media: current.data.map(
              ({ id, position, published, alt, kind }) => ({
                id,
                position,
                published,
                alt,
                kind,
              }),
            ),
          },
          null,
          2,
        ),
      );
    }
    const selection = [
      exteriors[index % exteriors.length],
      interiors[index % interiors.length],
      interiors[(index + 1) % interiors.length],
    ];
    const selected = [];
    for (const photo of selection) {
      let media = current.data.find(
        (m) => m.alt === photo.alt && m.state !== "ARCHIVED",
      );
      if (media) reused++;
      else uploads++;
      if (!media) {
        const result = await call(endpoint, {
          method: "POST",
          multipart: {
            version: String(version),
            kind: "PHOTO",
            alt: photo.alt,
            file: {
              name: `${photo.key}.webp`,
              mimeType: "image/webp",
              buffer: await fs.readFile(photo.file),
            },
          },
        });
        version = result.property_version;
        media = result.data;
      }
      selected.push(media.id);
    }
    const deadline = Date.now() + 60000;
    do {
      current = await call(`${endpoint}?per_page=50`);
      version = current.property_version;
      if (
        selected.every((id) =>
          current.data.some((m) => m.id === id && m.state === "READY"),
        )
      )
        break;
      if (
        selected.some((id) =>
          current.data.some((m) => m.id === id && m.state === "FAILED"),
        )
      )
        throw Error(`Media processing failed for demo #${property.id}`);
      if (Date.now() > deadline)
        throw Error(
          "Start the media queue worker and rerun; old cover remains intact",
        );
      await pause(1500);
    } while (true);
    for (const [position, id] of selected.entries()) {
      const media = current.data.find((m) => m.id === id);
      if (media.published && media.position === position) continue;
      const result = await call(`${endpoint}/${id}`, {
        method: "PATCH",
        data: { version, published: true, position },
      });
      version = result.property_version;
    }
    for (const media of current.data.filter(
      (m) =>
        m.kind === "PHOTO" &&
        m.alt.startsWith("Ilustrasi sintetis PHOTO") &&
        m.published,
    )) {
      const result = await call(`${endpoint}/${media.id}`, {
        method: "PATCH",
        data: { version, published: false, position: 100 },
      });
      version = result.property_version;
    }
    console.log(
      `Demo #${property.id}: 3 curated photos ready; ${index + 1}/${properties.length}`,
    );
  }
  console.log(
    `Completed: ${properties.length} demo properties. Uploads: ${uploads}; reused: ${reused}. Original media retained unpublished; local snapshots saved.`,
  );
} finally {
  await api.dispose();
}
