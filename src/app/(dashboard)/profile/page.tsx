'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Edit2,
  Plus,
  Trophy,
  Star,
  Code,
  Palette,
  Music,
  Lightbulb,
  Users,
  RefreshCw,
  Settings,
  Gamepad2,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useUserStore } from '@/stores/user-store'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { levelProgress, getLevelTitle, xpForNextLevel } from '@/lib/constants/xp-levels'
import { SKILL_CATEGORIES, SKILL_LEVELS, type SkillLevelKey } from '@/lib/constants/skills'
import { GAME_ENGINES, type GameEngineKey } from '@/lib/constants/engines'
import { GAME_GENRES } from '@/lib/constants/genres'
import { EngineIcon } from '@/components/icons/engine-icon'
import { GenreIcon } from '@/components/icons/genre-icon'
import { SkillLevelBars } from '@/components/ui/skill-level-selector'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const categoryIcons = {
  programming: Code,
  art: Palette,
  audio: Music,
  design: Lightbulb,
  management: Users,
}

interface UserSkill {
  id: string
  name: string
  category: string
  level: SkillLevelKey
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useUserStore()
  const { user } = useAuthStore()

  const [userSkills, setUserSkills] = useState<UserSkill[]>([])
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false)
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)

  // Fetch user skills from database
  useEffect(() => {
    const fetchUserSkills = async () => {
      if (!user?.id) return

      setIsLoadingSkills(true)
      try {
        const { data, error } = await supabase
          .from('user_skills')
          .select(`
            id,
            level,
            skill:skills(id, name, category)
          `)
          .eq('user_id', user.id)

        if (error) throw error

        if (data) {
          const skills: UserSkill[] = data.map((item: { id: string; level: string; skill: { id: string; name: string; category: string } | null }) => ({
            id: item.id,
            name: item.skill?.name || '',
            category: item.skill?.category || '',
            level: item.level as SkillLevelKey,
          })).filter((s: UserSkill) => s.name)

          setUserSkills(skills)
        }
      } catch (error) {
        console.error('Error fetching skills:', error)
      } finally {
        setIsLoadingSkills(false)
      }
    }

    fetchUserSkills()
  }, [user?.id, supabase])

  const xpProgress = profile ? levelProgress(profile.xpTotal) : 0
  const levelTitle = profile ? getLevelTitle(profile.xpLevel) : ''
  const nextLevelXP = profile ? xpForNextLevel(profile.xpLevel) : 100

  // Reset onboarding function
  const handleResetOnboarding = async () => {
    if (!user?.id) return

    setIsResettingOnboarding(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: false,
          updated_at: new Date().toISOString()
        } as never)
        .eq('id', user.id)

      if (error) throw error

      toast.success('Onboarding reiniciado! Redirigiendo...')

      // Small delay then redirect
      setTimeout(() => {
        router.push('/onboarding')
      }, 1000)
    } catch (error) {
      console.error('Error resetting onboarding:', error)
      toast.error('Error al reiniciar el onboarding')
    } finally {
      setIsResettingOnboarding(false)
    }
  }

  // Get user's preferred engines and genres from profile
  const preferredEngines = profile?.preferredEngine ? [profile.preferredEngine] : []
  const preferredGenres = profile?.preferredGenres || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile?.avatarUrl || ''} />
            <AvatarFallback className="text-2xl">
              {profile?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div>
              <h1 className="text-3xl font-bold">
                {profile?.displayName || profile?.username || 'Usuario'}
              </h1>
              <p className="text-muted-foreground">@{profile?.username || 'username'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3" />
                Nivel {profile?.xpLevel || 1}
              </Badge>
              <Badge variant="outline">{levelTitle}</Badge>
            </div>
            {profile?.bio && (
              <p className="max-w-md text-sm text-muted-foreground">{profile.bio}</p>
            )}
          </div>
        </div>
        <Button variant="outline">
          <Edit2 className="mr-2 h-4 w-4" />
          Editar Perfil
        </Button>
      </div>

      {/* XP Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Progreso de Experiencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Nivel {profile?.xpLevel || 1}</span>
              <span>Nivel {(profile?.xpLevel || 1) + 1}</span>
            </div>
            <Progress value={xpProgress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{profile?.xpTotal || 0} XP total</span>
              <span>{Math.max(0, nextLevelXP - (profile?.xpTotal || 0))} XP para siguiente nivel</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Summary */}
      {(preferredEngines.length > 0 || preferredGenres.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              Preferencias de Desarrollo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preferredEngines.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Motores preferidos</h4>
                <div className="flex flex-wrap gap-2">
                  {preferredEngines.map((engine) => {
                    const engineData = GAME_ENGINES[engine as GameEngineKey]
                    return (
                      <Badge key={engine} variant="secondary" className="text-sm py-1 px-3 gap-2">
                        <EngineIcon engineKey={engine as GameEngineKey} size={16} />
                        {engineData?.label || engine}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {preferredGenres.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Géneros favoritos</h4>
                <div className="flex flex-wrap gap-2">
                  {preferredGenres.map((genre) => {
                    const genreData = GAME_GENRES.find(g => g.value === genre)
                    return (
                      <Badge key={genre} variant="outline" className="text-sm py-1 px-3 gap-1">
                        {genreData && <GenreIcon iconName={genreData.iconName} size={14} />}
                        {genreData?.label || genre}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList>
          <TabsTrigger value="skills">Habilidades</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Mis Habilidades</h2>
              <p className="text-sm text-muted-foreground">
                {userSkills.length > 0
                  ? `${userSkills.length} habilidades registradas`
                  : 'Agrega y gestiona tus habilidades de desarrollo'
                }
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Skill
            </Button>
          </div>

          {isLoadingSkills ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userSkills.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Code className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Sin habilidades</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  Aún no has agregado habilidades. Puedes hacerlo desde el onboarding o agregándolas manualmente.
                </p>
                <Button variant="outline" className="mt-4" onClick={handleResetOnboarding}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Completar Onboarding
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(SKILL_CATEGORIES).map(([key, category]) => {
                const Icon = categoryIcons[key as keyof typeof categoryIcons]
                const categorySkills = userSkills.filter((s) => s.category === key)

                if (categorySkills.length === 0) return null

                return (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className={cn("rounded-lg p-2", category.bgColor)}>
                          <Icon className={cn("h-4 w-4", category.color)} />
                        </div>
                        {category.label}
                        <Badge variant="secondary" className="ml-auto">
                          {categorySkills.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {categorySkills.map((skill) => {
                          const levelInfo = SKILL_LEVELS[skill.level]
                          return (
                            <div key={skill.id} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{skill.name}</span>
                              <div className="flex items-center gap-2">
                                <SkillLevelBars level={skill.level} size="md" />
                                <span className={cn("text-xs", levelInfo.color)}>
                                  {levelInfo.label}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="portfolio">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
              <CardDescription>
                Tus proyectos destacados y trabajos completados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Portfolio vacío</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Completa proyectos para agregar entradas a tu portfolio
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Tu historial de actividad y logros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Star className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Cuenta creada</p>
                    <p className="text-sm text-muted-foreground">
                      Bienvenido a GDev Toolkit! +50 XP
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Perfil
              </CardTitle>
              <CardDescription>
                Opciones avanzadas y configuración de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Onboarding Reset Section */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Reiniciar Onboarding</h4>
                  <p className="text-sm text-muted-foreground">
                    Vuelve a completar el proceso de onboarding para actualizar tus preferencias,
                    motores favoritos, géneros y habilidades.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleResetOnboarding}
                  disabled={isResettingOnboarding}
                >
                  {isResettingOnboarding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reiniciando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reiniciar Onboarding
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              {/* Account Info */}
              <div className="space-y-3">
                <h4 className="font-medium">Información de Cuenta</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{user?.email || 'No disponible'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usuario</span>
                    <span>@{profile?.username || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rol</span>
                    <Badge variant="outline">{profile?.role || 'user'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Miembro desde</span>
                    <span>
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
