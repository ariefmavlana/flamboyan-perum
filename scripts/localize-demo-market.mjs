// Explicit local-demo maintenance only; never imported by the application.
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
if (process.env.LOCALIZE_DEMO_MARKET !== "1" || !process.env.DEMO_PASSWORD)
  throw Error("Set LOCALIZE_DEMO_MARKET=1 and DEMO_PASSWORD explicitly.");
if (
  !["local", "testing"].includes(env("APP_ENV")) ||
  env("DB_CONNECTION") !== "sqlite" ||
  path.resolve(env("DB_DATABASE") ?? "") !==
    path.join(root, ".tools/dynamic-demo.sqlite")
)
  throw Error(
    "Only the dedicated local .tools/dynamic-demo.sqlite fixture is supported.",
  );
const location = "Bandung Timur (demo)";
const address =
  "Bandung Timur — alamat ilustrasi demo; titik lokasi belum diverifikasi.";
const isDemo = (property) =>
  /^demo-[a-z0-9]{16}$/.test(property.slug) &&
  property.title.startsWith("Rumah Demo ") &&
  property.description.startsWith("DATA DEMO");
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
    await pause(700);
    const state = await api.storageState();
    const xsrf = decodeURIComponent(
      state.cookies.find((cookie) => cookie.name === "XSRF-TOKEN")?.value ?? "",
    );
    const response = await api.fetch(url, {
      headers: { "X-XSRF-TOKEN": xsrf },
      ...options,
    });
    if (!response.ok())
      throw Error(
        `${options.method ?? "GET"} ${url}: HTTP ${response.status()}; stop and review before retrying.`,
      );
    return response.json();
  }
  await call("/auth/login", {
    method: "POST",
    data: { email: "admin@example.test", password: process.env.DEMO_PASSWORD },
  });
  const records = [];
  let page = 1;
  while (page <= 20) {
    const result = await call(
      `/api/v1/internal/properties?per_page=48&page=${page}`,
    );
    records.push(...result.data.filter(isDemo));
    if (page >= result.meta.last_page) break;
    if (page === 20)
      throw Error("Listing exceeds bounded demo audit. No changes made.");
    page++;
  }
  if (
    records.length !== 24 ||
    new Set(records.map((property) => property.id)).size !== 24
  )
    throw Error(
      `Expected exactly 24 untouched DemoSeeder identities; found ${records.length}. No changes made.`,
    );
  records.sort((a, b) => a.id - b.id);
  const snapshot = path.join(root, ".tools/demo-market-before.json");
  try {
    await fs.writeFile(
      snapshot,
      JSON.stringify(
        {
          captured_at: new Date().toISOString(),
          purpose:
            "Original location/address for explicit local demo market correction",
          properties: records.map(
            ({ id, slug, version, location, address }) => ({
              id,
              slug,
              version,
              location,
              address,
            }),
          ),
        },
        null,
        2,
      ),
      { flag: "wx" },
    );
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const before = JSON.parse(await fs.readFile(snapshot, "utf8"));
    if (
      JSON.stringify(
        before.properties.map(({ id, slug }) => ({ id, slug })),
      ) !== JSON.stringify(records.map(({ id, slug }) => ({ id, slug })))
    )
      throw Error(
        "Existing snapshot belongs to another demo dataset. No changes made.",
      );
  }
  const preserved = [
    "slug",
    "title",
    "description",
    "house_type",
    "owner_id",
    "publication",
    "availability",
    "featured",
    "price_idr",
    "land_area",
    "building_area",
    "bedrooms",
    "bathrooms",
    "certificate",
    "condition",
    "latitude",
    "longitude",
    "pois",
  ];
  let changed = 0;
  for (const property of records) {
    if (property.location === location && property.address === address)
      continue;
    const result = await call(`/api/v1/internal/properties/${property.id}`, {
      method: "PATCH",
      data: { version: property.version, location, address },
    });
    if (
      result.data.location !== location ||
      result.data.address !== address ||
      preserved.some(
        (key) =>
          JSON.stringify(result.data[key]) !== JSON.stringify(property[key]),
      )
    )
      throw Error(
        `Unexpected response for demo #${property.id}. Stop and review snapshot.`,
      );
    changed++;
  }
  console.log(
    `Verified 24 seeded demo properties; localized ${changed}. Location/address only; original snapshot: .tools/demo-market-before.json. Coordinates and POIs were not changed or verified.`,
  );
} finally {
  await api.dispose();
}
