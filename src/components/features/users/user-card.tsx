'use client'

import Link from 'next/link'
import { Gamepad2, Trophy, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { GAME_ENGINES } from '@/lib/constants/engines'
import { cn } from '@/lib/utils'

interface UserSkill {
  id?: string
  name?: string
  category?: string
  icon?: string
  level: string
}

interface UserEngine {
  key: string
  level: string
  isPrimary: boolean
}

export interface SearchUser {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  xpLevel: number
  preferredEngine: string | null
  preferredGenres: string[]
  lastActiveAt: string | null
  skills: UserSkill[]
  engines: UserEngine[]
}

interface UserCardProps {
  user: SearchUser
  onInvite?: (user: SearchUser) => void
  showInviteButton?: boolean
}

export function UserCard({ user, onInvite, showInviteButton = false }: UserCardProps) {
  const primaryEngine = user.engines.find(e => e.isPrimary) || user.engines[0]
  const engineInfo = primaryEngine ? GAME_ENGINES[primaryEngine.key] : null

  const getLastActiveText = () => {
    if (!user.lastActiveAt) return 'Nunca'
    const date = new Date(user.lastActiveAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 5) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins}m`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  // Top 3 skills
  const topSkills = user.skills.slice(0, 3)

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Avatar */}
          <Link href={`/profile/${user.username}`}>
            <Avatar className="h-16 w-16 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
              <AvatarImage src={user.avatarUrl || ''} />
              <AvatarFallback className="text-lg">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/profile/${user.username}`}
                  className="font-semibold hover:text-primary transition-colors"
                >
                  {user.displayName || user.username}
                </Link>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>Lvl {user.xpLevel}</span>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {user.bio}
              </p>
            )}

            {/* Engine + Skills */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {engineInfo && (
                <Badge variant="secondary" className="gap-1">
                  <Gamepad2 className="h-3 w-3" />
                  {engineInfo.label}
                </Badge>
              )}
              {topSkills.map(skill => (
                <Badge key={skill.id || skill.name} variant="outline" className="text-xs">
                  {skill.icon && <span className="mr-1">{skill.icon}</span>}
                  {skill.name}
                </Badge>
              ))}
              {user.skills.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{user.skills.length - 3} más
                </span>
              )}
            </div>

            {/* Last active + Actions */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{getLastActiveText()}</span>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/profile/${user.username}`}>Ver perfil</Link>
                </Button>
                {showInviteButton && onInvite && (
                  <Button size="sm" onClick={() => onInvite(user)}>
                    Invitar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
