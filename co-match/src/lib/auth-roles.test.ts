import { describe, it, expect } from 'vitest';
import { toProfileRole, homePathForRole, normalizeRole, dashboardRedirectFor } from './auth-roles';

describe('normalizeRole', () => {
  it.each(['estudiante', 'postulante', 'ESTUDIANTE', ' postulante '])('"%s" es estudiante', (role) => {
    expect(normalizeRole(role)).toBe('estudiante');
  });

  it.each(['dependencia', 'reclutador', 'jefe_area', 'pat', 'admin', 'administrador', 'Reclutador'])(
    '"%s" es dependencia',
    (role) => {
      expect(normalizeRole(role)).toBe('dependencia');
    }
  );

  it('rol vacío o desconocido es estudiante (mínimo privilegio)', () => {
    expect(normalizeRole(null)).toBe('estudiante');
    expect(normalizeRole(undefined)).toBe('estudiante');
    expect(normalizeRole('hacker')).toBe('estudiante');
  });
});

describe('toProfileRole', () => {
  it('un reclutador se registra como dependencia', () => {
    expect(toProfileRole('reclutador')).toBe('dependencia');
  });

  it('un postulante se registra como estudiante (antes quedaba como dependencia)', () => {
    expect(toProfileRole('postulante')).toBe('estudiante');
  });
});

describe('homePathForRole', () => {
  it('redirige según el rol', () => {
    expect(homePathForRole('dependencia')).toBe('/dashboard/dependencia');
    expect(homePathForRole('estudiante')).toBe('/dashboard/estudiante/explorar');
  });

  it('"postulante" va a Explorar (causaba el bucle en el login)', () => {
    expect(homePathForRole('postulante')).toBe('/dashboard/estudiante/explorar');
  });
});

describe('dashboardRedirectFor', () => {
  it('un estudiante no entra al panel de dependencia', () => {
    expect(dashboardRedirectFor('/dashboard/dependencia', 'postulante')).toBe('/dashboard/estudiante/explorar');
  });

  it('una dependencia no entra al panel de estudiante', () => {
    expect(dashboardRedirectFor('/dashboard/estudiante/explorar', 'reclutador')).toBe('/dashboard/dependencia');
  });

  it('deja pasar cuando el rol coincide', () => {
    expect(dashboardRedirectFor('/dashboard/estudiante/perfil', 'postulante')).toBeNull();
    expect(dashboardRedirectFor('/dashboard/dependencia/publicar', 'dependencia')).toBeNull();
  });

  it('nunca redirige al login (evita bucles)', () => {
    for (const role of ['postulante', 'estudiante', 'dependencia', null, 'raro']) {
      for (const path of ['/dashboard/dependencia', '/dashboard/estudiante', '/dashboard']) {
        expect(dashboardRedirectFor(path, role)).not.toBe('/auth/login');
      }
    }
  });
});
