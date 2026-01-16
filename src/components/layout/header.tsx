'use client'

import { Bell, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useUserStore } from '@/stores/user-store'
import { useAuth } from '@/hooks/use-auth'
import { levelProgress, getLevelTitle } from '@/lib/constants/xp-levels'

export function Header() {
  const { profile } = useUserStore()
  const { signOut } = useAuth()

  const xpProgress = profile ? levelProgress(profile.xpTotal) : 0
  const levelTitle = profile ? getLevelTitle(profile.xpLevel) : ''

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar proyectos, tareas..."
            className="w-64 pl-9"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* AI Assistant Button */}
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI Asistente
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            3
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatarUrl || ''} />
                <AvatarFallback>
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-sm font-medium">
                  {profile?.displayName || profile?.username || 'Usuario'}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Lvl {profile?.xpLevel || 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {levelTitle}
                  </span>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-2">
                <span>{profile?.displayName || profile?.username}</span>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>XP: {profile?.xpTotal || 0}</span>
                    <span>Nivel {profile?.xpLevel || 1}</span>
                  </div>
                  <Progress value={xpProgress} className="h-1" />
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/profile">Mi Perfil</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/profile/portfolio">Mi Portfolio</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/settings">Configuracion</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="text-destructive focus:text-destructive"
            >
              Cerrar Sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
