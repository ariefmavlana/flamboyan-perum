import test from "node:test";
import assert from "node:assert/strict";
import {
  assertWorkerReady,
  processedDimensions,
  descriptionNew,
  descriptionOld,
  findByMarker,
  markerFor,
  nextDescription,
  photoTypes,
  planPropertyPhotos,
  planSiteplan,
  propertyFingerprint,
  validateManifest,
  verifyBytes,
  youtubeId,
} from "./import-flamboyan-assets.mjs";

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

function slugFor(houseType) {
  return `bukit-flamboyan-indah-2-${houseType.replace("/", "-")}`;
}

let hashCounter = 0;
function sha() {
  hashCounter += 1;
  return hashCounter.toString(16).padStart(64, "0");
}

function makeAsset(houseType, position, overrides = {}) {
  const key = `${houseType.replace("/", "-")}-${position + 1}`;
  return {
    key,
    file: `edited/${houseType.replace("/", "-")}/${key}.jpg`,
    sha256: sha(),
    bytes: 1000,
    width: 2752,
    height: 1536,
    kind: "PHOTO",
    house_type: houseType,
    alt: `Dokumentasi tipe ${houseType} #${position + 1} · Foto dokumentasi pengguna; kondisi unit dikonfirmasi saat kunjungan. ${markerFor(key)}`,
    position,
    ...overrides,
  };
}

function makeManifest(overrides = {}) {
  const assets = [];
  for (const houseType of photoTypes) {
    assets.push(makeAsset(houseType, 0));
    assets.push(makeAsset(houseType, 1));
  }
  return {
    schema_version: 1,
    properties: types.map((houseType) => ({
      house_type: houseType,
      slug: slugFor(houseType),
    })),
    assets,
    siteplan: {
      key: "siteplan",
      file: "shared/Siteplan.jpg",
      sha256: sha(),
      bytes: 2000,
      width: 2400,
      height: 1792,
      kind: "MASTERPLAN",
      alt: `Site plan Bukit Flamboyan Indah 2 · dokumentasi pengguna; warna bukan status ketersediaan. ${markerFor("siteplan")}`,
    },
    videos: [],
    ...overrides,
  };
}

function mediaItem(overrides = {}) {
  return {
    id: 1,
    kind: "PHOTO",
    alt: "x",
    position: 0,
    published: true,
    state: "READY",
    width: 1920,
    height: 1072,
    ...overrides,
  };
}

test("valid manifest passes and gemini alt rules are enforced", () => {
  const manifest = makeManifest();
  assert.doesNotThrow(() => validateManifest(manifest));
  const gemini = makeAsset("62/70", 2, {
    key: "gemini-abc",
    file: "edited/62-70/Gemini_Generated_Image_abc.jpg",
    alt: `Ilustrasi AI · tipe 62/70 · bukan foto kondisi aktual. ${markerFor("gemini-abc")}`,
  });
  manifest.assets.push(gemini);
  assert.doesNotThrow(() => validateManifest(manifest));
  const badIllustration = makeAsset("36/60", 2, {
    alt: `Ilustrasi desain · ${markerFor("36-60-3")}`,
  });
  assert.throws(
    () =>
      validateManifest(
        makeManifest({ assets: [...manifest.assets, badIllustration] }),
      ),
    /Invalid gallery asset/,
  );
  const badGenerated = makeAsset("62/70", 3, {
    key: "gemini-def",
    alt: `Foto dokumentasi tanpa label. ${markerFor("gemini-def")}`,
  });
  const broken = makeManifest();
  broken.assets.push(badGenerated);
  assert.throws(() => validateManifest(broken), /Invalid gallery asset/);
});

test("manifest rejects wrong mapping, order, duplicates and limits", () => {
  const wrongSlug = makeManifest();
  wrongSlug.properties[0].slug = "salah-slug";
  assert.throws(() => validateManifest(wrongSlug), /property mapping/);

  const gap = makeManifest();
  gap.assets = gap.assets.map((a) =>
    a.house_type === "36/60" && a.position === 1 ? { ...a, position: 5 } : a,
  );
  assert.throws(() => validateManifest(gap), /gallery order/);

  const duplicateHash = makeManifest();
  duplicateHash.assets[1].sha256 = duplicateHash.assets[0].sha256;
  assert.throws(() => validateManifest(duplicateHash), /Invalid gallery asset/);

  const tooBig = makeManifest();
  tooBig.assets[0].bytes = 5 * 1024 * 1024 + 1;
  assert.throws(() => validateManifest(tooBig), /Invalid gallery asset/);

  const missingMarker = makeManifest();
  missingMarker.assets[0].alt = "Dokumentasi tanpa marker.";
  assert.throws(() => validateManifest(missingMarker), /Invalid gallery asset/);
});

test("verifyBytes rejects changed source and oversized files", () => {
  const bytes = Buffer.from("hello");
  const asset = {
    key: "x",
    bytes: bytes.length,
    sha256: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  };
  assert.doesNotThrow(() => verifyBytes(asset, bytes));
  assert.throws(
    () => verifyBytes(asset, Buffer.from("hello!")),
    /Source changed/,
  );
  assert.throws(
    () =>
      verifyBytes(
        { ...asset, bytes: 6 * 1024 * 1024 },
        Buffer.alloc(6 * 1024 * 1024),
      ),
    /Source changed/,
  );
});

test("findByMarker is exact and rejects duplicates", () => {
  const media = [mediaItem({ id: 1, alt: `a ${markerFor("36-60-1")}` })];
  assert.equal(findByMarker(media, "36-60-1")?.id, 1);
  assert.equal(findByMarker(media, "36-60-10"), undefined);
  assert.throws(
    () =>
      findByMarker(
        [...media, mediaItem({ id: 2, alt: `b ${markerFor("36-60-1")}` })],
        "36-60-1",
      ),
    /Duplicate import marker/,
  );
});

test("planPropertyPhotos enforces capacity, reuse and readiness", () => {
  const houseType = "36/60";
  const assets = [makeAsset(houseType, 0), makeAsset(houseType, 1)];
  const property = {
    id: 1,
    slug: slugFor(houseType),
    house_type: houseType,
    publication: "PUBLISHED",
  };
  const existing = mediaItem({ id: 7, alt: assets[0].alt });
  const plan = planPropertyPhotos(property, [existing], assets);
  assert.equal(plan[0].existing?.id, 7);
  assert.equal(plan[1].existing, undefined);

  const full = Array.from({ length: 20 }, (_, index) =>
    mediaItem({ id: 100 + index, alt: `lama ${index}` }),
  );
  assert.throws(
    () => planPropertyPhotos(property, full, assets),
    /Photo capacity exceeded/,
  );

  const changed = mediaItem({ id: 7, alt: assets[0].alt, width: 100 });
  assert.throws(
    () => planPropertyPhotos(property, [changed], assets),
    /Imported media changed or not ready/,
  );
});

test("planSiteplan refuses destructive replacement and reuses processed media", () => {
  const siteplan = makeManifest().siteplan;
  const oldMasterplan = mediaItem({
    id: 5,
    kind: "MASTERPLAN",
    alt: "Masterplan brosur.",
  });
  assert.throws(
    () => planSiteplan([oldMasterplan], siteplan),
    /will not archive or replace/,
  );
  assert.equal(planSiteplan([], siteplan).existing, undefined);

  const imported = mediaItem({
    id: 9,
    kind: "MASTERPLAN",
    alt: siteplan.alt,
    width: 1920,
    height: 1434,
    position: 1,
  });
  const rerun = planSiteplan([imported], siteplan);
  assert.equal(rerun.existing?.id, 9);
  assert.throws(
    () => planSiteplan([imported, oldMasterplan], siteplan),
    /will not archive or replace/,
  );
  assert.throws(
    () => planSiteplan([{ ...imported, width: 2400, height: 1792 }], siteplan),
    /not ready/,
  );
});

test("nextDescription rewrites once, then reports done", () => {
  const before = `Ringkasan tipe. ${descriptionOld} Ketersediaan unit dan dokumen legalitas dikonfirmasi sebelum transaksi.`;
  const update = nextDescription(before);
  assert.equal(update.state, "update");
  assert.match(
    update.value,
    new RegExp(descriptionNew.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
  const again = nextDescription(update.value);
  assert.equal(again.state, "done");
  assert.deepEqual(nextDescription("Deskripsi faktual yang disusun Admin."), {
    state: "preserved",
  });
});

test("propertyFingerprint ignores volatile fields but keeps the rest", () => {
  const base = {
    id: 1,
    title: "A",
    version: 3,
    updated_at: "x",
    owner: { id: 1 },
    description: "d",
  };
  assert.equal(
    propertyFingerprint(base),
    propertyFingerprint({
      ...base,
      version: 9,
      updated_at: "y",
      owner: null,
      description: "z",
    }),
  );
  assert.notEqual(
    propertyFingerprint(base),
    propertyFingerprint({ ...base, title: "B" }),
  );
});

test("youtubeId accepts canonical forms and rejects others", () => {
  assert.equal(
    youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assert.equal(youtubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(
    youtubeId("https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s"),
    "dQw4w9WgXcQ",
  );
  assert.throws(
    () => youtubeId("https://example.com/watch?v=dQw4w9WgXcQ"),
    /Invalid YouTube URL/,
  );
  assert.throws(
    () => youtubeId("https://youtu.be/short"),
    /Invalid YouTube URL/,
  );
});

test("dimensions follow server resizing without upscaling", () => {
  assert.deepEqual(processedDimensions({ width: 2752, height: 1536 }), {
    width: 1920,
    height: 1072,
  });
  assert.deepEqual(processedDimensions({ width: 2400, height: 1792 }), {
    width: 1920,
    height: 1434,
  });
  assert.deepEqual(processedDimensions({ width: 800, height: 600 }), {
    width: 800,
    height: 600,
  });
  assert.throws(
    () => processedDimensions({ width: 0, height: 1 }),
    /Invalid source/,
  );
});

test("worker acknowledgement is required before new asynchronous uploads", () => {
  const pending = {
    current: { process_in_request: false },
    photos: [{ existing: null }],
    siteplan: { existing: null },
  };
  assert.throws(
    () => assertWorkerReady([pending], false),
    /Separate media worker required/,
  );
  assert.doesNotThrow(() => assertWorkerReady([pending], true));
  assert.doesNotThrow(() =>
    assertWorkerReady(
      [{ ...pending, current: { process_in_request: true } }],
      false,
    ),
  );
  assert.doesNotThrow(() =>
    assertWorkerReady(
      [{ ...pending, photos: [{ existing: {} }], siteplan: { existing: {} } }],
      false,
    ),
  );
});
