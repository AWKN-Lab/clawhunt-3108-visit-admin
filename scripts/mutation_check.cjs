#!/usr/bin/env node
/**
 * 变异自证：证明测试真能抓住回归，而不是只会变绿。
 * A 相：全量测试通过（14 项）。
 * B1 相：maskPhone 改为返回原号 -> AC2 测试必须变红。
 * B2 相：批量重试只发第一条请求 -> AC3 测试必须变红。
 * 每相变异后恢复文件并核对 SHA256 与变异前一致。
 * C 相：全量测试再次通过。
 * 任一预期不成立即退出非零并打印 MUTATION CHECK: FAIL。
 */
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = join(__dirname, '..');

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function runVitest(args) {
  const r = spawnSync('npx', ['vitest', 'run', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 300000,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/Tests\s+(\d+) passed/);
  return { code: r.status, passed: m ? Number(m[1]) : 0, out };
}

function fail(msg) {
  console.error(`MUTATION CHECK: FAIL - ${msg}`);
  process.exit(1);
}

const masking = join(ROOT, 'src/lib/masking.ts');
const api = join(ROOT, 'src/lib/api.ts');
const maskingSha = sha256(masking);
const apiSha = sha256(api);

// A 相
console.log('=== A 相：全量测试 ===');
const a = runVitest([]);
console.log(`A 相：exit=${a.code}，通过 ${a.passed} 项`);
if (a.code !== 0 || a.passed !== 14) fail(`A 相应全过 14 项，实得 exit=${a.code} passed=${a.passed}`);

// B1 相：打码失效，AC2 必须变红
console.log('=== B1 相：maskPhone 返回原号，AC2 应变红 ===');
let src = readFileSync(masking, 'utf8');
writeFileSync(
  masking,
  src.replace(
    "if (/^\\d{11}$/.test(t)) return `${t.slice(0, 3)}****${t.slice(7)}`;",
    "if (/^\\d{11}$/.test(t)) return t; // MUTATION B1",
  ),
);
const b1 = runVitest(['tests/test_ac2_masking.test.tsx']);
console.log(`B1 相：exit=${b1.code}（预期非 0）`);
writeFileSync(masking, src);
if (sha256(masking) !== maskingSha) fail('B1 相恢复后 masking SHA 不一致');
if (b1.code === 0) fail('B1 相 AC2 测试未变红：打码失效未被抓住');

// B2 相：批量重试只发第一条，AC3 必须变红
console.log('=== B2 相：批量重试只发第一条，AC3 应变红 ===');
src = readFileSync(api, 'utf8');
writeFileSync(
  api,
  src.replace(
    '  for (const id of ids) {\n    await retrySyncError(id);\n  }',
    '  for (const id of ids.slice(0, 1)) {\n    await retrySyncError(id); // MUTATION B2\n  }',
  ),
);
const b2 = runVitest(['tests/test_ac3_batch_retry.test.tsx']);
console.log(`B2 相：exit=${b2.code}（预期非 0）`);
writeFileSync(api, src);
if (sha256(api) !== apiSha) fail('B2 相恢复后 api SHA 不一致');
if (b2.code === 0) fail('B2 相 AC3 测试未变红：批量重试少发未被抓住');

// C 相
console.log('=== C 相：全量测试（恢复后）===');
const c = runVitest([]);
console.log(`C 相：exit=${c.code}，通过 ${c.passed} 项`);
if (c.code !== 0 || c.passed !== 14) fail(`C 相应全过 14 项，实得 exit=${c.code} passed=${c.passed}`);

console.log('MUTATION CHECK: PASS');
console.log(`masking SHA256（变异前后一致）: ${maskingSha}`);
console.log(`api SHA256（变异前后一致）: ${apiSha}`);
