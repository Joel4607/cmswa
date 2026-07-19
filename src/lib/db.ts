import recordsJson from '../data/records.json';

export type SheetData = {
  headers: any[];
  rows: any[][];
};

export type GroupedRecords = Record<string, Record<string, Record<string, Record<string, SheetData>>>>;

const fallbackRecords = recordsJson as any;

export function getDB(contextOrAstro: any): D1Database | undefined {
  const runtime = contextOrAstro?.locals?.runtime;
  return runtime?.env?.DB;
}

export async function getGroupedRecords(db?: D1Database): Promise<GroupedRecords> {
  if (!db) return fallbackRecords as GroupedRecords;
  try {
    const { results } = await db.prepare('SELECT module, year, file, sheet, headers, rows FROM sheets ORDER BY id').all();
    const grouped: GroupedRecords = {};
    for (const row of results as any[]) {
      if (!grouped[row.module]) grouped[row.module] = {};
      if (!grouped[row.module][row.year]) grouped[row.module][row.year] = {};
      if (!grouped[row.module][row.year][row.file]) grouped[row.module][row.year][row.file] = {};
      grouped[row.module][row.year][row.file][row.sheet] = {
        headers: JSON.parse(row.headers),
        rows: JSON.parse(row.rows)
      };
    }
    return grouped;
  } catch (err) {
    console.error('D1 read failed; falling back to JSON records', err);
    return fallbackRecords as GroupedRecords;
  }
}

export async function getModuleSheets(db: D1Database | undefined, module: string) {
  if (!db) return [] as { id: number; year: string; file: string; sheet: string; data: SheetData }[];
  const { results } = await db
    .prepare('SELECT id, year, file, sheet, headers, rows FROM sheets WHERE module = ? ORDER BY year, file, sheet')
    .bind(module)
    .all();
  return (results as any[]).map(row => ({
    id: row.id,
    year: row.year,
    file: row.file,
    sheet: row.sheet,
    data: { headers: JSON.parse(row.headers), rows: JSON.parse(row.rows) }
  }));
}

export async function getModuleRecords(db: D1Database | undefined, module: string): Promise<GroupedRecords[string] | undefined> {
  const all = await getGroupedRecords(db);
  return all[module];
}

export async function getSheet(db: D1Database | undefined, id: number): Promise<{ id: number; module: string; year: string; file: string; sheet: string; data: SheetData } | null> {
  if (!db) return null;
  const row: any = await db.prepare('SELECT * FROM sheets WHERE id = ?').bind(id).first();
  if (!row) return null;
  return {
    id: row.id,
    module: row.module,
    year: row.year,
    file: row.file,
    sheet: row.sheet,
    data: { headers: JSON.parse(row.headers), rows: JSON.parse(row.rows) }
  };
}

export async function upsertSheet(
  db: D1Database,
  payload: { module: string; year: string; file: string; sheet: string; headers: any[]; rows: any[][] }
) {
  const headersJson = JSON.stringify(payload.headers);
  const rowsJson = JSON.stringify(payload.rows);
  const { success } = await db
    .prepare(
      'INSERT INTO sheets (module, year, file, sheet, headers, rows) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(module, year, file, sheet) DO UPDATE SET headers = excluded.headers, rows = excluded.rows, updated_at = CURRENT_TIMESTAMP'
    )
    .bind(payload.module, payload.year, payload.file, payload.sheet, headersJson, rowsJson)
    .run();
  return success;
}

export async function updateSheet(db: D1Database, id: number, headers: any[], rows: any[][]) {
  const { success } = await db
    .prepare('UPDATE sheets SET headers = ?, rows = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(JSON.stringify(headers), JSON.stringify(rows), id)
    .run();
  return success;
}

export async function deleteSheet(db: D1Database, id: number) {
  const { success } = await db.prepare('DELETE FROM sheets WHERE id = ?').bind(id).run();
  return success;
}

export async function seedFromRecords(db: D1Database) {
  const all: GroupedRecords = fallbackRecords;
  const entries: any[] = [];
  for (const module of Object.keys(all)) {
    if (module === 'meta') continue;
    const mod = all[module];
    for (const year of Object.keys(mod)) {
      for (const file of Object.keys(mod[year])) {
        for (const sheet of Object.keys(mod[year][file])) {
          entries.push({ module, year, file, sheet, ...mod[year][file][sheet] });
        }
      }
    }
  }
  for (let i = 0; i < entries.length; i += 50) {
    const batch = entries.slice(i, i + 50);
    await db.batch(
      batch.map(e =>
        db
          .prepare(
            'INSERT INTO sheets (module, year, file, sheet, headers, rows) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(module, year, file, sheet) DO UPDATE SET headers = excluded.headers, rows = excluded.rows, updated_at = CURRENT_TIMESTAMP'
          )
          .bind(e.module, e.year, e.file, e.sheet, JSON.stringify(e.headers), JSON.stringify(e.rows))
      )
    );
  }
  return entries.length;
}
