'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Loader2,
  Users,
  Shield,
  ShieldCheck,
  User,
  MoreVertical,
  Trophy,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/user-store'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface UserProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  role: string
  xp_level: number
  xp_total: number
  onboarding_completed: boolean
  created_at: string
  email?: string
}

const roles = [
  { value: 'user', label: 'Usuario', icon: User, color: 'text-muted-foreground' },
  { value: 'moderator', label: 'Moderador', icon: Shield, color: 'text-blue-500' },
  { value: 'admin', label: 'Administrador', icon: ShieldCheck, color: 'text-primary' },
]

export default function UsersManagementPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useUserStore()
  const { user: currentUser, isLoading: isAuthLoading, isAuthenticated } = useAuthStore()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')

  // Change role dialog
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [newRole, setNewRole] = useState<string>('')
  const [isChangingRole, setIsChangingRole] = useState(false)

  // Check admin access
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      if (profile && profile.role !== 'admin') {
        router.push('/dashboard')
        toast.error('No tienes permisos para acceder a esta sección')
        return
      }
    }
  }, [isAuthLoading, isAuthenticated, profile, router])

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error al cargar los usuarios')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUsers()
    }
  }, [profile])

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  // Change user role
  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return

    // Prevent changing own role
    if (selectedUser.id === currentUser?.id) {
      toast.error('No puedes cambiar tu propio rol')
      return
    }

    setIsChangingRole(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole } as never)
        .eq('id', selectedUser.id)

      if (error) throw error

      toast.success(`Rol de ${selectedUser.username} actualizado a ${newRole}`)
      setIsRoleDialogOpen(false)
      setSelectedUser(null)
      setNewRole('')
      fetchUsers()
    } catch (error) {
      console.error('Error changing role:', error)
      toast.error('Error al cambiar el rol')
    } finally {
      setIsChangingRole(false)
    }
  }

  // Open role change dialog
  const openRoleDialog = (user: UserProfile, role: string) => {
    setSelectedUser(user)
    setNewRole(role)
    setIsRoleDialogOpen(true)
  }

  // Get role stats
  const getRoleStats = () => {
    const stats: Record<string, number> = { user: 0, moderator: 0, admin: 0 }
    users.forEach((user) => {
      if (stats[user.role] !== undefined) {
        stats[user.role]++
      }
    })
    return stats
  }

  const roleStats = getRoleStats()

  // Show loading while checking auth
  if (isAuthLoading || !profile || profile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} usuarios registrados
          </p>
        </div>
      </div>

      {/* Role Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => {
          const Icon = role.icon
          const count = roleStats[role.value] || 0
          return (
            <Card
              key={role.value}
              className={cn(
                "cursor-pointer transition-colors hover:border-primary/50",
                selectedRole === role.value && "border-primary"
              )}
              onClick={() => setSelectedRole(selectedRole === role.value ? 'all' : role.value)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-muted p-2">
                  <Icon className={cn("h-5 w-5", role.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{role.label}s</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por username o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>
            {filteredUsers.length} de {users.length} usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {searchQuery || selectedRole !== 'all'
                  ? 'No se encontraron usuarios con esos filtros'
                  : 'No hay usuarios registrados'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const roleInfo = roles.find((r) => r.value === user.role) || roles[0]
                  const RoleIcon = roleInfo.icon
                  const isCurrentUser = user.id === currentUser?.id

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback>
                              {user.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.display_name || user.username}
                              {isCurrentUser && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Tú
                                </Badge>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className="gap-1"
                        >
                          <RoleIcon className="h-3 w-3" />
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span>{user.xp_level}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.onboarding_completed ? 'secondary' : 'outline'}>
                          {user.onboarding_completed ? 'Activo' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Cambiar rol</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {roles.map((role) => {
                              const Icon = role.icon
                              const isActive = user.role === role.value
                              return (
                                <DropdownMenuItem
                                  key={role.value}
                                  disabled={isActive || isCurrentUser}
                                  onClick={() => openRoleDialog(user, role.value)}
                                  className={cn(isActive && "bg-muted")}
                                >
                                  <Icon className={cn("mr-2 h-4 w-4", role.color)} />
                                  {role.label}
                                  {isActive && <span className="ml-auto text-xs">(actual)</span>}
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Change Role Dialog */}
      <AlertDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar rol de usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cambiar el rol de{' '}
              <span className="font-medium">{selectedUser?.username}</span> a{' '}
              <span className="font-medium">
                {roles.find((r) => r.value === newRole)?.label}
              </span>
              ?
              {newRole === 'admin' && (
                <span className="block mt-2 text-destructive">
                  Advertencia: Los administradores tienen acceso completo a la plataforma.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangeRole}
              disabled={isChangingRole}
            >
              {isChangingRole ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              Cambiar rol
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
