import { createHmac } from "node:crypto";
import { writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const duration = Number(process.env.LOAD_DURATION_SECONDS ?? 900);
const rate = Number(process.env.LOAD_REQUESTS_PER_SECOND ?? 20);
const api = new URL(process.env.LOAD_API_BASE ?? "http://127.0.0.1:8001");
const web = new URL(process.env.LOAD_WEB_BASE ?? "http://127.0.0.1:3101");
if (
  ![api, web].every((url) =>
    ["127.0.0.1", "localhost"].includes(url.hostname),
  ) ||
  !Number.isInteger(duration) ||
  !Number.isInteger(rate) ||
  duration < 1 ||
  duration > 900 ||
  rate < 1 ||
  rate > 20
)
  throw new Error("Only bounded local acceptance targets are allowed");
const secret = process.env.API_PROXY_SECRET ?? "";
if (secret.length < 32)
  throw new Error(
    "Private proxy signing key is required; never put it in arguments",
  );
const cases = [
  ["api-list", api, "/api/v1/properties?q=Load%20Fixture&sort=price_asc"],
  ["api-detail", api, "/api/v1/properties/load-fixture-1"],
  ["ssr-list", web, "/properti?q=Load%20Fixture&sort=price_asc"],
  ["ssr-detail", web, "/properti/load-fixture-1"],
];
const results = Object.fromEntries(
  cases.map(([name]) => [name, { latencies: [], errors: 0, statuses: {} }]),
);
const active = new Set();
const start = performance.now();
let skipped = 0;
let progress = 0;
async function request(index) {
  const [name, base, path] = cases[index % cases.length];
  const ip = `198.51.100.${(Math.floor(index / 4) % 200) + 1}`;
  const time = String(Math.floor(Date.now() / 1000));
  const url = new URL(path, base);
  const headers = name.startsWith("api")
    ? {
        "X-Flamboyan-Client-IP": ip,
        "X-Flamboyan-Proxy-Time": time,
        "X-Flamboyan-Proxy-Signature": createHmac("sha256", secret)
          .update(`GET\n${url.pathname}\n${time}\n${ip}`)
          .digest("hex"),
      }
    : { "X-Forwarded-For": ip };
  const began = performance.now();
  const result = results[name];
  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(5000),
    });
    const body = await response.text();
    result.statuses[response.status] =
      (result.statuses[response.status] ?? 0) + 1;
    if (response.status !== 200 || !body.includes("Load Fixture"))
      result.errors++;
  } catch {
    result.errors++;
  }
  result.latencies.push(performance.now() - began);
}
for (let index = 0; index < duration * rate; index++) {
  await sleep(Math.max(0, (index * 1000) / rate - (performance.now() - start)));
  if (active.size >= 128) {
    skipped++;
    continue;
  }
  const task = request(index);
  active.add(task);
  void task.finally(() => active.delete(task));
  const minutes = Math.floor((performance.now() - start) / 60000);
  if (minutes > progress) {
    progress = minutes;
    process.stdout.write(
      JSON.stringify({
        minute: minutes,
        scheduled: index + 1,
        active: active.size,
        skipped,
      }) + "\n",
    );
  }
}
await Promise.all(active);
const wallSeconds = (performance.now() - start) / 1000;
let total = 0;
let errors = skipped;
const summary = Object.fromEntries(
  Object.entries(results).map(([name, result]) => {
    result.latencies.sort((a, b) => a - b);
    const percentile = (fraction) =>
      Math.round(
        (result.latencies[
          Math.max(0, Math.ceil(result.latencies.length * fraction) - 1)
        ] ?? 0) * 100,
      ) / 100;
    total += result.latencies.length;
    errors += result.errors;
    return [
      name,
      {
        requests: result.latencies.length,
        errors: result.errors,
        statuses: result.statuses,
        p50_ms: percentile(0.5),
        p95_ms: percentile(0.95),
        p99_ms: percentile(0.99),
        max_ms: percentile(1),
      },
    ];
  }),
);
const report = {
  runtime: process.version,
  duration_target_seconds: duration,
  scheduled_rate: rate,
  wall_seconds: wallSeconds,
  achieved_requests_per_second: total / wallSeconds,
  total_requests: total,
  errors,
  skipped,
  error_percent: (errors / (total + skipped)) * 100,
  scenarios: summary,
  limitation:
    "Synthetic local fixture / PHP CLI server / Node production SSR. Not proof of hosting availability, field Web Vitals or production capacity.",
};
writeFileSync(
  process.env.LOAD_REPORT_FILE ?? ".tools/acceptance-load-report.json",
  JSON.stringify(report, null, 2) + "\n",
);
process.stdout.write(JSON.stringify(report, null, 2) + "\n");
if (
  errors / (total + skipped) >= 0.01 ||
  Object.entries(summary).some(
    ([name, item]) => item.p95_ms > (name.startsWith("api") ? 500 : 1500),
  )
)
  process.exitCode = 1;
