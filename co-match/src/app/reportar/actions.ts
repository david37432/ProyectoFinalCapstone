'use server';

import { createClient } from '@/lib/supabase/server';
import { validateFeedback, type FeedbackInput } from '@/lib/feedback';

export async function submitFeedbackAction(input: FeedbackInput): Promise<{ success: boolean; error?: string }> {
  const validation = validateFeedback(input);
  if (!validation.ok) return { success: false, error: validation.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('feedback_reports').insert({
    user_id: user?.id ?? null,
    category: validation.data.category,
    message: validation.data.message,
    page_url: validation.data.pageUrl,
  });

  if (error) {
    console.error('[feedback] Error guardando reporte:', error.message);
    return { success: false, error: 'No se pudo enviar el reporte. Intenta de nuevo más tarde.' };
  }
  return { success: true };
}
