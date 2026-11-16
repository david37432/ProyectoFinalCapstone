import { test, expect } from '@playwright/test';

// Sin sesión las rutas internas deben rechazar la petición (401/403) o redirigir al login, nunca fallar con 500.
const rutas = [
  ['GET', '/api/dependencia/notifications'],
  ['GET', '/api/dependencia/conversations'],
  ['POST', '/api/dependencia/applications/abc/contact'],
  ['DELETE', '/api/dependencia/applications/abc/contact'],
  ['POST', '/api/dependencia/conversations/abc/messages'],
  ['PATCH', '/api/dependencia/milestones/abc'],
] as const;

test.describe('API de dependencia sin sesión', () => {
  for (const [method, path] of rutas) {
    test(`${method} ${path} no responde 500`, async ({ request }) => {
      const res = await request.fetch(path, { method, maxRedirects: 0, data: method === 'GET' ? undefined : {} });
      expect(res.status()).toBeLessThan(500);
      expect(res.status()).not.toBe(200);
    });
  }
});
