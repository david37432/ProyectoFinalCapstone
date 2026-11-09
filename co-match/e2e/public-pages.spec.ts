import { test, expect } from '@playwright/test';

test.describe('Páginas públicas', () => {
  test('la portada carga y no tiene errores de consola', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    await expect(page.getByText('CO-MATCH').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  for (const [path, text] of [
    ['/privacidad', /1581/],
    ['/terminos', /términos/i],
    ['/reportar', /reporte|reportar|sugerencia/i],
  ] as const) {
    test(`${path} se muestra correctamente`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('body')).toContainText(text);
    });
  }

  test('no hay scroll horizontal en la portada (responsive)', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe('Rutas protegidas', () => {
  for (const path of ['/dashboard/estudiante/explorar', '/dashboard/dependencia', '/dashboard/dependencia/publicar']) {
    test(`${path} redirige al login sin sesión`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  }

  test('la API no responde datos sin sesión', async ({ request }) => {
    const res = await request.get('/api/dependencia/projects', { maxRedirects: 0 });
    expect([301, 302, 307, 308, 401, 403]).toContain(res.status());
  });
});
