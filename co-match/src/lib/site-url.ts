interface SiteUrlInput {
  /** NEXT_PUBLIC_SITE_URL, si se definió a mano */
  envUrl?: string | null;
  /** VERCEL_PROJECT_PRODUCTION_URL (host sin protocolo) */
  vercelHost?: string | null;
  origin?: string | null;
  host?: string | null;
  proto?: string | null;
}

const strip = (u: string) => u.trim().replace(/\/+$/, '');

/** URL pública de la app, usada en los enlaces de los correos de Supabase. */
export function siteUrlFrom({ envUrl, vercelHost, origin, host, proto }: SiteUrlInput): string {
  if (envUrl?.trim()) return strip(envUrl);
  if (origin?.trim()) return strip(origin);
  if (host?.trim()) {
    const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host.trim());
    return `${proto?.trim() || (isLocal ? 'http' : 'https')}://${host.trim()}`;
  }
  if (vercelHost?.trim()) return `https://${strip(vercelHost)}`;
  return 'http://localhost:3000';
}
