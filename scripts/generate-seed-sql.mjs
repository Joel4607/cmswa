import fs from 'fs';
import records from '../src/data/records.json' with { type: 'json' };

fs.mkdirSync('seeds', { recursive: true });
let sql = 'BEGIN TRANSACTION;\n';
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
        sql += `INSERT INTO sheets (module, year, file, sheet, headers, rows) VALUES (${values}) ON CONFLICT(module, year, file, sheet) DO UPDATE SET headers = excluded.headers, rows = excluded.rows, updated_at = CURRENT_TIMESTAMP;\n`;
      }
    }
  }
}
sql += 'COMMIT;\n';
fs.writeFileSync('seeds/seed.sql', sql);
console.log('seeds/seed.sql written', (sql.length / 1024 / 1024).toFixed(2), 'MB');
