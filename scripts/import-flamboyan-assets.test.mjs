import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  validateOptions,
  validateOrigin,
  validateManifest,
  verifyBytes,
  manifestFingerprint,
  propertyFingerprint,
  planProperty,
  validateJournal,
  storagePreflight,
  importAssets,
} from "./import-flamboyan-assets.mjs";

const types = ["36/60", "36/90", "56/90", "62/70", "69/80"];
const counts = [9, 8, 10, 14, 9];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

function webp(width, height, tag = "source") {
  const image = Buffer.alloc(18);
  image.write("VP8X", 0);
  image.writeUInt32LE(10, 4);
  image.writeUIntLE(width - 1, 12, 3);
  image.writeUIntLE(height - 1, 15, 3);
  const tail = Buffer.from(tag);
  const chunk = Buffer.alloc(8 + tail.length + (tail.length % 2));
  chunk.write("JUNK");
  chunk.writeUInt32LE(tail.length, 4);
  tail.copy(chunk, 8);
  const header = Buffer.alloc(12);
  header.write("RIFF");
  header.writeUInt32LE(4 + image.length + chunk.length, 4);
  header.write("WEBP", 8);
  return Buffer.concat([header, image, chunk]);
}

function inventory() {
  const buffers = new Map();
  const manifest = {
    schema_version: 1,
    properties: types.map((house_type) => ({
      house_type,
      slug: `bukit-flamboyan-indah-2-${house_type.replace("/", "-")}`,
    })),
    assets: types.flatMap((house_type, typeIndex) =>
      Array.from({ length: counts[typeIndex] + 1 }, (_, position) => {
        const key = `${house_type.replace("/", "-")}-${position}`;
        const bytes = webp(1200, 900, key);
        buffers.set(key, bytes);
        return {
          key,
          house_type,
          kind: position === counts[typeIndex] ? "FLOOR_PLAN" : "PHOTO",
          file: `.tools/real-flamboyan-assets/import/${key}.webp`,
          bytes: bytes.length,
          sha256: hash(bytes),
          width: 1200,
          height: 900,
          alt: `Ilustrasi tipe ${house_type} [BFI2:${key}]`,
          position,
        };
      }),
    ),
  };
  return { manifest, buffers };
}

const { manifest, buffers } = inventory();
const assets = manifest.assets.filter((a) => a.house_type === "36/60");
const property = {
  id: 1,
  slug: "bukit-flamboyan-indah-2-36-60",
  house_type: "36/60",
  publication: "PUBLISHED",
  owner_id: 12,
  price_idr: 700000000,
  version: 1,
};
const origin = "http://127.0.0.1:3000";

function receipt(asset, id, published = false) {
  return {
    key: asset.key,
    source_sha256: asset.sha256,
    property_id: property.id,
    media_id: id,
    published,
    position: asset.position,
    state: "READY",
    processed_sha256: hash(buffers.get(asset.key)),
  };
}

function media(asset, id, published = false) {
  return {
    id,
    property_id: property.id,
    kind: asset.kind,
    alt: asset.alt,
    mime: "image/webp",
    size_bytes: asset.bytes,
    width: asset.width,
    height: asset.height,
    state: "READY",
    published,
    position: asset.position,
  };
}

test("inventory covers 50 type photos and five distinct floor plans", () => {
  validateManifest(manifest);
  assert.equal(manifest.assets.length, 55);
});

test("CLI defaults to read-only and rejects unknown or repeated flags", () => {
  assert.deepEqual(validateOptions([]), { apply: false });
  assert.deepEqual(validateOptions(["--apply"]), { apply: true });
  for (const flags of [["--force"], ["--apply", "--apply"], ["--delete"]])
    assert.throws(() => validateOptions(flags));
});

test("origins are exact and never accept credentials, paths or lookalike domains", () => {
  for (const value of [
    "https://evil.test",
    "https://flamboyan-web.vercel.app.evil.test",
    "https://user:pass@flamboyan-web.vercel.app",
    "https://flamboyan-web.vercel.app/",
    "http://127.0.0.1:3001",
  ])
    assert.throws(() => validateOrigin(value));
  assert.equal(validateOrigin(origin), origin);
  assert.equal(
    validateOrigin("https://flamboyan-web.vercel.app"),
    "https://flamboyan-web.vercel.app",
  );
});

test("manifest rejects wrong types, duplicate keys, hashes, traversal and missing denah", () => {
  for (const mutate of [
    (m) => (m.properties[0].house_type = "36/72"),
    (m) => (m.assets[0].house_type = "69/80"),
    (m) => (m.assets[1].key = m.assets[0].key),
    (m) => (m.assets[1].sha256 = m.assets[0].sha256),
    (m) => (m.assets[0].file = ".tools/real-flamboyan-assets/import/../a.webp"),
    (m) => (m.assets[0].file = "https://evil.test/a.webp"),
    (m) => (m.assets[9].kind = "PHOTO"),
    (m) => (m.assets[1].position = 0),
    (m) => (m.assets[0].alt = "without marker"),
    (m) => (m.assets[0].width = 20001),
  ]) {
    const bad = structuredClone(manifest);
    mutate(bad);
    assert.throws(() => validateManifest(bad));
  }
});

test("source verification checks SHA256, bytes, WebP signature and source dimensions", () => {
  const asset = assets[0];
  const bytes = buffers.get(asset.key);
  verifyBytes(asset, bytes);
  assert.throws(() => verifyBytes(asset, Buffer.from("changed")));
  assert.throws(() => verifyBytes({ ...asset, width: 1 }, bytes));
  const invalid = Buffer.from("not a webp");
  assert.throws(() =>
    verifyBytes(
      { ...asset, bytes: invalid.length, sha256: hash(invalid) },
      invalid,
    ),
  );
});

test("resumes only journal-bound exact media IDs with the original source SHA", () => {
  const existing = media(assets[0], 10);
  const entry = receipt(assets[0], 10);
  assert.equal(
    planProperty(property, [existing], assets, [entry])[0].existing.id,
    10,
  );
  for (const patch of [
    { id: 11 },
    { property_id: 99 },
    { kind: "PHOTO", mime: "image/jpeg" },
    { width: 1 },
    { size_bytes: 1 },
    { published: true },
    { state: "FAILED" },
    { alt: "changed" },
  ])
    assert.throws(() =>
      planProperty(property, [{ ...existing, ...patch }], assets, [entry]),
    );
  assert.throws(() =>
    planProperty(property, [existing], assets, [
      { ...entry, source_sha256: "a".repeat(64) },
    ]),
  );
  assert.throws(() => planProperty(property, [existing], assets));
  assert.throws(() =>
    planProperty(property, [existing, { ...existing, id: 11 }], assets, [
      entry,
    ]),
  );
});

test("preflight refuses property identity/publication changes and full active quotas", () => {
  for (const patch of [
    { publication: "DRAFT" },
    { house_type: "36/72" },
    { slug: "another-project" },
  ])
    assert.throws(() => planProperty({ ...property, ...patch }, [], assets));
  const full = Array.from({ length: 12 }, (_, i) => ({
    id: 100 + i,
    property_id: property.id,
    kind: "PHOTO",
    state: "READY",
    published: false,
  }));
  assert.throws(() => planProperty(property, full, assets), /capacity/i);
  assert.equal(planProperty(property, full.slice(0, 11), assets).length, 10);
  assert.equal(
    planProperty(
      property,
      full.map((m) => ({ ...m, state: "ARCHIVED" })),
      assets,
    ).length,
    10,
  );
});

test("storage preflight reserves staging plus three variants and rejects more than 100 MiB", () => {
  assert.equal(
    storagePreflight([{ asset: { bytes: 100 }, existing: null }]),
    400,
  );
  assert.equal(storagePreflight([{ asset: { bytes: 100 }, existing: {} }]), 0);
  assert.throws(() =>
    storagePreflight([{ asset: { bytes: 26 * 1024 * 1024 }, existing: null }]),
  );
  assert.equal(
    storagePreflight([{ asset: { bytes: 25 * 1024 * 1024 }, existing: null }]),
    100 * 1024 * 1024,
  );
});

test("journal binding rejects changed manifest, origin, property version and unfinished writes", () => {
  const journal = {
    schema_version: 1,
    manifest_sha256: manifestFingerprint(manifest),
    origin,
    properties: [{ property, version: 1, media: [], entries: [] }],
    pending: null,
  };
  validateJournal(journal, manifest, origin, [property]);
  assert.throws(() =>
    validateJournal(
      { ...journal, origin: "https://evil.test" },
      manifest,
      origin,
      [property],
    ),
  );
  assert.throws(() =>
    validateJournal(journal, { ...manifest, schema_version: 2 }, origin, [
      property,
    ]),
  );
  assert.throws(() =>
    validateJournal(journal, manifest, origin, [{ ...property, version: 2 }]),
  );
  assert.throws(
    () =>
      validateJournal(
        { ...journal, pending: { key: assets[0].key } },
        manifest,
        origin,
        [property],
      ),
    /unconfirmed/i,
  );
});

test("metadata fingerprint protects commercial data and ownership while allowing media version bumps", () => {
  assert.equal(
    propertyFingerprint(property),
    propertyFingerprint({ ...property, version: 10, updated_at: "today" }),
  );
  for (const patch of [
    { price_idr: 1 },
    { owner_id: 99 },
    { publication: "DRAFT" },
  ])
    assert.notEqual(
      propertyFingerprint(property),
      propertyFingerprint({ ...property, ...patch }),
    );
});

function fakeApi() {
  const properties = manifest.properties.map((p, index) => ({
    ...property,
    ...p,
    id: index + 1,
  }));
  const calls = [];
  const galleries = new Map(properties.map((p) => [p.id, []]));
  let nextId = 100;
  return {
    properties,
    galleries,
    calls,
    async call(url, options = {}) {
      calls.push({ url, ...options });
      if (url.startsWith("/api/v1/internal/properties?"))
        return { data: structuredClone(properties), meta: { last_page: 1 } };
      const propertyId = Number(url.match(/properties\/(\d+)/)?.[1]);
      const current = properties.find((p) => p.id === propertyId);
      if (!url.includes("/media")) return { data: structuredClone(current) };
      const gallery = galleries.get(propertyId);
      if (!options.method || options.method === "GET")
        return {
          data: structuredClone(gallery),
          property_version: current.version,
          meta: { last_page: 1 },
          process_in_request: false,
          supports_unpublished_uploads: true,
        };
      assert.equal(
        Number(options.data?.version ?? options.multipart.version),
        current.version,
      );
      current.version++;
      if (options.method === "POST") {
        assert.equal(options.multipart.published, "0");
        const asset = manifest.assets.find(
          (a) => a.alt === options.multipart.alt,
        );
        const item = {
          ...media(asset, nextId++),
          property_id: propertyId,
          position: gallery.length,
        };
        gallery.push(item);
        return {
          data: structuredClone(item),
          property_version: current.version,
        };
      }
      assert.equal(options.method, "PATCH");
      const id = Number(url.match(/media\/(\d+)/)[1]);
      const item = gallery.find((m) => m.id === id);
      Object.assign(item, options.data);
      delete item.version;
      return { data: structuredClone(item), property_version: current.version };
    },
    async readVariant(id) {
      const item = [...galleries.values()].flat().find((m) => m.id === id);
      const asset = manifest.assets.find((a) => a.alt === item.alt);
      return buffers.get(asset.key);
    },
  };
}

test("default dry-run reads all properties without writing API records or local journals", async () => {
  const api = fakeApi();
  const report = await importAssets({
    manifest,
    origin,
    apply: false,
    call: api.call,
    readAsset: async (a) => buffers.get(a.key),
    saveJournal: async () => assert.fail("Dry-run must not save a journal"),
  });
  assert.equal(report.new, 55);
  assert.equal(report.supports_unpublished_uploads, true);
  assert.equal(
    api.calls.every((c) => !c.method || c.method === "GET"),
    true,
  );
});

test("apply refuses missing/false upload capability on any target before API or journal writes", async () => {
  for (const unsupportedProperty of [1, 5]) {
    for (const capability of [undefined, false]) {
      const api = fakeApi();
      await assert.rejects(
        () =>
          importAssets({
            manifest,
            origin,
            apply: true,
            async call(url, options) {
              const result = await api.call(url, options);
              if (
                url.startsWith(
                  `/api/v1/internal/properties/${unsupportedProperty}/media?`,
                )
              ) {
                if (capability === undefined)
                  delete result.supports_unpublished_uploads;
                else result.supports_unpublished_uploads = capability;
              }
              return result;
            },
            readAsset: async (a) => buffers.get(a.key),
            readVariant: api.readVariant,
            saveJournal: async () =>
              assert.fail("Unsupported backend must not save a journal"),
            pause: async () => {},
          }),
        /unpublished uploads/,
      );
      assert.equal(
        api.calls.every((call) => !call.method || call.method === "GET"),
        true,
      );
      assert.equal([...api.galleries.values()].flat().length, 0);
    }
  }
});

test("dry-run remains read-only on an old backend and reports unsupported upload capability", async () => {
  const api = fakeApi();
  const report = await importAssets({
    manifest,
    origin,
    async call(url, options) {
      const result = await api.call(url, options);
      if (url.includes("/media?")) delete result.supports_unpublished_uploads;
      return result;
    },
    readAsset: async (a) => buffers.get(a.key),
    saveJournal: async () => assert.fail("Dry-run must not save a journal"),
  });
  assert.equal(report.new, 55);
  assert.equal(report.supports_unpublished_uploads, false);
  assert.equal(
    report.properties.every((p) => p.supports_unpublished_uploads === false),
    true,
  );
  assert.equal(
    api.calls.every((call) => !call.method || call.method === "GET"),
    true,
  );
});

test("apply publishes after every imported image is READY, leaves prices/owners intact and resumes without duplicates", async () => {
  const api = fakeApi();
  let journal;
  const options = {
    manifest,
    origin,
    apply: true,
    call: api.call,
    readAsset: async (a) => buffers.get(a.key),
    readVariant: api.readVariant,
    saveJournal: async (value) => {
      journal = structuredClone(value);
    },
    pause: async () => {},
  };
  await importAssets(options);
  assert.equal([...api.galleries.values()].flat().length, 55);
  assert.equal(
    [...api.galleries.values()].flat().every((m) => m.published),
    true,
  );
  assert.equal(
    api.properties.every(
      (p) =>
        p.price_idr === property.price_idr && p.owner_id === property.owner_id,
    ),
    true,
  );
  const firstPatch = api.calls.findIndex((c) => c.method === "PATCH");
  assert.equal(
    api.calls.slice(0, firstPatch).filter((c) => c.method === "POST").length,
    55,
  );
  api.calls.length = 0;
  await importAssets({ ...options, journal });
  assert.equal(
    api.calls.every((c) => !c.method || c.method === "GET"),
    true,
  );
  const imported = [...api.galleries.values()].flat()[0];
  imported.width = 1;
  await assert.rejects(() => importAssets({ ...options, journal }));
});

test("source changes stop before any uploads", async () => {
  const api = fakeApi();
  await assert.rejects(() =>
    importAssets({
      manifest,
      origin,
      apply: true,
      call: api.call,
      readAsset: async () => Buffer.from("tampered"),
      saveJournal: async () => {},
    }),
  );
  assert.equal(
    api.calls.some((c) => c.method === "POST" || c.method === "PATCH"),
    false,
  );
});

test("only superseded photos and floor plans are hidden after all replacements are ready", async () => {
  const api = fakeApi();
  const gallery = api.galleries.get(1);
  for (const [index, kind] of [
    "PHOTO",
    "FLOOR_PLAN",
    "MASTERPLAN",
    "VIDEO",
  ].entries())
    gallery.push({
      id: 10 + index,
      property_id: 1,
      kind,
      alt: `Original ${kind}`,
      position: index,
      state: "READY",
      published: true,
    });
  let journal;
  await importAssets({
    manifest,
    origin,
    apply: true,
    call: api.call,
    readAsset: async (a) => buffers.get(a.key),
    readVariant: api.readVariant,
    saveJournal: async (value) => {
      journal = structuredClone(value);
    },
    pause: async () => {},
  });
  assert.equal(gallery.find((m) => m.id === 10).published, false);
  assert.equal(gallery.find((m) => m.id === 11).published, false);
  assert.equal(gallery.find((m) => m.id === 12).published, true);
  assert.equal(gallery.find((m) => m.id === 13).published, true);
  assert.equal(
    gallery.slice(0, 4).every((m) => m.state === "READY"),
    true,
  );
  assert.equal(
    journal.properties[0].media.every((m) => m.published),
    true,
  );
  const hidden = api.calls.filter((c) => c.data?.published === false);
  assert.deepEqual(
    hidden.map((c) => Number(c.url.split("/").at(-1))),
    [10, 11],
  );
});

test("FAILED processing and an API that ignores private uploads never publish replacements", async () => {
  for (const state of ["FAILED", "published"]) {
    const api = fakeApi();
    await assert.rejects(() =>
      importAssets({
        manifest,
        origin,
        apply: true,
        async call(url, options) {
          const result = await api.call(url, options);
          if (options?.method === "POST") {
            if (state === "FAILED") result.data.state = "FAILED";
            else result.data.published = true;
          }
          return result;
        },
        readAsset: async (a) => buffers.get(a.key),
        readVariant: api.readVariant,
        saveJournal: async () => {},
        pause: async () => {},
      }),
    );
    assert.equal(
      api.calls.some((c) => c.method === "PATCH"),
      false,
    );
  }
});

test("concurrent commercial changes stop before any publication and preserve the user's edit", async () => {
  const api = fakeApi();
  await assert.rejects(
    () =>
      importAssets({
        manifest,
        origin,
        apply: true,
        async call(url, options) {
          if (url === "/api/v1/internal/properties/1") {
            api.properties[0].price_idr = 900000000;
            api.properties[0].version++;
          }
          return api.call(url, options);
        },
        readAsset: async (a) => buffers.get(a.key),
        readVariant: api.readVariant,
        saveJournal: async () => {},
        pause: async () => {},
      }),
    /metadata changed/,
  );
  assert.equal(
    api.calls.some((c) => c.method === "PATCH"),
    false,
  );
  assert.equal(api.properties[0].price_idr, 900000000);
});

test("a response lost after an upload leaves a source-bound pending intent and refuses automatic retry", async () => {
  const api = fakeApi();
  let journal;
  const options = {
    manifest,
    origin,
    apply: true,
    readAsset: async (a) => buffers.get(a.key),
    readVariant: api.readVariant,
    saveJournal: async (value) => {
      journal = structuredClone(value);
    },
    pause: async () => {},
  };
  await assert.rejects(
    () =>
      importAssets({
        ...options,
        async call(url, requestOptions) {
          const result = await api.call(url, requestOptions);
          if (requestOptions?.method === "POST") throw Error("Response lost");
          return result;
        },
      }),
    /Response lost/,
  );
  assert.equal(journal.pending.source_sha256, assets[0].sha256);
  assert.equal(journal.pending.property_id, 1);
  assert.deepEqual(journal.pending.baseline_media_ids, []);
  assert.equal(api.galleries.get(1).length, 1);
  api.calls.length = 0;
  await assert.rejects(
    () => importAssets({ ...options, journal, call: api.call }),
    /Unconfirmed/,
  );
  assert.equal(
    api.calls.some((c) => c.method === "POST" || c.method === "PATCH"),
    false,
  );
});
