import { describe, it, expect } from 'vitest';
import { normalizeLink, validateRepoInput, isPathOwnedBy, repoFilePath } from './repository';

describe('repositorio de soluciones', () => {
  it('normaliza enlaces y rechaza protocolos peligrosos', () => {
    expect(normalizeLink('github.com/a/b')).toBe('https://github.com/a/b');
    expect(normalizeLink('javascript:alert(1)')).toBeNull();
    expect(normalizeLink('')).toBeNull();
  });
  it('exige nombre y enlace o archivo', () => {
    expect(validateRepoInput({ title: 'ab', linkUrl: 'https://x.co' })).toMatch(/nombre/);
    expect(validateRepoInput({ title: 'Mi solución' })).toMatch(/enlace o sube/);
    expect(validateRepoInput({ title: 'Mi solución', linkUrl: 'https://x.co' })).toBeNull();
    expect(validateRepoInput({ title: 'Mi solución', file: { path: 'u/a.pdf', name: 'a.pdf' } })).toBeNull();
  });
  it('las rutas pertenecen al autor', () => {
    const p = repoFilePath('u1', 'Informe final.pdf', 'abc');
    expect(isPathOwnedBy(p, 'u1')).toBe(true);
    expect(isPathOwnedBy(p, 'u2')).toBe(false);
    expect(isPathOwnedBy('u1/../u2/x', 'u1')).toBe(false);
  });
});
