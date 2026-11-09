export const FEEDBACK_CATEGORIES = ['error', 'sugerencia', 'otro'] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export interface FeedbackInput {
  category: string;
  message: string;
  pageUrl?: string;
}

export interface ValidFeedback {
  category: FeedbackCategory;
  message: string;
  pageUrl: string | null;
}

export function validateFeedback(
  input: FeedbackInput
): { ok: true; data: ValidFeedback } | { ok: false; error: string } {
  const category = input.category as FeedbackCategory;
  if (!FEEDBACK_CATEGORIES.includes(category)) return { ok: false, error: 'Selecciona un tipo de reporte válido' };

  const message = (input.message ?? '').trim();
  if (message.length < 10) return { ok: false, error: 'Describe el problema con al menos 10 caracteres' };
  if (message.length > 2000) return { ok: false, error: 'El mensaje no puede superar 2000 caracteres' };

  const pageUrl = (input.pageUrl ?? '').trim();
  if (pageUrl.length > 500) return { ok: false, error: 'La URL es demasiado larga' };

  return { ok: true, data: { category, message, pageUrl: pageUrl || null } };
}
