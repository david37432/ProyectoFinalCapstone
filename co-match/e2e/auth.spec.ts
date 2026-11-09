import { test, expect, type Page } from '@playwright/test';

// Next.js inyecta su propio role=alert (route announcer); se excluye
const alerta = (page: Page) => page.locator('[role=alert]:not(#__next-route-announcer__)');

test.describe('Login', () => {
  test('rechaza un correo que no es institucional', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('#email').fill('alguien@gmail.com');
    await page.locator('#password').fill('12345678');
    await page.getByRole('button', { name: /iniciar sesi/i }).click();
    await expect(alerta(page)).toContainText('@unisabana.edu.co');
  });

  test('muestra el mensaje cuando el enlace de confirmación expiró', async ({ page }) => {
    await page.goto('/auth/login?error=enlace_expirado');
    await expect(alerta(page)).toContainText('expiró');
  });

  test('enlaza al registro', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: /reg[ií]strate|crear cuenta/i }).first().click();
    await expect(page).toHaveURL(/\/auth\/register/);
  });
});

test.describe('Registro (sin crear cuentas reales)', () => {
  test('Enter en el paso 1 avanza al paso 2 en vez de enviar el formulario', async ({ page }) => {
    await page.goto('/auth/register');
    await page.locator('#email').fill('prueba@unisabana.edu.co');
    await page.locator('#password').fill('contraseña-segura');
    await page.locator('#confirmPassword').fill('contraseña-segura');
    await page.locator('#confirmPassword').press('Enter');
    await expect(page.locator('#full_name')).toBeVisible();
    await expect(alerta(page)).toHaveCount(0);
  });

  test('no avanza con campos vacíos', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByRole('button', { name: 'Siguiente' }).click();
    // La validación nativa (required) impide pasar al paso 2
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#full_name')).toHaveCount(0);
  });

  test('valida que las contraseñas coincidan', async ({ page }) => {
    await page.goto('/auth/register');
    await page.locator('#email').fill('prueba@unisabana.edu.co');
    await page.locator('#password').fill('contraseña-segura');
    await page.locator('#confirmPassword').fill('otra-distinta-123');
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.locator('#full_name').fill('Persona de Prueba');
    await page.locator('#document_number').fill('123456');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(alerta(page)).toContainText('no coinciden');
  });

  test('el spinner no queda pegado si falla el servidor', async ({ page }) => {
    // Simula una caída de red en la Server Action: antes dejaba el botón cargando para siempre
    await page.route('**/auth/register', (route) =>
      route.request().method() === 'POST' ? route.abort('failed') : route.continue(),
    );
    await page.goto('/auth/register');
    await page.locator('#email').fill('prueba@unisabana.edu.co');
    await page.locator('#password').fill('contraseña-segura');
    await page.locator('#confirmPassword').fill('contraseña-segura');
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.locator('#full_name').fill('Persona de Prueba');
    await page.locator('#document_number').fill('123456');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(alerta(page)).toContainText(/No se pudo completar/);
    await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeEnabled();
  });
});
