export function asMoney(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : null;
  const s = String(v).replace(/[GH₵$,\s]/g, '').replace(/[–—]/g, '-').trim();
  if (s === '' || s === '-') return null;
  const n = Number(s);
  return isNaN(n) ? null : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function toNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const s = String(v).replace(/[GH₵$,\s]/g, '').replace(/[–—]/g, '-').trim();
  if (s === '' || s === '-') return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
}

export const MONTH_NAMES = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

export function isMonthHeader(h: unknown) {
  const s = String(h ?? '').toUpperCase();
  return MONTH_NAMES.some(m => s.includes(m));
}

export function colIndex(headers: any[], keys: string[]) {
  for (let i = headers.length - 1; i >= 0; i--) {
    const h = String(headers[i] ?? '').toUpperCase();
    if (keys.some(k => h.includes(k.toUpperCase()))) return i;
  }
  return -1;
}

export function sumColumn(rows: any[], headers: any[], keys: string[], excludeTotalRow = true) {
  const idx = colIndex(headers, keys);
  if (idx < 0) return 0;
  let total = 0;
  for (const row of rows) {
    if (excludeTotalRow && String(row[0] ?? '').toUpperCase().includes('TOTAL')) continue;
    const n = toNumber(row[idx]);
    if (n !== null) total += n;
  }
  return total;
}

export function sumMatchedColumns(rows: any[], headers: any[], keys: string[], excludeTotalRow = true) {
  const indexes: number[] = [];
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] ?? '').toUpperCase();
    if (keys.some(k => h.includes(k.toUpperCase()))) indexes.push(i);
  }
  if (indexes.length === 0) return 0;
  let total = 0;
  for (const row of rows) {
    if (excludeTotalRow && String(row[0] ?? '').toUpperCase().includes('TOTAL')) continue;
    for (const idx of indexes) {
      const n = toNumber(row[idx]);
      if (n !== null) total += n;
    }
  }
  return total;
}
