'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check, X, Bell, FolderKanban } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'

interface Invitation {
  id: string
  role: string
  message: string | null
  created_at: string
  project: {
    id: string
    name: string
    slug: string
    description: string | null
    is_jam_project: boolean
    jam_name: string | null
  }
  inviter: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export function PendingInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations')
      const data = await response.json()
      if (response.ok) {
        setInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [])

  const handleRespond = async (invitationId: string, action: 'accept' | 'reject') => {
    setRespondingTo(invitationId)
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Error al responder')
        return
      }

      toast.success(action === 'accept' ? 'Invitacion aceptada' : 'Invitacion rechazada')
      setInvitations(prev => prev.filter(i => i.id !== invitationId))
    } catch (error) {
      toast.error('Error al responder')
    } finally {
      setRespondingTo(null)
    }
  }

  if (isLoading) {
    return null
  }

  if (invitations.length === 0) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
            {invitations.length}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold">Invitaciones pendientes</h4>
          <p className="text-xs text-muted-foreground">
            Tienes {invitations.length} invitacion{invitations.length !== 1 ? 'es' : ''} pendiente{invitations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="p-3 border-b last:border-b-0 hover:bg-muted/50">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={invitation.inviter.avatar_url || ''} />
                  <AvatarFallback>
                    {invitation.inviter.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">
                      {invitation.inviter.display_name || invitation.inviter.username}
                    </span>{' '}
                    te invito a
                  </p>
                  <p className="text-sm font-medium text-primary truncate">
                    {invitation.project.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {invitation.role}
                    </Badge>
                    {invitation.project.is_jam_project && (
                      <Badge variant="outline" className="text-xs">
                        Jam
                      </Badge>
                    )}
                  </div>
                  {invitation.message && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      &quot;{invitation.message}&quot;
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleRespond(invitation.id, 'accept')}
                      disabled={respondingTo === invitation.id}
                    >
                      {respondingTo === invitation.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      Aceptar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleRespond(invitation.id, 'reject')}
                      disabled={respondingTo === invitation.id}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Export a card version for dashboard
export function PendingInvitationsCard() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations')
      const data = await response.json()
      if (response.ok) {
        setInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [])

  const handleRespond = async (invitationId: string, action: 'accept' | 'reject') => {
    setRespondingTo(invitationId)
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Error al responder')
        return
      }

      toast.success(action === 'accept' ? 'Invitacion aceptada' : 'Invitacion rechazada')
      setInvitations(prev => prev.filter(i => i.id !== invitationId))
    } catch (error) {
      toast.error('Error al responder')
    } finally {
      setRespondingTo(null)
    }
  }

  if (isLoading || invitations.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Invitaciones pendientes
        </CardTitle>
        <CardDescription>
          Tienes {invitations.length} invitacion{invitations.length !== 1 ? 'es' : ''} a proyectos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="flex items-start gap-3 p-3 rounded-lg border">
            <div className="p-2 rounded-lg bg-primary/10">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{invitation.project.name}</p>
              <p className="text-sm text-muted-foreground">
                Invitado por {invitation.inviter.display_name || invitation.inviter.username} como {invitation.role}
              </p>
              {invitation.message && (
                <p className="text-sm text-muted-foreground mt-1 italic">
                  &quot;{invitation.message}&quot;
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => handleRespond(invitation.id, 'accept')}
                  disabled={respondingTo === invitation.id}
                >
                  {respondingTo === invitation.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRespond(invitation.id, 'reject')}
                  disabled={respondingTo === invitation.id}
                >
                  <X className="h-4 w-4 mr-1" />
                  Rechazar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
