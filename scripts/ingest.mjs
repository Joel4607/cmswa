import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = 'C:\\Users\\Administrator\\attachments';
const outDir = path.resolve(__dirname, '..', 'src', 'data');
fs.mkdirSync(outDir, { recursive: true });

const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const MONTH_ABBREVS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','SEPT','OCT','NOV','DEC'];
const ALL_MONTH_NAMES = new Set([...MONTHS, ...MONTH_ABBREVS, 'JANUARY ', 'FEBRUARY ', 'MARCH ', 'APRIL ', 'MAY ', 'JUNE ', 'JULY ', 'AUGUST ', 'SEPTEMBER ', 'OCTOBER ', 'NOVEMBER  ', 'DECEMBER  ']);

function collect(dir) {
  const files = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) files.push(...collect(full));
    else if (ent.name.toLowerCase().endsWith('.xlsx')) files.push(full);
  }
  return files;
}

function cleanVal(v) {
  if (v == null) return '';
  if (v instanceof Date) {
    return v.toISOString().split('T')[0];
  }
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  if (s.startsWith('#')) return '';
  if (['-', '', '0'].includes(s)) return '';
  return s;
}

function cleanMoney(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const s = String(v).replace(/[GH₵$,\s]/g, '').replace(/[–—]/g, '-').trim();
  if (s === '' || s === '-') return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
}

function inferYear(name) {
  const m = name.match(/(20\d{2})/);
  return m ? Number(m[1]) : null;
}

function isBlankRow(row) {
  if (!row || row.length === 0) return true;
  return row.every(c => c === '' || c == null);
}

function uniqueHeaders(arr) {
  const seen = {};
  return arr.map(h => {
    const base = (h ?? '').toString().trim() || 'Column';
    seen[base] = (seen[base] ?? 0) + 1;
    return seen[base] > 1 ? `${base}_${seen[base]}` : base;
  });
}

function trimTrailingBlankColumns(headers, rows) {
  let i = headers.length - 1;
  while (i >= 0) {
    const h = String(headers[i] ?? '');
    const isGenerated = h === '' || h === 'Column' || /^Column(_\d+)?$/.test(h);
    const hasData = rows.some(r => r[i] !== '' && r[i] != null);
    if (isGenerated && !hasData) {
      i--;
    } else {
      break;
    }
  }
  return {
    headers: headers.slice(0, i + 1),
    rows: rows.map(r => r.slice(0, i + 1))
  };
}

function getRows(ws) {
  const json = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
  return json.map(r => r.map(c => cleanVal(c))).filter(r => !isBlankRow(r));
}

function isText(v) {
  if (v == null || v === '') return false;
  return String(v).match(/[a-zA-Z]/);
}

function isNumberLike(v) {
  if (v === '' || v == null) return false;
  if (typeof v === 'number') return isFinite(v);
  const s = String(v).replace(/[GH₵$,\s]/g, '').replace(/[–—]/g, '-').trim();
  return s !== '' && !isNaN(Number(s));
}

function isHeaderRow(row) {
  const nonEmpty = row.filter(c => c !== '' && c != null);
  if (nonEmpty.length === 0) return false;
  if (nonEmpty.every(c => typeof c === 'number' || isNumberLike(c))) return false;
  // first cell empty and rest all identical repeated text -> subtotal row
  if (row[0] === '' || row[0] == null) {
    const rest = nonEmpty;
    const distinct = new Set(rest.map(String));
    if (distinct.size === 1 && ['TOTAL', 'GRAND TOTAL'].includes(rest[0])) return false;
  }
  const textCount = row.filter(c => isText(c)).length;
  return textCount > 0;
}

function findHeaderIndex(raw) {
  for (let i = 0; i < Math.min(raw.length, 8); i++) {
    if (isHeaderRow(raw[i])) return i;
  }
  return 0;
}

function parseMonthlySheet(ws, filename, sheetName) {
  const raw = getRows(ws);
  if (raw.length < 2) return { headers: raw[0] ? uniqueHeaders(raw[0]) : [], rows: [] };
  let headerRows = 1;
  if (filename.toLowerCase().includes('buscell') && ALL_MONTH_NAMES.has(sheetName.toUpperCase().trim())) {
    headerRows = 2;
  }
  if (headerRows === 2 && raw.length >= 2) {
    const h0 = raw[0].map(c => String(c ?? '').trim().replace(/\s+/g, ' '));
    const h1 = raw[1].map(c => String(c ?? '').trim().replace(/\s+/g, ' '));
    const maxLen = Math.max(h0.length, h1.length);
    const headers = [];
    for (let i = 0; i < maxLen; i++) {
      const a = h0[i] || '';
      const b = h1[i] || '';
      if (i === 0 && !b && a) {
        headers.push(a);
      } else if (!a) {
        headers.push(b);
      } else if (!b) {
        headers.push(a);
      } else if (a.toUpperCase().includes(b.toUpperCase()) || b.toUpperCase().includes(a.toUpperCase())) {
        headers.push(a);
      } else {
        headers.push(`${b} ${a}`);
      }
    }
    return trimTrailingBlankColumns(uniqueHeaders(headers), raw.slice(2));
  }
  const idx = findHeaderIndex(raw);
  return trimTrailingBlankColumns(uniqueHeaders(raw[idx]), raw.slice(idx + 1));
}

function classify(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('tithers')) return 'tithers';
  if (lower.includes('leaders_tithe')) return 'leadersTithe';
  if (lower.includes('income_and_expenditure')) return 'incomeExpenditure';
  if (lower.includes('momo')) return 'momo';
  if (lower.includes('fuel_records')) return 'fuel';
  if (lower.includes('building_expense')) return 'building';
  if (lower.includes('buscell_meetings') || lower.includes('buscell_pastors')) return 'buscell';
  if (lower.includes('erf_data_calculator')) return 'erf';
  if (lower.includes('data_and_administration')) return 'dataAdmin';
  return 'other';
}

function postProcessSheet(module, meta) {
  const { headers, rows } = meta;
  // MoMo sheets often have merged DEBIT header missing; fix duplicated column names.
  if (module === 'momo' && headers.length >= 6 && (headers[2] === 'Column' || headers[2] === '') && /CREDIT/i.test(headers[5])) {
    headers[0] = 'DEBIT DATE';
    headers[1] = 'DEBIT DETAILS';
    headers[2] = 'DEBIT';
    headers[3] = 'CREDIT DATE';
    headers[4] = 'CREDIT DETAILS';
    headers[5] = 'CREDIT';
  }
  return { headers, rows };
}

function parseWorkbook(file) {
  const wb = xlsx.readFile(file, { cellFormula: false, cellNF: false, cellDates: true });
  const year = inferYear(path.basename(file));
  const module = classify(path.basename(file));
  const result = {};
  for (const sheetName of wb.SheetNames) {
    let meta;
    if (module === 'tithers' || module === 'incomeExpenditure' || module === 'momo' ||
        module === 'dataAdmin' || module === 'building' ||
        (module === 'buscell' && ALL_MONTH_NAMES.has(sheetName.toUpperCase()))) {
      meta = parseMonthlySheet(wb.Sheets[sheetName], path.basename(file), sheetName);
    } else {
      const raw = getRows(wb.Sheets[sheetName]);
      const idx = findHeaderIndex(raw);
      meta = trimTrailingBlankColumns(uniqueHeaders(raw[idx]), raw.slice(idx + 1));
    }
    result[sheetName] = postProcessSheet(module, meta);
  }
  return { module, year, sheets: result };
}

const files = collect(root).sort();
const all = { meta: { generated: new Date().toISOString(), files: files.map(f => path.basename(f)) } };

for (const file of files) {
  try {
    const parsed = parseWorkbook(file);
    if (!all[parsed.module]) all[parsed.module] = {};
    const key = parsed.year || 'unknown';
    if (!all[parsed.module][key]) all[parsed.module][key] = {};
    all[parsed.module][key][path.basename(file)] = parsed.sheets;
    console.log('parsed', path.basename(file), '->', parsed.module, parsed.year);
  } catch (e) {
    console.error('error parsing', file, e.message);
  }
}

const outPath = path.join(outDir, 'records.json');
fs.writeFileSync(outPath, JSON.stringify(all, null, 2));
console.log('wrote', outPath, `${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)} MB`);
