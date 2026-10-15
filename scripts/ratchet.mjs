import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const baselinePath = 'ratchet-baseline.json';
const roots = ['src', 'tests', 'scripts'];
const exts = new Set(['.ts', '.mts', '.js', '.mjs', '.astro']);

function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : files(p);
    return exts.has(extname(e.name)) ? [p] : [];
  });
}

const count = (text, re) => (text.match(re) ?? []).length;
const all = roots
  .flatMap(files)
  .filter((f) => resolve(f) !== resolve('scripts/ratchet.mjs'));

const metrics = { tests: 0, suppressions: 0, typeEscapes: 0 };
for (const f of all) {
  const text = readFileSync(f, 'utf8');
  if (/\.(test|spec)\./.test(f))
    metrics.tests += count(
      text,
      /^\s*(?:it|test)(?:\.(?!skip|todo|fixme)\w+)*\s*\(/gm,
    );
  metrics.suppressions += count(
    text,
    /eslint-disable|@ts-ignore|@ts-expect-error|@ts-nocheck|prettier-ignore/g,
  );
  metrics.typeEscapes += count(
    text,
    /:\s*any\b|\bas any\b|\bas unknown as\b|<any>/g,
  );
}

if (process.argv.includes('--update')) {
  writeFileSync(baselinePath, JSON.stringify(metrics, null, 2) + '\n');
  console.log('Baseline updated:', metrics);
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error(
    `Missing ${baselinePath}; run: node scripts/ratchet.mjs --update`,
  );
  process.exit(1);
}
const base = JSON.parse(readFileSync(baselinePath, 'utf8'));
const failures = [];
if (metrics.tests < base.tests)
  failures.push(`test-ratchet: tests fell ${base.tests} -> ${metrics.tests}`);
if (metrics.suppressions > base.suppressions)
  failures.push(
    `suppress-ratchet: suppressions rose ${base.suppressions} -> ${metrics.suppressions}`,
  );
if (metrics.typeEscapes > base.typeEscapes)
  failures.push(
    `type-ratchet: type escapes rose ${base.typeEscapes} -> ${metrics.typeEscapes}`,
  );
console.log('Current:', metrics, 'Baseline:', base);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Ratchets hold.');
