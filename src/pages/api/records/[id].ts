import type { APIRoute } from 'astro';
import { isAdmin, isAdminPasswordSet } from '../../../lib/auth';
import { getDB, getSheet, updateSheet, deleteSheet } from '../../../lib/db';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = getDB({ locals });
  if (!db) return new Response('D1 database not bound', { status: 500 });
  const id = Number(params.id);
  if (isNaN(id)) return new Response('Invalid id', { status: 400 });
  const sheet = await getSheet(db, id);
  if (!sheet) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(sheet), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const PUT: APIRoute = async ({ params, request, locals, cookies }) => {
  const env = locals.runtime.env;
  if (!isAdminPasswordSet(env) || !(await isAdmin({ cookies }, env))) {
    return new Response('Unauthorized', { status: 401 });
  }
  const db = getDB({ locals });
  if (!db) return new Response('D1 database not bound', { status: 500 });
  const id = Number(params.id);
  if (isNaN(id)) return new Response('Invalid id', { status: 400 });
  try {
    const body = await request.json();
    const { headers, rows } = body;
    if (!Array.isArray(headers) || !Array.isArray(rows)) {
      return new Response('Invalid payload', { status: 400 });
    }
    await updateSheet(db, id, headers, rows);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(err.message || 'Bad request', { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ params, locals, cookies }) => {
  const env = locals.runtime.env;
  if (!isAdminPasswordSet(env) || !(await isAdmin({ cookies }, env))) {
    return new Response('Unauthorized', { status: 401 });
  }
  const db = getDB({ locals });
  if (!db) return new Response('D1 database not bound', { status: 500 });
  const id = Number(params.id);
  if (isNaN(id)) return new Response('Invalid id', { status: 400 });
  await deleteSheet(db, id);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
