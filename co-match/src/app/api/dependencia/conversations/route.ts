import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/server-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAdmin()
    const supabase = await createClient()

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        vacancy_id,
        candidate_id,
        last_message,
        last_message_at,
        last_message_by,
        unread_dependency_count,
        created_at,
        vacancy:vacancies!inner(title),
        candidate:users!inner(full_name, email, avatar_url)
      `)
      .eq('dependency_id', user.id)
      .eq('is_archived_dependency', false)
      .order('last_message_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Error al cargar conversaciones' },
        { status: 500 }
      )
    }

    // Get online status for candidates
    const candidateIds = conversations?.map(c => c.candidate_id) || [];
    let onlineMap = new Map<string, boolean>();
    
    if (candidateIds.length > 0) {
      const { data: profiles } = await supabase
        .from('users')
        .select('id, last_login_at')
        .in('id', candidateIds);

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      profiles?.forEach(p => {
        onlineMap.set(p.id, p.last_login_at && p.last_login_at > fiveMinutesAgo);
      });
    }

    const conversationsWithDetails = conversations?.map(conv => {
      const vacancy = Array.isArray(conv.vacancy) ? conv.vacancy[0] : conv.vacancy;
      const candidate = Array.isArray(conv.candidate) ? conv.candidate[0] : conv.candidate;
      
      return {
        id: conv.id,
        vacancy_id: conv.vacancy_id,
        vacancy_title: vacancy?.title || 'Sin título',
        candidate_id: conv.candidate_id,
        candidate_name: candidate?.full_name || 'Sin nombre',
        candidate_email: candidate?.email || '',
        candidate_avatar_url: candidate?.avatar_url || null,
        last_message: conv.last_message,
        last_message_at: conv.last_message_at,
        last_message_by: conv.last_message_by,
        unread_dependency_count: conv.unread_dependency_count || 0,
        is_online: onlineMap.get(conv.candidate_id) || false,
        created_at: conv.created_at,
      };
    }) || [];

    return NextResponse.json({ conversations: conversationsWithDetails })
  } catch (error) {
    console.error('Error in conversations GET:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}