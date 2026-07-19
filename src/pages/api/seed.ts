import type { APIRoute } from 'astro';
import { isAdmin, isAdminPasswordSet } from '../../lib/auth';
import { getDB, seedFromRecords } from '../../lib/db';

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const env = locals.runtime.env;
  if (!isAdminPasswordSet(env) || !(await isAdmin({ cookies }, env))) {
    return new Response('Unauthorized', { status: 401 });
  }
  const db = getDB({ locals });
  if (!db) {
    return new Response('D1 database not bound', { status: 500 });
  }
  const count = await seedFromRecords(db);
  return new Response(JSON.stringify({ seeded: count }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
