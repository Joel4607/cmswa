import type { APIRoute } from 'astro';
import { isAdmin, isAdminPasswordSet } from '../../../lib/auth';
import { getDB, upsertSheet } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const env = locals.runtime.env;
  if (!isAdminPasswordSet(env) || !(await isAdmin({ cookies }, env))) {
    return new Response('Unauthorized', { status: 401 });
  }
  const db = getDB({ locals });
  if (!db) return new Response('D1 database not bound', { status: 500 });
  try {
    const body = await request.json();
    const { module, year, file, sheet, headers, rows } = body;
    if (!module || !year || !file || !sheet || !Array.isArray(headers) || !Array.isArray(rows)) {
      return new Response('Invalid payload', { status: 400 });
    }
    await upsertSheet(db, { module, year, file, sheet, headers, rows });
    return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(err.message || 'Bad request', { status: 400 });
  }
};
