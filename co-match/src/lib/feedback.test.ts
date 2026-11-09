import { describe, it, expect } from 'vitest';
import { validateFeedback } from './feedback';

describe('validateFeedback', () => {
  it('acepta un reporte válido y recorta espacios', () => {
    const r = validateFeedback({ category: 'error', message: '  El botón no responde  ', pageUrl: ' /dashboard ' });
    expect(r).toEqual({ ok: true, data: { category: 'error', message: 'El botón no responde', pageUrl: '/dashboard' } });
  });

  it('pageUrl vacía se guarda como null', () => {
    const r = validateFeedback({ category: 'sugerencia', message: 'Agregar modo oscuro por favor' });
    expect(r.ok && r.data.pageUrl).toBeNull();
  });

  it('rechaza categorías desconocidas', () => {
    expect(validateFeedback({ category: 'spam', message: 'mensaje suficientemente largo' }).ok).toBe(false);
  });

  it('rechaza mensajes muy cortos o muy largos', () => {
    expect(validateFeedback({ category: 'error', message: 'corto' }).ok).toBe(false);
    expect(validateFeedback({ category: 'error', message: 'x'.repeat(2001) }).ok).toBe(false);
  });
});
