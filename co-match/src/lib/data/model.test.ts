import { describe, it, expect } from 'vitest';
import {
  opportunityPhase,
  isActiveOpportunity,
  opportunityStatusLabel,
  PUBLISHED_STATUS_VALUES,
  parseSkillList,
  newApplicationRow,
  isConfirmedMatch,
  isRejected,
  isReviewed,
  canWithdraw,
  studentApplicationStatus,
  defaultMilestoneRows,
  projectEndDate,
  groupBy,
} from './model';

describe('estado de la necesidad', () => {
  it('reconoce variantes de nombres', () => {
    expect(opportunityPhase('pending_pat')).toBe('pending');
    expect(opportunityPhase('en_aprobacion')).toBe('pending');
    expect(opportunityPhase('published')).toBe('published');
    expect(opportunityPhase('Publicada')).toBe('published');
    expect(opportunityPhase('in_progress')).toBe('in_progress');
    expect(opportunityPhase('closed')).toBe('closed');
    expect(opportunityPhase(null)).toBe('pending');
  });

  it('activas = pendientes, publicadas y en curso', () => {
    expect(isActiveOpportunity('pending_pat')).toBe(true);
    expect(isActiveOpportunity('published')).toBe(true);
    expect(isActiveOpportunity('in_progress')).toBe(true);
    expect(isActiveOpportunity('closed')).toBe(false);
  });

  it('etiquetas en español', () => {
    expect(opportunityStatusLabel('pending_pat')).toBe('Pendiente revisión PAT');
    expect(opportunityStatusLabel('published')).toBe('Publicada');
  });

  it('la lista de publicadas incluye "published"', () => {
    expect(PUBLISHED_STATUS_VALUES).toContain('published');
  });
});

describe('parseSkillList (jsonb)', () => {
  it('acepta arreglos de texto u objetos y quita duplicados', () => {
    expect(parseSkillList(['Python', 'python', ' SQL '])).toEqual(['Python', 'SQL']);
    expect(parseSkillList([{ name: 'Power BI' }, { name: 'Excel' }])).toEqual(['Power BI', 'Excel']);
  });

  it('acepta texto JSON o separado por comas', () => {
    expect(parseSkillList('["R","VBA"]')).toEqual(['R', 'VBA']);
    expect(parseSkillList('Python, SQL')).toEqual(['Python', 'SQL']);
  });

  it('valores inválidos dan lista vacía', () => {
    expect(parseSkillList(null)).toEqual([]);
    expect(parseSkillList({})).toEqual([]);
    expect(parseSkillList([null, 3])).toEqual([]);
  });
});

describe('postulaciones', () => {
  it('una postulación nueva queda pendiente y sin match', () => {
    expect(newApplicationRow('o1', 's1', 87)).toEqual({
      opportunity_id: 'o1',
      student_id: 's1',
      match_score: 87,
      student_status: 'interested',
      dependency_status: 'pending',
      pat_status: 'pending',
      is_match: false,
    });
  });

  it('match confirmado cuando la dependencia contacta o acepta', () => {
    expect(isConfirmedMatch({ dependency_status: 'pending' })).toBe(false);
    expect(isConfirmedMatch({ dependency_status: 'contacted' })).toBe(true);
    expect(isConfirmedMatch({ dependency_status: 'accepted' })).toBe(true);
    expect(isConfirmedMatch({ is_match: true })).toBe(true);
  });

  it('rechazo por dependencia o PAT', () => {
    expect(isRejected({ dependency_status: 'rejected' })).toBe(true);
    expect(isRejected({ pat_status: 'rejected' })).toBe(true);
    expect(isRejected({ dependency_status: 'pending' })).toBe(false);
  });

  it('revisada = la dependencia hizo algo', () => {
    expect(isReviewed({ dependency_status: 'pending' })).toBe(false);
    expect(isReviewed({ dependency_status: null })).toBe(false);
    expect(isReviewed({ dependency_status: 'contacted' })).toBe(true);
  });

  it('solo se puede retirar si nadie ha respondido', () => {
    expect(canWithdraw({ dependency_status: 'pending', is_match: false })).toBe(true);
    expect(canWithdraw({ dependency_status: 'contacted' })).toBe(false);
    expect(canWithdraw({ dependency_status: 'pending', is_match: true })).toBe(false);
  });

  it('estado visible para el estudiante', () => {
    expect(studentApplicationStatus({ dependency_status: 'pending' })).toBe('recibida');
    expect(studentApplicationStatus({ dependency_status: 'contacted' })).toBe('entrevista');
    expect(studentApplicationStatus({ dependency_status: 'contacted', is_match: true })).toBe('aceptada');
    expect(studentApplicationStatus({ dependency_status: 'accepted' })).toBe('aceptada');
    expect(studentApplicationStatus({ dependency_status: 'rejected', is_match: true })).toBe('rechazada');
  });
});

describe('proyectos', () => {
  it('crea 6 hitos ordenados, el primero en curso', () => {
    const rows = defaultMilestoneRows('o1', 's1');
    expect(rows).toHaveLength(6);
    expect(rows.map((r) => r.order_index)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(rows[0].status).toBe('in_progress');
    expect(rows.slice(1).every((r) => r.status === 'pending')).toBe(true);
    expect(rows.every((r) => r.opportunity_id === 'o1' && r.student_id === 's1')).toBe(true);
  });

  it('fecha de fin: target_end_date o inicio + duración', () => {
    expect(projectEndDate('2026-01-15T00:00:00.000Z', '2026-12-01T00:00:00.000Z', 2)).toBe('2026-12-01T00:00:00.000Z');
    expect(projectEndDate('2026-01-15T00:00:00.000Z', null, 2)).toBe('2026-03-15T00:00:00.000Z');
    expect(projectEndDate('2026-01-15T00:00:00.000Z', null, null)).toBe('2026-04-15T00:00:00.000Z');
    expect(projectEndDate(null, null, 2)).toBeNull();
  });

  it('groupBy agrupa filas', () => {
    const g = groupBy([{ k: 'a' }, { k: 'b' }, { k: 'a' }], (r) => r.k);
    expect(g.get('a')).toHaveLength(2);
    expect(g.get('b')).toHaveLength(1);
  });
});
