#!/usr/bin/env node
// Audit lokal untuk baris "Atribusi AI:" yang diwajibkan AGENTS.md.
// GitHub Actions tidak dipakai: jalankan manual sebelum review atau sebagai gate lokal.
//
// Penggunaan:
//   node scripts/ai-attribution-audit.mjs                 # semua PR terbuka pada remote origin
//   node scripts/ai-attribution-audit.mjs --pr 48         # satu PR
//   node scripts/ai-attribution-audit.mjs --repo a/b      # repository lain
//   node scripts/ai-attribution-audit.mjs --json          # keluaran mesin
//   node scripts/ai-attribution-audit.mjs --self-test     # fixture parser, tanpa jaringan
//   node --test scripts/ai-attribution-audit.test.mjs     # uji CLI lewat child process
//
// GITHUB_TOKEN opsional; tanpa token pemeriksaan PR publik dibatasi kuota anonim.
import { execFileSync } from "node:child_process";
import { isIP } from "node:net";
import process from "node:process";

// Baris atribusi, boleh berupa butir daftar.
const LINE = /^[ \t]*(?:[-*][ \t]*)?Atribusi AI[ \t]*:[ \t]*(.+?)[ \t]*$/im;
const NO_AGENT = ["tidak ada", "none"];
const PLACEHOLDER = /^(?:[-–—]+|n\/?a|tbd|todo|unknown|belum diisi)$/i;
const MODEL = /\bmodel\b/i;
const INTERFACE = /\b(?:cli|desktop|app|apps|ide|extension|extensi|ekstensi|plugin)\b/i;
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

export function parseAttribution(body) {
  const match = LINE.exec(String(body ?? ""));
  return match ? match[1].trim() : null;
}

export function inferredAgent(ref) {
  const prefix = String(ref ?? "").split("/")[0].toLowerCase();
  return AGENT_PREFIXES.includes(prefix) ? prefix : null;
}

function containsAddress(text) {
  for (const match of text.matchAll(/[^\s,;()[\]<>="'/]+/g)) {
    let candidate = match[0].split("%")[0].replace(/\.$/, "");
    if (!isIP(candidate) && /^[\d.]+:\d+$/.test(candidate)) candidate = candidate.split(":")[0];
    const family = isIP(candidate);
    if (family === 6) return true;
    if (family === 4) {
      // An explicitly labelled runtime/build version is not an address.
      const prefix = text.slice(0, match.index).trimEnd();
      if (!/\b(?:v|version|versi|build|runtime)\s*$/i.test(prefix)) return true;
    }
  }
  return false;
}

export function auditPull(pull) {
  const declared = parseAttribution(pull.body);
  if (declared === null) {
    return [
      {
        level: "error",
        code: "atribusi-hilang",
        message: 'Baris "Atribusi AI:" tidak ada pada summary PR.',
      },
    ];
  }
  // Placeholder template memakai kurung sudut sehingga tidak lolos sebagai deklarasi.
  if (!declared || PLACEHOLDER.test(declared) || /[<>]/.test(declared)) {
    return [
      {
        level: "error",
        code: "atribusi-kosong",
        message: 'Baris "Atribusi AI:" kosong atau masih berisi placeholder.',
      },
    ];
  }

  const findings = [];
  const declaredNone = NO_AGENT.includes(declared.toLowerCase().replace(/\.$/, "").trim());
  if (!declaredNone) {
    if (!MODEL.test(declared)) {
      findings.push({
        level: "error",
        code: "model-hilang",
        message: 'Baris "Atribusi AI:" harus menyebut model yang dipakai.',
      });
    }
    if (!INTERFACE.test(declared)) {
      findings.push({
        level: "error",
        code: "antarmuka-hilang",
        message: 'Baris "Atribusi AI:" harus menyebut antarmukanya: CLI, desktop, atau app.',
      });
    }
  }
  if (containsAddress(declared)) {
    findings.push({
      level: "error",
      code: "perangkat-pribadi",
      message: 'Baris "Atribusi AI:" memuat alamat IP yang disamarkan; hapus alamat dan gunakan hanya fakta teknis non-pribadi.',
    });
  }

  const agent = inferredAgent(pull.head?.ref);
  if (declaredNone && agent) {
    findings.push({
      level: "warn",
      code: "deklarasi-tidak-cocok",
      message: `"Atribusi AI" diisi "tidak ada" sedangkan prefix branch "${agent}/" menandakan agen.`,
    });
  }
  if (!declaredNone && agent && !declared.toLowerCase().includes(agent)) {
    findings.push({
      level: "warn",
      code: "deklarasi-tidak-cocok",
      message: `Deklarasi berbeda dari sinyal prefix branch "${agent}/"; periksa secara manual.`,
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

const line = (value) => `Atribusi AI: ${value}`;
const VALID = "Command Code CLI 1.84.0, model deepseek-v4.1-flash, CLI";

const FIXTURES = [
  {
    name: "baris lengkap tanpa temuan",
    pull: { user: { login: "ariefmavlana" }, head: { ref: "feat/bersih" }, body: line(VALID) },
    errors: 0,
    warns: 0,
  },
  {
    name: "baris atribusi hilang",
    pull: { user: { login: "ajejulians" }, head: { ref: "fix/x" }, body: "## Masalah dan hasil\n" },
    errors: 1,
    warns: 0,
  },
  {
    name: "tanpa AI ditulis tidak ada",
    pull: { user: { login: "ajejulians" }, head: { ref: "fix/x" }, body: line("tidak ada") },
    errors: 0,
    warns: 0,
  },
  {
    name: "model tidak disebut",
    pull: { user: { login: "ajejulians" }, head: { ref: "fix/x" }, body: line("Command Code CLI 1.84.0, CLI") },
    errors: 1,
    warns: 0,
  },
  {
    name: "antarmuka tidak disebut",
    pull: { user: { login: "ajejulians" }, head: { ref: "fix/x" }, body: line("Command Code 1.84.0, model deepseek-v4.1-flash") },
    errors: 1,
    warns: 0,
  },
  {
    name: "placeholder template belum diisi",
    pull: {
      head: { ref: "fix/x" },
      body: line('<nama AI dan versi>, model <model>, <CLI/desktop/app> - tulis "tidak ada" bila tidak memakai AI'),
    },
    errors: 1,
    warns: 0,
  },
  {
    name: "alamat IPv6 ditolak tanpa memantulkan alamat",
    pull: { head: { ref: "fix/x" }, body: line(`${VALID} (host 2001:db8::1)`) },
    errors: 1,
    warns: 0,
  },
  {
    name: "versi runtime empat komponen bukan alamat IP",
    pull: { head: { ref: "fix/x" }, body: line("Command Code 1.84.0, model Runtime 1.2.3.4, desktop") },
    errors: 0,
    warns: 0,
  },
  {
    name: "deklarasi tidak cocok dengan prefix branch",
    pull: { user: { login: "ajejulians" }, head: { ref: "codex/tiket" }, body: line("tidak ada") },
    errors: 0,
    warns: 1,
  },
  {
    name: "author PR adalah akun bot",
    pull: {
      user: { login: "cursor[bot]" },
      head: { ref: "fix/x" },
      body: line("Cursor 2.0, model gpt-5.6, desktop"),
    },
    errors: 0,
    warns: 1,
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
