import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH - Aceptar o rechazar invitación
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id: invitationId } = await params
    const body = await request.json()
    const { action } = body

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Accion invalida. Usa "accept" o "reject"' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (action === 'accept') {
      // Usar la función de la base de datos para aceptar
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('accept_project_invitation', {
        invitation_id: invitationId,
      })

      if (error) {
        console.error('Error accepting invitation:', error)
        return NextResponse.json({ error: error.message || 'Error al aceptar invitacion' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Invitacion aceptada' })
    } else {
      // Rechazar invitación
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('reject_project_invitation', {
        invitation_id: invitationId,
      })

      if (error) {
        console.error('Error rejecting invitation:', error)
        return NextResponse.json({ error: error.message || 'Error al rechazar invitacion' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Invitacion rechazada' })
    }
  } catch (error) {
    console.error('Error in invitation PATCH:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
