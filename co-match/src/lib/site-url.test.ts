import { describe, it, expect } from 'vitest';
import { siteUrlFrom } from './site-url';

describe('siteUrlFrom', () => {
  it('prioriza NEXT_PUBLIC_SITE_URL y quita la barra final', () => {
    expect(siteUrlFrom({ envUrl: 'https://co-match.app/', origin: 'http://x' })).toBe('https://co-match.app');
  });
  it('usa el origin de la petición', () => {
    expect(siteUrlFrom({ origin: 'https://abc.vercel.app' })).toBe('https://abc.vercel.app');
  });
  it('construye desde host + proto', () => {
    expect(siteUrlFrom({ host: 'abc.vercel.app', proto: 'https' })).toBe('https://abc.vercel.app');
  });
  it('asume http para localhost y https para el resto', () => {
    expect(siteUrlFrom({ host: 'localhost:3000' })).toBe('http://localhost:3000');
    expect(siteUrlFrom({ host: 'abc.vercel.app' })).toBe('https://abc.vercel.app');
  });
  it('usa el host de producción de Vercel como respaldo', () => {
    expect(siteUrlFrom({ vercelHost: 'co-match.vercel.app' })).toBe('https://co-match.vercel.app');
  });
  it('cae a localhost sin información', () => {
    expect(siteUrlFrom({})).toBe('http://localhost:3000');
  });
});
