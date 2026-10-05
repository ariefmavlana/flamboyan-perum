import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  validateOrigin,
  validateManifest,
  verifyBytes,
  propertyFingerprint,
  planProperty,
} from "./import-rajasa-assets.mjs";
const manifest = JSON.parse(
  await fs.readFile(
    new URL("./rajasa-house-assets.json", import.meta.url),
    "utf8",
  ),
);
const assets = manifest.assets.filter(
  (a) => a.action === "import" && a.house_type === "36/60",
);
const property = {
  id: 1,
  slug: "bukit-flamboyan-indah-2-36-60",
  house_type: "36/60",
  publication: "PUBLISHED",
  price_idr: 700000000,
  version: 1,
};
test("inventory covers nine types, 33 source assets, and 21 distinct gallery images", () => {
  validateManifest(manifest);
  assert.equal(manifest.assets.length, 33);
  assert.equal(manifest.assets.filter((a) => a.action === "import").length, 21);
});
test("rejects foreign origins and credential-bearing URLs", () => {
  for (const origin of [
    "https://evil.test",
    "https://flamboyan-web.vercel.app.evil.test",
    "https://user:pass@flamboyan-web.vercel.app",
  ])
    assert.throws(() => validateOrigin(origin));
  assert.equal(
    validateOrigin("http://127.0.0.1:3000"),
    "http://127.0.0.1:3000",
  );
});
test("source hash detects changed or truncated originals", () => {
  const bytes = Buffer.from("original");
  const asset = {
    key: "1",
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
  verifyBytes(asset, bytes);
  assert.throws(() => verifyBytes(asset, Buffer.from("modified")));
});
test("rejects foreign source, remapped type, repeated cover positions, duplicate gallery bytes", () => {
  for (const mutate of [
    (m) => (m.assets[0].url = "https://evil.test/a.webp"),
    (m) => (m.properties[0].house_type = "99/99"),
    (m) => (m.assets.find((a) => a.key === "542406").position = 0),
    (m) =>
      (m.assets.find((a) => a.key === "542406").sha256 = m.assets.find(
        (a) => a.key === "865863",
      ).sha256),
  ]) {
    const bad = structuredClone(manifest);
    mutate(bad);
    assert.throws(() => validateManifest(bad));
  }
});
test("plans missing media and reuses only exact READY published imports", () => {
  assert.equal(
    planProperty(property, [], assets).filter((s) => !s.existing).length,
    2,
  );
  const media = assets.map((a, i) => ({
    id: i + 1,
    kind: "PHOTO",
    alt: a.alt,
    state: "READY",
    published: true,
    width: a.width,
    height: a.height,
  }));
  assert.equal(
    planProperty(property, media, assets).filter((s) => s.existing).length,
    2,
  );
  for (const patch of [
    { published: false },
    { state: "FAILED" },
    { alt: "Edited " + media[0].alt },
    { width: 10 },
  ])
    assert.throws(() =>
      planProperty(property, [{ ...media[0], ...patch }, media[1]], assets),
    );
});
test("rejects archived properties, wrong type, duplicate markers and capacity overflow", () => {
  assert.throws(() =>
    planProperty({ ...property, publication: "ARCHIVED" }, [], assets),
  );
  assert.throws(() =>
    planProperty({ ...property, house_type: "36/72" }, [], assets),
  );
  assert.throws(() =>
    planProperty(
      property,
      [{ alt: assets[0].alt }, { alt: assets[0].alt }],
      assets,
    ),
  );
  assert.throws(() =>
    planProperty(
      property,
      Array.from({ length: 19 }, () => ({ kind: "PHOTO" })),
      assets,
    ),
  );
});
test("metadata comparison ignores media version timestamps but protects price and ownership", () => {
  assert.equal(
    propertyFingerprint(property),
    propertyFingerprint({
      ...property,
      version: 9,
      updated_at: "today",
      owner: { name: "private" },
    }),
  );
  assert.notEqual(
    propertyFingerprint(property),
    propertyFingerprint({ ...property, price_idr: 1 }),
  );
  assert.notEqual(
    propertyFingerprint(property),
    propertyFingerprint({ ...property, owner_id: 99 }),
  );
});
