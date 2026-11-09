import { describe, it, expect } from 'vitest';
import { toProfileRole, homePathForRole } from './auth-roles';

describe('toProfileRole', () => {
  it('un reclutador se registra como dependencia', () => {
    expect(toProfileRole('reclutador')).toBe('dependencia');
  });

  it('un postulante se registra como estudiante (antes quedaba como dependencia)', () => {
    expect(toProfileRole('postulante')).toBe('estudiante');
  });

  it('cualquier otro valor se trata como estudiante (mínimo privilegio)', () => {
    expect(toProfileRole('admin')).toBe('estudiante');
  });
});

describe('homePathForRole', () => {
  it('redirige según el rol', () => {
    expect(homePathForRole('dependencia')).toBe('/dashboard/dependencia');
    expect(homePathForRole('estudiante')).toBe('/dashboard/estudiante/explorar');
  });
});
