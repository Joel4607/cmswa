export function getAdminPassword(env?: { ADMIN_PASSWORD?: string }): string | undefined {
  return env?.ADMIN_PASSWORD;
}

export function isAdminPasswordSet(env?: { ADMIN_PASSWORD?: string }): boolean {
  return !!getAdminPassword(env) && getAdminPassword(env) !== '<your-admin-password>';
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getAuthCookie(Astro: any): Promise<string | undefined> {
  return Astro.cookies.get('cmswa_auth')?.value;
}

export async function isAdmin(Astro: any, env?: { ADMIN_PASSWORD?: string }): Promise<boolean> {
  const password = getAdminPassword(env);
  if (!password || !isAdminPasswordSet(env)) return false;
  const cookie = await getAuthCookie(Astro);
  if (!cookie) return false;
  const expected = await hashPassword(password);
  return cookie === expected;
}

export async function requireAdmin(Astro: any, env?: { ADMIN_PASSWORD?: string }): Promise<void> {
  if (!(await isAdmin(Astro, env))) {
    return Astro.redirect('/login') as any;
  }
}

export async function setAuthCookie(Astro: any, env?: { ADMIN_PASSWORD?: string }): Promise<void> {
  const password = getAdminPassword(env);
  if (!password) return;
  const hash = await hashPassword(password);
  Astro.cookies.set('cmswa_auth', hash, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export function clearAuthCookie(Astro: any): void {
  Astro.cookies.delete('cmswa_auth', { path: '/' });
}
