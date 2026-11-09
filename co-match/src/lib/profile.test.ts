import { describe, it, expect } from 'vitest';
import {
  PAT_MAX_HOURS,
  clampAvailability,
  availabilityPercent,
  validateAvatarFile,
  avatarPath,
  AVATAR_MAX_BYTES,
  profileFieldsFromRegistration,
  preferFilled,
} from './profile';

describe('disponibilidad PAT', () => {
  it('el máximo PAT es 25 horas', () => {
    expect(PAT_MAX_HOURS).toBe(25);
  });

  it('25 horas es el 100 %', () => {
    expect(availabilityPercent(25)).toBe(100);
  });

  it('calcula porcentajes intermedios sobre 25', () => {
    expect(availabilityPercent(10)).toBe(40);
    expect(availabilityPercent(20)).toBe(80);
    expect(availabilityPercent(0)).toBe(0);
    expect(availabilityPercent(null)).toBe(0);
  });

  it('más de 25 horas se limita a 25 (100 %)', () => {
    expect(clampAvailability(40)).toBe(25);
    expect(availabilityPercent(40)).toBe(100);
  });

  it('valores negativos o inválidos', () => {
    expect(clampAvailability(-5)).toBe(0);
    expect(clampAvailability('abc')).toBeNull();
    expect(clampAvailability('')).toBeNull();
    expect(clampAvailability(undefined)).toBeNull();
    expect(clampAvailability('12')).toBe(12);
  });
});

describe('validateAvatarFile', () => {
  it('acepta JPG, PNG y WEBP de hasta 2 MB', () => {
    expect(validateAvatarFile({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(validateAvatarFile({ type: 'image/png', size: AVATAR_MAX_BYTES })).toBeNull();
    expect(validateAvatarFile({ type: 'image/webp', size: 1 })).toBeNull();
  });

  it('rechaza otros formatos', () => {
    expect(validateAvatarFile({ type: 'image/gif', size: 1000 })).toMatch(/JPG/);
    expect(validateAvatarFile({ type: 'application/pdf', size: 1000 })).not.toBeNull();
  });

  it('rechaza archivos vacíos o de más de 2 MB', () => {
    expect(validateAvatarFile({ type: 'image/png', size: 0 })).not.toBeNull();
    expect(validateAvatarFile({ type: 'image/png', size: AVATAR_MAX_BYTES + 1 })).toMatch(/2 MB/);
  });
});

describe('avatarPath', () => {
  it('guarda la foto en la carpeta del usuario con la extensión correcta', () => {
    expect(avatarPath('user-1', 'image/png', 123)).toBe('user-1/avatar-123.png');
    expect(avatarPath('user-1', 'image/jpeg', 5)).toBe('user-1/avatar-5.jpg');
  });
});

describe('profileFieldsFromRegistration', () => {
  it('toma teléfono y código del registro', () => {
    expect(profileFieldsFromRegistration({ full_name: ' Laura ', phone: '300 123', student_code: '0000123' })).toEqual({
      full_name: 'Laura',
      phone: '300 123',
      student_code: '0000123',
    });
  });

  it('usa document_number de registros antiguos como código', () => {
    expect(profileFieldsFromRegistration({ document_number: '1010010100' }).student_code).toBe('1010010100');
  });

  it('tolera metadata vacía', () => {
    expect(profileFieldsFromRegistration(null)).toEqual({ full_name: '', phone: '', student_code: '' });
  });
});

describe('preferFilled', () => {
  it('prefiere el valor guardado y si no, el del registro', () => {
    expect(preferFilled('311', '300')).toBe('311');
    expect(preferFilled('', '300')).toBe('300');
    expect(preferFilled(null, '300')).toBe('300');
    expect(preferFilled('  ', '300')).toBe('300');
  });
});
