'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Trophy,
  Code,
  Palette,
  Music,
  Lightbulb,
  Users,
  Gamepad2,
  Loader2,
  ExternalLink,
  Calendar,
  MapPin,
  ArrowLeft,
  UserPlus,
  MessageSquare,
  FolderKanban,
  Clock,
  Star,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { GAME_ENGINES, type GameEngineKey } from '@/lib/constants/engines'
import { GAME_GENRES } from '@/lib/constants/genres'
import { EngineIcon } from '@/components/icons/engine-icon'
import { GenreIcon } from '@/components/icons/genre-icon'
import { SkillLevelBars } from '@/components/ui/skill-level-selector'
import { levelProgress, getLevelTitle, xpForNextLevel } from '@/lib/constants/xp-levels'
import { SKILL_LEVELS, type SkillLevelKey } from '@/lib/constants/skills'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const categoryIcons: Record<string, React.ElementType> = {
  programming: Code,
  art: Palette,
  audio: Music,
  design: Lightbulb,
  management: Users,
}

interface PublicProfile {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  role: string
  xpTotal: number
  xpLevel: number
  preferredEngine: string | null
  preferredGenres: string[]
  timezone: string | null
  lastActiveAt: string | null
  memberSince: string
  skills: Array<{
    id: string
    name: string
    category: string
    icon: string | null
    description: string | null
    level: string
    endorsedCount: number
  }>
  engines: Array<{
    key: string
    customName: string | null
    level: string
    isPrimary: boolean
  }>
  portfolio: Array<{
    id: string
    title: string
    description: string | null
    thumbnailUrl: string | null
    playUrl: string | null
    sourceUrl: string | null
    roleInProject: string | null
    technologiesUsed: string[]
    jamInfo: Record<string, unknown> | null
  }>
  ownedProjects: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    thumbnailUrl: string | null
    status: string
    isJamProject: boolean
    jamName: string | null
    engine: string | null
    genre: string | null
    createdAt: string
  }>
  memberProjects: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    thumbnailUrl: string | null
    status: string
    isJamProject: boolean
    jamName: string | null
    roles: string[]
  }>
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuthStore()
  const username = params.username as string

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/profiles/${username}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Error al cargar el perfil')
          return
        }

        setProfile(data)
      } catch (err) {
        setError('Error al cargar el perfil')
      } finally {
        setIsLoading(false)
      }
    }

    if (username) {
      fetchProfile()
    }
  }, [username])

  // Si es el usuario actual, redirigir a su página de perfil editable
  useEffect(() => {
    if (profile && currentUser && profile.id === currentUser.id) {
      router.replace('/profile')
    }
  }, [profile, currentUser, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Usuario no encontrado</h2>
        <p className="text-muted-foreground mb-4">{error || 'Este perfil no existe o no está disponible'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    )
  }

  const progress = levelProgress(profile.xpTotal)
  const currentLevel = profile.xpLevel
  const currentLevelXP = Math.pow(currentLevel - 1, 2) * 100
  const nextLevelXP = xpForNextLevel(currentLevel)
  const currentXP = profile.xpTotal - currentLevelXP
  const levelTitle = getLevelTitle(profile.xpLevel)

  // Group skills by category
  const skillsByCategory = profile.skills.reduce((acc, skill) => {
    const cat = skill.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(skill)
    return acc
  }, {} as Record<string, typeof profile.skills>)

  const getLastActiveText = () => {
    if (!profile.lastActiveAt) return 'Desconocido'
    const date = new Date(profile.lastActiveAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 5) return 'En linea'
    if (diffMins < 60) return `Hace ${diffMins} minutos`
    if (diffHours < 24) return `Hace ${diffHours} horas`
    if (diffDays < 7) return `Hace ${diffDays} dias`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and basic info */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatarUrl || ''} />
                <AvatarFallback className="text-4xl">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Level badge */}
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold">Nivel {profile.xpLevel}</span>
                <Badge variant="secondary">{levelTitle}</Badge>
              </div>

              {/* XP Progress */}
              <div className="w-full max-w-[200px]">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {currentXP} / {nextLevelXP} XP
                </p>
              </div>
            </div>

            {/* Profile details */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {profile.displayName || profile.username}
                </h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>

              {profile.bio && (
                <p className="text-muted-foreground">{profile.bio}</p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{getLastActiveText()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Miembro desde {new Date(profile.memberSince).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
                </div>
                {profile.timezone && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.timezone}</span>
                  </div>
                )}
              </div>

              {/* Preferred genres */}
              {profile.preferredGenres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.preferredGenres.map(genreKey => {
                    const genre = GAME_GENRES.find(g => g.value === genreKey)
                    return (
                      <Badge key={genreKey} variant="outline" className="gap-1">
                        {genre && <GenreIcon iconName={genre.iconName} size={12} />}
                        {genre?.label || genreKey}
                      </Badge>
                    )
                  })}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button disabled>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invitar a proyecto
                </Button>
                <Button variant="outline" disabled>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Mensaje
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList>
          <TabsTrigger value="skills" className="gap-2">
            <Star className="h-4 w-4" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="engines" className="gap-2">
            <Gamepad2 className="h-4 w-4" />
            Motores
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            Proyectos
          </TabsTrigger>
          {profile.portfolio.length > 0 && (
            <TabsTrigger value="portfolio" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
          )}
        </TabsList>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          {Object.keys(skillsByCategory).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Star className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">Este usuario aun no ha agregado skills</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(skillsByCategory).map(([category, skills]) => {
              const CategoryIcon = categoryIcons[category] || Code
              return (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CategoryIcon className="h-5 w-5" />
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {skills.map(skill => (
                        <div
                          key={skill.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-2">
                            {skill.icon && <span>{skill.icon}</span>}
                            <span className="font-medium">{skill.name}</span>
                          </div>
                          <SkillLevelBars level={skill.level as SkillLevelKey} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Engines Tab */}
        <TabsContent value="engines" className="space-y-4">
          {profile.engines.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Gamepad2 className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">Este usuario aun no ha agregado motores</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.engines.map(engine => {
                const engineData = GAME_ENGINES[engine.key as GameEngineKey]
                const levelData = SKILL_LEVELS[engine.level as SkillLevelKey]
                return (
                  <Card key={engine.key} className={cn(engine.isPrimary && 'border-primary')}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', engineData?.color || 'bg-muted')}>
                          <EngineIcon engineKey={engine.key as GameEngineKey} className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {engine.customName || engineData?.label || engine.key}
                            </span>
                            {engine.isPrimary && (
                              <Badge variant="default" className="text-xs">Principal</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <SkillLevelBars level={engine.level as SkillLevelKey} />
                            <span className="text-xs text-muted-foreground">
                              {levelData?.label || engine.level}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          {profile.ownedProjects.length === 0 && profile.memberProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">Este usuario no tiene proyectos publicos</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {profile.ownedProjects.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Proyectos propios</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {profile.ownedProjects.map(project => (
                      <Card key={project.id} className="overflow-hidden">
                        {project.thumbnailUrl && (
                          <div className="aspect-video bg-muted">
                            <img
                              src={project.thumbnailUrl}
                              alt={project.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h4 className="font-semibold">{project.name}</h4>
                          {project.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {project.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline">{project.status}</Badge>
                            {project.isJamProject && (
                              <Badge variant="secondary">{project.jamName || 'Jam'}</Badge>
                            )}
                            {project.engine && (
                              <Badge variant="secondary">
                                {GAME_ENGINES[project.engine as GameEngineKey]?.label || project.engine}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {profile.memberProjects.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Colaboraciones</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {profile.memberProjects.map(project => (
                      <Card key={project.id} className="overflow-hidden">
                        {project.thumbnailUrl && (
                          <div className="aspect-video bg-muted">
                            <img
                              src={project.thumbnailUrl}
                              alt={project.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h4 className="font-semibold">{project.name}</h4>
                          {project.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {project.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {project.roles?.map(role => (
                              <Badge key={role} variant="secondary">{role}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Portfolio Tab */}
        {profile.portfolio.length > 0 && (
          <TabsContent value="portfolio" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.portfolio.map(item => (
                <Card key={item.id} className="overflow-hidden">
                  {item.thumbnailUrl && (
                    <div className="aspect-video bg-muted">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h4 className="font-semibold">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                    {item.roleInProject && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Rol: {item.roleInProject}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      {item.playUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={item.playUrl} target="_blank" rel="noopener noreferrer">
                            <Gamepad2 className="mr-1 h-3 w-3" />
                            Jugar
                          </a>
                        </Button>
                      )}
                      {item.sourceUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <Code className="mr-1 h-3 w-3" />
                            Codigo
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
