import type { APIRoute } from 'astro';
import { isAdmin, isAdminPasswordSet, setAuthCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const env = locals.runtime.env;
  if (!isAdminPasswordSet(env)) {
    return new Response('Admin password not configured', { status: 500 });
  }

  const data = await request.formData();
  const password = String(data.get('password') || '');

  if (password !== env.ADMIN_PASSWORD) {
    return redirect('/login?error=1', 302);
  }

  await setAuthCookie({ cookies } as any, env);
  return redirect('/admin', 302);
};
