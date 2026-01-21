'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, Loader2, UserPlus, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebounce } from '@/hooks/use-debounce'
import { toast } from 'sonner'

interface SearchUser {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  xpLevel: number
  skills: Array<{ name?: string }>
}

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
  onInviteSent?: () => void
}

const ROLES = [
  { value: 'member', label: 'Miembro' },
  { value: 'programmer', label: 'Programador' },
  { value: 'artist', label: 'Artista' },
  { value: 'designer', label: 'Disenador' },
  { value: 'audio', label: 'Audio' },
  { value: 'writer', label: 'Escritor' },
  { value: 'qa', label: 'QA/Testing' },
]

export function InviteMemberDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  onInviteSent,
}: InviteMemberDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<SearchUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null)
  const [role, setRole] = useState('member')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 300)

  const searchUsers = useCallback(async () => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setUsers([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/profiles/search?q=${encodeURIComponent(debouncedSearch)}&limit=5`)
      const data = await response.json()
      if (response.ok) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    searchUsers()
  }, [searchUsers])

  const handleSelectUser = (user: SearchUser) => {
    setSelectedUser(user)
    setSearchQuery('')
    setUsers([])
  }

  const handleSendInvitation = async () => {
    if (!selectedUser) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteeId: selectedUser.id,
          role,
          message: message || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Error al enviar invitacion')
        return
      }

      toast.success(`Invitacion enviada a ${selectedUser.displayName || selectedUser.username}`)
      setSelectedUser(null)
      setRole('member')
      setMessage('')
      onInviteSent?.()
      onOpenChange(false)
    } catch (error) {
      toast.error('Error al enviar invitacion')
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setUsers([])
    setSelectedUser(null)
    setRole('member')
    setMessage('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invitar miembro
          </DialogTitle>
          <DialogDescription>
            Invita a alguien a colaborar en {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedUser ? (
            <>
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              {/* Search results */}
              {isSearching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isSearching && users.length > 0 && (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                      onClick={() => handleSelectUser(user)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl || ''} />
                        <AvatarFallback>
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                      <Badge variant="secondary">Lvl {user.xpLevel}</Badge>
                    </button>
                  ))}
                </div>
              )}

              {!isSearching && debouncedSearch.length >= 2 && users.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No se encontraron usuarios
                </p>
              )}

              {!isSearching && debouncedSearch.length < 2 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Escribe al menos 2 caracteres para buscar
                </p>
              )}
            </>
          ) : (
            <>
              {/* Selected user */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser.avatarUrl || ''} />
                  <AvatarFallback>
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedUser.displayName || selectedUser.username}
                  </p>
                  <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  Cambiar
                </Button>
              </div>

              {/* Role selector */}
              <div className="space-y-2">
                <Label>Rol en el proyecto</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Mensaje (opcional)</Label>
                <Textarea
                  placeholder="Escribe un mensaje para el invitado..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Send button */}
              <Button
                className="w-full"
                onClick={handleSendInvitation}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar invitacion
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
