import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("./ai-attribution-audit.mjs", import.meta.url));
// Only the external GitHub response is replaced; the actual CLI, parser,
// pagination, output and exit status all run unchanged in the child process.
const providerFixture = `
const validBody = '## Atribusi AI dan perangkat\\n- AI: tidak ada\\n- Model: -\\n- Perangkat: Windows 11, x64, Runtime 1.2.3.4\\n- Operator: @operator\\n- Peran AI: tidak ada'.replaceAll('\\\\n', '\\n');
globalThis.fetch = async (input) => {
  const url = new URL(input);
  if (url.origin !== 'https://api.github.com' || url.pathname !== '/repos/fixture/repo/pulls') throw Error('Unexpected external request');
  const page = url.searchParams.get('page');
  if (page === '1') return Response.json(Array.from({length:100}, (_, i) => ({number:i+1, title:'Fixture', head:{ref:'fix/fixture'}, user:{login:'operator'}, body:validBody})));
  if (page === '2') {
    if (process.env.PR_AUDIT_FIXTURE_FAIL === '1') return new Response('', {status:503});
    return Response.json([{number:101, title:'Fixture', head:{ref:'fix/fixture'}, user:{login:'operator'}, body:validBody.replace('Runtime 1.2.3.4', '2001:db8::1')}]);
  }
  throw Error('Unexpected page');
};`;

function audit(fail = false) {
  const result = spawnSync(process.execPath, [
    "--import", `data:text/javascript,${encodeURIComponent(providerFixture)}`,
    script, "--repo", "fixture/repo", "--json",
  ], {
    encoding: "utf8", timeout: 10000,
    env: { ...process.env, GITHUB_TOKEN: "", PR_AUDIT_FIXTURE_FAIL: fail ? "1" : "0" },
  });
  assert.ifError(result.error);
  return result;
}

test("CLI audits beyond 100 PRs and redacts the address in a rejected PR", () => {
  const result = audit();
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.equal(report.checked, 101);
  assert.deepEqual(report.report[0].findings, []);
  assert.equal(report.report[100].findings[0].code, "perangkat-pribadi");
  assert.ok(!`${result.stdout}${result.stderr}`.includes("2001:db8::1"));
});

test("CLI fails without a partial success report when a later GitHub page fails", () => {
  const result = audit(true);
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout.trim(), "");
  assert.match(result.stderr, /HTTP 503/);
});
