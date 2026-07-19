import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const records = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/records.json'), 'utf8'));

const inserts = [];
for (const module of Object.keys(records)) {
  if (module === 'meta') continue;
  const mod = records[module];
  for (const year of Object.keys(mod)) {
    for (const file of Object.keys(mod[year])) {
      for (const sheet of Object.keys(mod[year][file])) {
        const data = mod[year][file][sheet];
        const values = [
          module, year, file, sheet,
          JSON.stringify(data.headers),
          JSON.stringify(data.rows)
        ].map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ');
        inserts.push(`INSERT INTO sheets (module, year, file, sheet, headers, rows) VALUES (${values}) ON CONFLICT(module, year, file, sheet) DO UPDATE SET headers = excluded.headers, rows = excluded.rows, updated_at = CURRENT_TIMESTAMP;`);
      }
    }
  }
}

const tmpDir = path.join(__dirname, '../tmp');
fs.mkdirSync(tmpDir, { recursive: true });

const batches = [];
let current = [];
let currentLen = 0;
const maxBatchLen = 60000;

for (const stmt of inserts) {
  if (currentLen + stmt.length > maxBatchLen && current.length > 0) {
    batches.push(current);
    current = [];
    currentLen = 0;
  }
  current.push(stmt);
  currentLen += stmt.length;
}
if (current.length) batches.push(current);

let seeded = 0;
for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];
  const file = path.join(tmpDir, `seed-batch-${i}.sql`);
  fs.writeFileSync(file, batch.join('\n'));
  console.log(`Batch ${i + 1}/${batches.length}: ${batch.length} sheets`);

  const result = spawnSync('npx', ['wrangler', 'd1', 'execute', 'cmswa-db', '--remote', '--file', file], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  });

  if (result.status !== 0) {
    console.error(`Batch ${i + 1} failed`);
    process.exit(1);
  }
  seeded += batch.length;
}

console.log(`Seeded ${seeded} sheets`);
