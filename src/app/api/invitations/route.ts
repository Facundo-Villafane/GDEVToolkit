import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Obtener mis invitaciones pendientes
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: invitations, error } = await supabase
      .from('project_invitations')
      .select(`
        id,
        role,
        message,
        status,
        created_at,
        project:projects (
          id,
          name,
          slug,
          description,
          thumbnail_url,
          is_jam_project,
          jam_name
        ),
        inviter:profiles!project_invitations_inviter_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching my invitations:', error)
      return NextResponse.json({ error: 'Error al obtener invitaciones' }, { status: 500 })
    }

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error in invitations GET:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
