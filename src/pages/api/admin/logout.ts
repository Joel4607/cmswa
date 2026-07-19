import type { APIRoute } from 'astro';
import { clearAuthCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  clearAuthCookie({ cookies });
  return redirect('/login', 302);
};
