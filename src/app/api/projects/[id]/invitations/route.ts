import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Types for Supabase query results
interface ProjectOwnerResult {
  owner_id: string
  name?: string
}

interface MembershipResult {
  can_manage: boolean
}

interface ProfileData {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface InvitationResult {
  id: string
  role: string
  message: string | null
  status: string
  created_at: string
  responded_at: string | null
  inviter: ProfileData | null
  invitee: ProfileData | null
}

// GET - Listar invitaciones de un proyecto
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario tiene acceso al proyecto
    const { data: projectRaw } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single()

    const project = projectRaw as unknown as ProjectOwnerResult | null

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar que es dueño o manager
    const isOwner = project.owner_id === user.id
    if (!isOwner) {
      const { data: membershipRaw } = await supabase
        .from('project_members')
        .select('can_manage')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      const membership = membershipRaw as unknown as MembershipResult | null

      if (!membership?.can_manage) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
      }
    }

    // Obtener invitaciones con datos de usuarios
    const { data: invitationsRaw, error } = await supabase
      .from('project_invitations')
      .select(`
        id,
        role,
        message,
        status,
        created_at,
        responded_at,
        inviter:profiles!project_invitations_inviter_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        ),
        invitee:profiles!project_invitations_invitee_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json({ error: 'Error al obtener invitaciones' }, { status: 500 })
    }

    const invitations = (invitationsRaw || []) as unknown as InvitationResult[]

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error in invitations GET:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Crear nueva invitación
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { inviteeId, role = 'member', message } = body

    if (!inviteeId) {
      return NextResponse.json({ error: 'Se requiere inviteeId' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el proyecto existe y el usuario tiene permisos
    const { data: projectRaw } = await supabase
      .from('projects')
      .select('owner_id, name')
      .eq('id', projectId)
      .single()

    const project = projectRaw as unknown as ProjectOwnerResult | null

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar permisos (dueño o manager)
    const isOwner = project.owner_id === user.id
    if (!isOwner) {
      const { data: membershipRaw } = await supabase
        .from('project_members')
        .select('can_manage')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      const membership = membershipRaw as unknown as MembershipResult | null

      if (!membership?.can_manage) {
        return NextResponse.json({ error: 'Sin permisos para invitar' }, { status: 403 })
      }
    }

    // Verificar que no se invita a sí mismo
    if (inviteeId === user.id) {
      return NextResponse.json({ error: 'No puedes invitarte a ti mismo' }, { status: 400 })
    }

    // Verificar que el invitado no es ya miembro
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', inviteeId)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'El usuario ya es miembro del proyecto' }, { status: 400 })
    }

    // Verificar que no existe una invitación pendiente
    const { data: existingInvite } = await supabase
      .from('project_invitations')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('invitee_id', inviteeId)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return NextResponse.json({ error: 'Ya existe una invitacion pendiente para este usuario' }, { status: 400 })
    }

    // Crear la invitación
    const { data: invitationRaw, error } = await (supabase
      .from('project_invitations') as any)
      .insert({
        project_id: projectId,
        inviter_id: user.id,
        invitee_id: inviteeId,
        role,
        message,
      })
      .select(`
        id,
        role,
        message,
        status,
        created_at,
        invitee:profiles!project_invitations_invitee_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    const invitation = invitationRaw as InvitationResult | null

    if (error) {
      console.error('Error creating invitation:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya existe una invitacion para este usuario' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Error al crear invitacion' }, { status: 500 })
    }

    return NextResponse.json({ invitation }, { status: 201 })
  } catch (error) {
    console.error('Error in invitations POST:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - Cancelar invitación
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('invitationId')

    if (!invitationId) {
      return NextResponse.json({ error: 'Se requiere invitationId' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // La RLS policy se encarga de verificar permisos
    const { error } = await supabase
      .from('project_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('project_id', projectId)

    if (error) {
      console.error('Error deleting invitation:', error)
      return NextResponse.json({ error: 'Error al cancelar invitacion' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in invitations DELETE:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
