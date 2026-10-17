#!/usr/bin/env node
// Audit lokal untuk blok "Atribusi AI dan perangkat" yang diwajibkan AGENTS.md.
// GitHub Actions tidak dipakai: jalankan manual sebelum review atau sebagai gate lokal.
//
// Penggunaan:
//   node scripts/ai-attribution-audit.mjs                 # semua PR terbuka pada remote origin
//   node scripts/ai-attribution-audit.mjs --pr 48         # satu PR
//   node scripts/ai-attribution-audit.mjs --repo a/b      # repository lain
//   node scripts/ai-attribution-audit.mjs --json          # keluaran mesin
//   node scripts/ai-attribution-audit.mjs --self-test     # uji parser tanpa jaringan
//
// GITHUB_TOKEN opsional; tanpa token pemeriksaan PR publik dibatasi kuota anonim.
import { execFileSync } from "node:child_process";
import { isIP } from "node:net";
import process from "node:process";

const HEADING = "## Atribusi AI dan perangkat";
const LABELS = ["AI", "Model", "Perangkat", "Operator", "Peran AI"];
const NO_AGENT = ["tidak ada", "none"];
const PLACEHOLDER = /^(?:[-–—]+|n\/?a|tbd|todo|unknown|belum diisi)$/i;
// Prefix branch yang lazim dibuat agen; hanya sinyal, bukan bukti.
const AGENT_PREFIXES = [
  "codex",
  "cursor",
  "devin",
  "copilot",
  "claude",
  "jules",
  "openhands",
  "aider",
  "windsurf",
  "gemini",
  "amp",
  "sweep",
  "codegen",
];

export function parseBlock(body) {
  const lines = String(body ?? "").split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === HEADING);
  if (start === -1) return null;
  const section = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s/.test(lines[index])) break;
    section.push(lines[index]);
  }
  const values = {};
  for (const line of section) {
    const match = /^-\s*([A-Za-z][A-Za-z ]*?)\s*(?:\([^)]*\))?\s*:\s*(.*)$/.exec(
      line,
    );
    if (!match) continue;
    const label = match[1].trim();
    if (LABELS.includes(label)) values[label] = match[2].trim();
  }
  return values;
}

export function inferredAgent(ref) {
  const prefix = String(ref ?? "").split("/")[0].toLowerCase();
  return AGENT_PREFIXES.includes(prefix) ? prefix : null;
}

function containsAddress(device) {
  for (const match of device.matchAll(/[^\s,;()[\]<>="'/]+/g)) {
    let candidate = match[0].split("%")[0].replace(/\.$/, "");
    if (!isIP(candidate) && /^[\d.]+:\d+$/.test(candidate)) candidate = candidate.split(":")[0];
    const family = isIP(candidate);
    if (family === 6) return true;
    if (family === 4) {
      // An explicitly labelled runtime/build version is not an address.
      const prefix = device.slice(0, match.index).trimEnd();
      if (!/\b(?:v|version|versi|build|runtime)\s*$/i.test(prefix)) return true;
    }
  }
  return false;
}

export function auditPull(pull) {
  const values = parseBlock(pull.body);
  if (!values) {
    return [
      {
        level: "error",
        code: "blok-hilang",
        message: `Blok "${HEADING}" tidak ada pada summary PR.`,
      },
    ];
  }

  const declared = values["AI"] ?? "";
  const declaredNone = NO_AGENT.includes(declared.toLowerCase());
  const findings = [];
  for (const label of LABELS) {
    const value = values[label] ?? "";
    const modelNotApplicable = label === "Model" && declaredNone && value === "-";
    if (!value.trim() || (PLACEHOLDER.test(value) && !modelNotApplicable) || (label === "Perangkat" && NO_AGENT.includes(value.toLowerCase()))) {
      findings.push({
        level: "error",
        code: "kolom-kosong",
        message: `Kolom "${label}" kosong atau hanya berisi placeholder.`,
      });
    }
  }
  if (declared && !declaredNone && (!/[a-z]/i.test(declared) || !/\d+(?:\.\d+)*/.test(declared))) {
    findings.push({ level: "error", code: "versi-agen-hilang", message: 'Kolom "AI" harus mencantumkan nama dan versi agen.' });
  }
  if (declared && !declaredNone && NO_AGENT.includes((values["Model"] ?? "").toLowerCase())) {
    findings.push({ level: "error", code: "model-hilang", message: 'Model diperlukan bila AI digunakan.' });
  }
  if (!/^@[a-z\d](?:[a-z\d-]{0,38})$/i.test(values["Operator"] ?? "")) {
    findings.push({ level: "error", code: "operator-tidak-valid", message: 'Operator harus berupa @login GitHub penanggung jawab.' });
  }
  const role = (values["Peran AI"] ?? "").toLowerCase();
  if (declaredNone ? !NO_AGENT.includes(role) : !/\b(?:implementasi|review|dokumentasi)\b/.test(role)) {
    findings.push({ level: "error", code: "peran-tidak-valid", message: 'Peran AI harus sesuai penggunaan: implementasi, review, dokumentasi, atau tidak ada.' });
  }

  const device = values["Perangkat"] ?? "";
  if (containsAddress(device)) {
    findings.push({
      level: "error",
      code: "perangkat-pribadi",
      message: 'Kolom "Perangkat" memuat alamat IP yang disamarkan; hapus alamat dan gunakan hanya fakta teknis non-pribadi.',
    });
  }

  const agent = inferredAgent(pull.head?.ref);
  if (declaredNone && agent) {
    findings.push({
      level: "warn",
      code: "deklarasi-tidak-cocok",
      message: `"AI" diisi "tidak ada" sedangkan prefix branch "${agent}/" menandakan agen.`,
    });
  }
  if (!declaredNone && agent && !declared.toLowerCase().includes(agent)) {
    findings.push({
      level: "warn",
      code: "deklarasi-tidak-cocok",
      message: `Deklarasi "AI" berbeda dari sinyal prefix branch "${agent}/"; periksa secara manual.`,
    });
  }

  const author = pull.user?.login ?? "";
  if (author.endsWith("[bot]")) {
    findings.push({
      level: "warn",
      code: "author-bot",
      message: `PR dibuka oleh akun bot ${author}; agen tidak boleh mendaftarkan dirinya sebagai pihak dengan akses.`,
    });
  }

  return findings;
}

async function github(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    redirect: "error",
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "flamboyan-ai-attribution-audit",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`${path} -> HTTP ${response.status}`);
  return response.json();
}

function originRepo() {
  try {
    const url = execFileSync("git", ["remote", "get-url", "origin"], {
      encoding: "utf8",
    }).trim();
    const match = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/.exec(url);
    return match ? `${match[1]}/${match[2]}` : null;
  } catch {
    return null;
  }
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : (process.argv[index + 1] ?? null);
}

function block(overrides = {}) {
  return `${HEADING}

- AI: ${overrides.ai ?? "tidak ada"}
- Model: ${overrides.model ?? "-"}
- Perangkat: ${overrides.device ?? "Windows 11, x64, Node v24.21.0"}
- Operator: ${overrides.operator ?? "@ariefmavlana"}
- Peran AI: ${overrides.role ?? "tidak ada"}
`;
}

const FIXTURES = [
  {
    name: "blok lengkap tanpa temuan",
    pull: { user: { login: "ariefmavlana" }, head: { ref: "feat/bersih" }, body: block() },
    errors: 0,
    warns: 0,
  },
  {
    name: "blok hilang",
    pull: { user: { login: "ajejulians" }, head: { ref: "fix/x" }, body: "## Masalah dan hasil\n" },
    errors: 1,
    warns: 0,
  },
  {
    name: "kolom Model dan Perangkat kosong",
    pull: {
      user: { login: "ajejulians" },
      head: { ref: "fix/x" },
      body: block({ model: "", device: "" }),
    },
    errors: 2,
    warns: 0,
  },
  {
    name: "alamat IP pada kolom Perangkat",
    pull: {
      user: { login: "ajejulians" },
      head: { ref: "fix/x" },
      body: block({ device: "Windows 11, x64, 192.168.1.7" }),
    },
    errors: 1,
    warns: 0,
  },
  {
    name: "deklarasi tidak cocok dengan prefix branch",
    pull: { user: { login: "ajejulians" }, head: { ref: "codex/tiket" }, body: block() },
    errors: 0,
    warns: 1,
  },
  {
    name: "author PR adalah akun bot",
    pull: {
      user: { login: "cursor[bot]" },
      head: { ref: "fix/x" },
      body: block({ ai: "Cursor 2.0", model: "GPT-5.6", role: "implementasi" }),
    },
    errors: 0,
    warns: 1,
  },
  {
    name: "placeholder tidak meloloskan atribusi AI",
    pull: { head: { ref: "fix/x" }, body: block({ ai: "Codex", model: "-", device: "-", operator: "-", role: "-" }) },
    errors: 7,
    warns: 0,
  },
  {
    name: "IPv6 pada perangkat ditolak tanpa memantulkan alamat",
    pull: { head: { ref: "fix/x" }, body: block({ device: "Windows 11, x64, 2001:db8::1" }) },
    errors: 1,
    warns: 0,
  },
  {
    name: "versi runtime empat komponen bukan alamat IP",
    pull: { head: { ref: "fix/x" }, body: block({ device: "Windows 11, x64, Runtime 1.2.3.4, Tool v1.2.3.4" }) },
    errors: 0,
    warns: 0,
  },
];

function selfTest() {
  let failed = 0;
  for (const fixture of FIXTURES) {
    const findings = auditPull(fixture.pull);
    const errors = findings.filter((finding) => finding.level === "error").length;
    const warns = findings.filter((finding) => finding.level === "warn").length;
    const noAddressEcho = !findings.some((finding) => containsAddress(finding.message));
    const ok = errors === fixture.errors && warns === fixture.warns && noAddressEcho;
    if (!ok) failed += 1;
    const detail = findings.map((finding) => finding.code).join(", ") || "tanpa temuan";
    console.log(
      `${ok ? "PASS" : "FAIL"} ${fixture.name} (error ${errors}/${fixture.errors}, peringatan ${warns}/${fixture.warns}) [${detail}]`,
    );
  }
  console.log(`${FIXTURES.length - failed}/${FIXTURES.length} fixture lulus.`);
  process.exitCode = failed > 0 ? 1 : 0;
}

async function main() {
  const token = process.env.GITHUB_TOKEN ?? "";
  const repo = option("--repo") ?? originRepo();
  if (!repo) {
    throw new Error(
      "Tentukan repository dengan --repo <owner/name> atau jalankan dari clone dengan remote origin.",
    );
  }
  if (!/^[a-z\d_.-]+\/[a-z\d_.-]+$/i.test(repo)) throw new Error("Repository harus berupa owner/name.");
  const single = option("--pr");
  if (single !== null && !/^[1-9]\d*$/.test(single)) throw new Error("Nomor PR harus integer positif.");
  const pulls = [];
  if (single) {
    pulls.push(await github(`/repos/${repo}/pulls/${single}`, token));
  } else {
    for (let page = 1; ; page += 1) {
      const batch = await github(`/repos/${repo}/pulls?state=open&per_page=100&page=${page}`, token);
      if (!Array.isArray(batch)) throw new Error("Respons daftar PR tidak valid; audit dibatalkan.");
      pulls.push(...batch);
      if (batch.length < 100) break;
    }
  }

  const report = pulls.map((pull) => ({
    number: pull.number,
    title: pull.title,
    author: pull.user?.login ?? null,
    head: pull.head?.ref ?? null,
    findings: auditPull(pull),
  }));

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ repo, checked: report.length, report }, null, 2));
  } else {
    for (const entry of report) {
      const errors = entry.findings.filter((finding) => finding.level === "error").length;
      const warns = entry.findings.filter((finding) => finding.level === "warn").length;
      const verdict = errors + warns === 0 ? "OK" : `${errors} error, ${warns} peringatan`;
      console.log(`#${entry.number} ${verdict} - ${entry.title}`);
      console.log(`  author=${entry.author} head=${entry.head}`);
      for (const finding of entry.findings) {
        console.log(`  [${finding.level}] ${finding.code}: ${finding.message}`);
      }
    }
    console.log(`Diperiksa ${report.length} PR pada ${repo}.`);
  }

  process.exitCode = report.some((entry) =>
    entry.findings.some((finding) => finding.level === "error"),
  )
    ? 1
    : 0;
}

if (process.argv.includes("--self-test")) {
  selfTest();
} else {
  await main();
}
