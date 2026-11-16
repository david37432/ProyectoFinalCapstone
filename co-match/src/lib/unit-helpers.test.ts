import { describe, it, expect } from 'vitest';
import { addCustomItem, filterOptions, SKILLS_OPTIONS, DEPARTMENTS } from './catalog';
import {
  validateChatFile,
  safeFileName,
  chatFilePath,
  isPathInConversation,
  CHAT_MAX_BYTES,
} from './chat-files';
import { buildDependencyNotifications, countUnseen } from './notifications';
import { csvCell, toCsv, slugify } from './export';
import { filterVacancies } from './search';
import {
  isCancelledOpportunity,
  opportunityStatusAfterRelease,
  releasedApplicationValues,
  deleteStrategy,
  isConfirmedMatch,
  studentApplicationStatus,
} from './data/model';

describe('catalog: opciones y valores escritos a mano', () => {
  it('no tiene departamentos repetidos', () => {
    expect(new Set(DEPARTMENTS).size).toBe(DEPARTMENTS.length);
  });

  it('filtra sugerencias sin distinguir mayúsculas', () => {
    expect(filterOptions(SKILLS_OPTIONS, 'pyth')).toEqual(['Python']);
    expect(filterOptions(SKILLS_OPTIONS, '  POWER ')).toEqual(['Power BI']);
    expect(filterOptions(SKILLS_OPTIONS, '')).toHaveLength(SKILLS_OPTIONS.length);
  });

  it('permite agregar una habilidad que no está en la lista', () => {
    expect(addCustomItem(['Python'], 'Looker Studio', SKILLS_OPTIONS)).toEqual(['Python', 'Looker Studio']);
  });

  it('usa la escritura de la sugerencia y evita duplicados', () => {
    expect(addCustomItem([], 'power bi', SKILLS_OPTIONS)).toEqual(['Power BI']);
    expect(addCustomItem(['Power BI'], '  POWER   bi ', SKILLS_OPTIONS)).toEqual(['Power BI']);
  });

  it('ignora vacíos, textos enormes y respeta el máximo', () => {
    expect(addCustomItem(['A'], '   ')).toEqual(['A']);
    expect(addCustomItem([], 'x'.repeat(61))).toEqual([]);
    expect(addCustomItem(['A', 'B'], 'C', [], 2)).toEqual(['A', 'B']);
  });

  it('no modifica la lista original', () => {
    const list = ['A'];
    addCustomItem(list, 'B');
    expect(list).toEqual(['A']);
  });
});

describe('chat-files: validación de adjuntos', () => {
  const ok = { name: 'informe.pdf', size: 1024, type: 'application/pdf' };

  it('acepta un PDF normal', () => {
    expect(validateChatFile(ok)).toBeNull();
  });

  it('rechaza archivos vacíos, enormes o de tipos no permitidos', () => {
    expect(validateChatFile({ ...ok, size: 0 })).toMatch(/vacío/);
    expect(validateChatFile({ ...ok, size: CHAT_MAX_BYTES + 1 })).toMatch(/10 MB/);
    expect(validateChatFile({ ...ok, type: 'application/x-msdownload' })).toMatch(/no permitido/);
    expect(validateChatFile({ ...ok, type: 'text/html' })).toMatch(/no permitido/);
  });

  it('acepta exactamente el tamaño máximo', () => {
    expect(validateChatFile({ ...ok, size: CHAT_MAX_BYTES })).toBeNull();
  });

  it('limpia el nombre para la ruta de Storage', () => {
    expect(safeFileName('Informe Final (v2) ñandú.pdf')).toBe('Informe_Final_v2_nandu.pdf');
    expect(safeFileName('../../etc/passwd')).not.toContain('/');
    expect(safeFileName('???')).toBe('archivo');
  });

  it('la ruta empieza por el id de la conversación', () => {
    const path = chatFilePath('conv-1', 'a b.pdf', 'u1');
    expect(path).toBe('conv-1/u1-a_b.pdf');
    expect(isPathInConversation(path, 'conv-1')).toBe(true);
  });

  it('rechaza rutas de otra conversación, con ".." o que no son texto', () => {
    expect(isPathInConversation('conv-2/x.pdf', 'conv-1')).toBe(false);
    expect(isPathInConversation('conv-1/../conv-2/x.pdf', 'conv-1')).toBe(false);
    expect(isPathInConversation(undefined, 'conv-1')).toBe(false);
    expect(isPathInConversation({ a: 1 }, 'conv-1')).toBe(false);
  });
});

describe('notifications: avisos de la dependencia', () => {
  const now = new Date('2026-11-15T12:00:00Z');
  const base = {
    now,
    opportunities: [{ id: 'o1', title: 'Reportes' }],
    studentNames: new Map([['s1', 'Ana']]),
    applications: [],
    conversations: [],
    milestones: [],
  };

  it('sin datos no hay avisos', () => {
    expect(buildDependencyNotifications(base)).toEqual([]);
  });

  it('avisa de postulaciones pendientes recientes, no de las viejas ni las ya revisadas', () => {
    const items = buildDependencyNotifications({
      ...base,
      applications: [
        { id: 'a1', opportunity_id: 'o1', student_id: 's1', dependency_status: 'pending', created_at: '2026-11-14T10:00:00Z' },
        { id: 'a2', opportunity_id: 'o1', student_id: 's1', dependency_status: 'pending', created_at: '2026-09-01T10:00:00Z' },
        { id: 'a3', opportunity_id: 'o1', student_id: 's1', dependency_status: 'contacted', is_match: true, created_at: '2026-11-14T10:00:00Z' },
      ],
    });
    expect(items.map((i) => i.id)).toEqual(['app-a1']);
    expect(items[0].message).toContain('Ana');
    expect(items[0].message).toContain('Reportes');
  });

  it('avisa de mensajes sin leer con singular y plural', () => {
    const items = buildDependencyNotifications({
      ...base,
      conversations: [
        { id: 'c1', student_id: 's1', opportunity_id: 'o1', unread_dependency_count: 1, last_message_at: '2026-11-15T11:00:00Z' },
        { id: 'c2', student_id: 's1', opportunity_id: 'o1', unread_dependency_count: 3, last_message_at: '2026-11-15T10:00:00Z' },
        { id: 'c3', student_id: 's1', opportunity_id: 'o1', unread_dependency_count: 0 },
      ],
    });
    expect(items.map((i) => i.title)).toEqual(['Mensaje nuevo', '3 mensajes nuevos']);
  });

  it('avisa de hitos vencidos o por vencer en 3 días, pero no de los lejanos ni los completados', () => {
    const items = buildDependencyNotifications({
      ...base,
      milestones: [
        { id: 'm1', opportunity_id: 'o1', title: 'Vencido', status: 'pending', due_date: '2026-11-10T00:00:00Z' },
        { id: 'm2', opportunity_id: 'o1', title: 'Pronto', status: 'in_progress', due_date: '2026-11-17T00:00:00Z' },
        { id: 'm3', opportunity_id: 'o1', title: 'Lejano', status: 'pending', due_date: '2026-12-30T00:00:00Z' },
        { id: 'm4', opportunity_id: 'o1', title: 'Hecho', status: 'completed', due_date: '2026-11-10T00:00:00Z' },
        { id: 'm5', opportunity_id: 'o1', title: 'Sin fecha', status: 'pending', due_date: null },
      ],
    });
    expect(items.map((i) => i.id).sort()).toEqual(['ms-m1', 'ms-m2']);
    expect(items.find((i) => i.id === 'ms-m1')?.title).toBe('Hito vencido');
    expect(items.find((i) => i.id === 'ms-m2')?.title).toBe('Hito próximo a vencer');
  });

  it('ordena del más nuevo al más viejo y respeta el límite', () => {
    const items = buildDependencyNotifications(
      {
        ...base,
        applications: [
          { id: 'a1', opportunity_id: 'o1', student_id: 's1', created_at: '2026-11-10T00:00:00Z' },
          { id: 'a2', opportunity_id: 'o1', student_id: 's1', created_at: '2026-11-14T00:00:00Z' },
        ],
      },
      1
    );
    expect(items.map((i) => i.id)).toEqual(['app-a2']);
  });

  it('cuenta lo no visto: lo posterior a la última visita y siempre los mensajes sin leer', () => {
    const items = [
      { id: '1', type: 'application' as const, title: '', message: '', href: '', createdAt: '2026-11-14T00:00:00Z' },
      { id: '2', type: 'application' as const, title: '', message: '', href: '', createdAt: '2026-11-10T00:00:00Z' },
      { id: '3', type: 'message' as const, title: '', message: '', href: '', createdAt: '2026-11-01T00:00:00Z' },
    ];
    expect(countUnseen(items, null)).toBe(3);
    expect(countUnseen(items, '2026-11-12T00:00:00Z')).toBe(2);
    expect(countUnseen(items, '2026-11-20T00:00:00Z')).toBe(1);
  });
});

describe('export: CSV', () => {
  it('escapa comillas, comas y saltos de línea', () => {
    expect(csvCell('hola')).toBe('hola');
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('dijo "hola"')).toBe('"dijo ""hola"""');
    expect(csvCell('línea1\nlínea2')).toBe('"línea1\nlínea2"');
    expect(csvCell(null)).toBe('');
    expect(csvCell(85)).toBe('85');
  });

  it('neutraliza fórmulas de Excel (inyección CSV)', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toMatch(/^"?'=/);
    expect(csvCell('+1+1')).toBe("'+1+1");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
  });

  it('arma el archivo con BOM y encabezados', () => {
    const csv = toCsv(['Nombre', 'Nota'], [['Ana', 5], ['Beto, Jr.', 4]]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.split('\r\n')).toEqual(['﻿Nombre,Nota', 'Ana,5', '"Beto, Jr.",4']);
  });

  it('genera nombres de archivo seguros', () => {
    expect(slugify('Automatización de Reportes Ñandú!')).toBe('automatizacion-de-reportes-nandu');
    expect(slugify('???')).toBe('reporte');
  });
});

describe('search: filtro de necesidades', () => {
  const vacancies = [
    { title: 'Automatización de reportes', department_name: 'Finanzas', required_skills: ['Python', 'Excel Avanzado'] },
    { title: 'Inventario de biblioteca', department_name: 'Biblioteca', required_skills: ['SQL'] },
  ];

  it('busca por título, área o habilidad ignorando mayúsculas y acentos', () => {
    expect(filterVacancies(vacancies, 'AUTOMATIZACION')).toHaveLength(1);
    expect(filterVacancies(vacancies, 'biblioteca')).toHaveLength(1);
    expect(filterVacancies(vacancies, 'sql')).toHaveLength(1);
  });

  it('exige todas las palabras', () => {
    expect(filterVacancies(vacancies, 'python finanzas')).toHaveLength(1);
    expect(filterVacancies(vacancies, 'python biblioteca')).toHaveLength(0);
  });

  it('con texto vacío devuelve todo', () => {
    expect(filterVacancies(vacancies, '   ')).toHaveLength(2);
  });
});

describe('model: retirar al estudiante y eliminar necesidades', () => {
  it('reconoce los estados cancelados', () => {
    expect(isCancelledOpportunity('cancelled')).toBe(true);
    expect(isCancelledOpportunity(' Cancelada ')).toBe(true);
    expect(isCancelledOpportunity('published')).toBe(false);
    expect(isCancelledOpportunity(null)).toBe(false);
  });

  it('la necesidad se vuelve a publicar solo si ya no queda ningún match', () => {
    expect(opportunityStatusAfterRelease(0)).toBe('published');
    expect(opportunityStatusAfterRelease(1)).toBe('in_progress');
  });

  it('retirar deja la postulación rechazada y el estudiante la ve como rechazada', () => {
    const values = releasedApplicationValues();
    expect(isConfirmedMatch(values)).toBe(false);
    expect(studentApplicationStatus(values)).toBe('rechazada');
  });

  it('borra si no hay postulaciones y cancela si las hay', () => {
    expect(deleteStrategy(0)).toBe('delete');
    expect(deleteStrategy(3)).toBe('cancel');
  });
});
