import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/server-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    const resolvedParams = await params;
    const conversationId = resolvedParams.id;
    const supabase = await createClient()

    // Verify user owns this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, dependency_id, candidate_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      )
    }

    if (conversation.dependency_id !== user.id && conversation.candidate_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        message_type,
        file_url,
        file_name,
        is_read,
        created_at,
        sender:users!inner(full_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Error al cargar mensajes' },
        { status: 500 }
      )
    }

    const messagesWithDetails = messages?.map(msg => {
      const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
      
      return {
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        sender_name: sender?.full_name || 'Sin nombre',
        sender_avatar: sender?.avatar_url || null,
        content: msg.content,
        message_type: msg.message_type,
        file_url: msg.file_url,
        file_name: msg.file_name,
        is_read: msg.is_read,
        created_at: msg.created_at,
        is_own: msg.sender_id === user.id,
      };
    }) || [];

    return NextResponse.json({ messages: messagesWithDetails })
  } catch (error) {
    console.error('Error in messages GET:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    const resolvedParams = await params;
    const conversationId = resolvedParams.id;
    const supabase = await createClient()

    const body = await request.json();
    const { content, messageType = 'text', fileUrl, fileName, fileSize } = body;

    if (!content?.trim() && messageType === 'text') {
      return NextResponse.json(
        { error: 'El contenido del mensaje es requerido' },
        { status: 400 }
      )
    }

    // Verify user owns this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, dependency_id, candidate_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      )
    }

    if (conversation.dependency_id !== user.id && conversation.candidate_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content || '',
        message_type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        message_type,
        file_url,
        file_name,
        is_read,
        created_at,
        sender:users!inner(full_name, avatar_url)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Error al enviar mensaje' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: {
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        sender_name: (Array.isArray(message.sender) ? message.sender[0] : message.sender)?.full_name || 'Sin nombre',
        sender_avatar: (Array.isArray(message.sender) ? message.sender[0] : message.sender)?.avatar_url || null,
        content: message.content,
        message_type: message.message_type,
        file_url: message.file_url,
        file_name: message.file_name,
        is_read: message.is_read,
        created_at: message.created_at,
        is_own: true,
      }
    })
  } catch (error) {
    console.error('Error in messages POST:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}