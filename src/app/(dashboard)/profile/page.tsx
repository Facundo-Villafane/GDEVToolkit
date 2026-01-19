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
  Loader2,
  ExternalLink,
  Link as LinkIcon,
  FolderKanban,
  Image as ImageIcon,
  X,
  Save,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

interface PortfolioItem {
  id: string
  title: string
  description: string
  url: string
  imageUrl?: string
  type: 'link' | 'image' | 'video'
}

interface EditProfileData {
  username: string
  displayName: string
  tagline: string
  bio: string
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile, refreshProfile } = useUserStore()
  const { user } = useAuthStore()

  const [userSkills, setUserSkills] = useState<UserSkill[]>([])
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false)
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)

  // Edit profile modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [editData, setEditData] = useState<EditProfileData>({
    username: '',
    displayName: '',
    tagline: '',
    bio: '',
  })

  // Portfolio modal
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false)
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: '',
    description: '',
    url: '',
    type: 'link' as const,
  })
  const [isSavingPortfolio, setIsSavingPortfolio] = useState(false)

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

  // Load edit data when modal opens
  useEffect(() => {
    if (isEditModalOpen && profile) {
      setEditData({
        username: profile.username || '',
        displayName: profile.displayName || '',
        tagline: (profile as { tagline?: string }).tagline || '',
        bio: profile.bio || '',
      })
    }
  }, [isEditModalOpen, profile])

  const xpProgress = profile ? levelProgress(profile.xpTotal) : 0
  const levelTitle = profile ? getLevelTitle(profile.xpLevel) : ''
  const nextLevelXP = profile ? xpForNextLevel(profile.xpLevel) : 100

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!user?.id) return

    setIsSavingProfile(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editData.username,
          display_name: editData.displayName || null,
          tagline: editData.tagline || null,
          bio: editData.bio || null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', user.id)

      if (error) throw error

      toast.success('Perfil actualizado!')
      setIsEditModalOpen(false)
      refreshProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Error al actualizar el perfil')
    } finally {
      setIsSavingProfile(false)
    }
  }

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

  // Add portfolio item (local state for now - can be persisted to DB later)
  const handleAddPortfolioItem = () => {
    if (!newPortfolioItem.title || !newPortfolioItem.url) {
      toast.error('Titulo y URL son requeridos')
      return
    }

    const item: PortfolioItem = {
      id: Date.now().toString(),
      ...newPortfolioItem,
    }

    setPortfolioItems(prev => [...prev, item])
    setNewPortfolioItem({ title: '', description: '', url: '', type: 'link' })
    setIsPortfolioModalOpen(false)
    toast.success('Item agregado al portfolio')
  }

  const handleRemovePortfolioItem = (id: string) => {
    setPortfolioItems(prev => prev.filter(item => item.id !== id))
  }

  // Get user's preferred engines and genres from profile
  const preferredEngines = profile?.preferredEngine ? [profile.preferredEngine] : []
  const preferredGenres = profile?.preferredGenres || []
  const tagline = (profile as { tagline?: string })?.tagline

  // Parse custom engine display
  const getEngineDisplay = (engine: string) => {
    if (engine.startsWith('other:')) {
      return engine.replace('other:', '')
    }
    const engineData = GAME_ENGINES[engine as GameEngineKey]
    return engineData?.label || engine
  }

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
          <div className="space-y-1">
            <div>
              <h1 className="text-3xl font-bold">
                {profile?.displayName || profile?.username || 'Usuario'}
              </h1>
              <p className="text-muted-foreground">@{profile?.username || 'username'}</p>
            </div>
            {tagline && (
              <p className="text-sm text-primary italic">{tagline}</p>
            )}
            <div className="flex items-center gap-3 pt-1">
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3" />
                Nivel {profile?.xpLevel || 1}
              </Badge>
              <Badge variant="outline">{levelTitle}</Badge>
            </div>
            {profile?.bio && (
              <p className="max-w-md text-sm text-muted-foreground pt-2">{profile.bio}</p>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
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
                <h4 className="text-sm font-medium text-muted-foreground">Motor preferido</h4>
                <div className="flex flex-wrap gap-2">
                  {preferredEngines.map((engine) => {
                    const isCustom = engine.startsWith('other:')
                    return (
                      <Badge key={engine} variant="secondary" className="text-sm py-1 px-3 gap-2">
                        {!isCustom && <EngineIcon engineKey={engine as GameEngineKey} size={16} />}
                        {getEngineDisplay(engine)}
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
          <TabsTrigger value="projects">Mis Proyectos</TabsTrigger>
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

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Mis Proyectos
              </CardTitle>
              <CardDescription>
                Proyectos creados en GDev Toolkit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Sin proyectos</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Aún no has creado proyectos en la plataforma
                </p>
                <Button className="mt-4" onClick={() => router.push('/projects/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Proyecto
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Portfolio</h2>
              <p className="text-sm text-muted-foreground">
                Muestra tus trabajos y proyectos externos
              </p>
            </div>
            <Button onClick={() => setIsPortfolioModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Item
            </Button>
          </div>

          {portfolioItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Portfolio vacío</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  Agrega enlaces a tus trabajos, juegos publicados, proyectos de itch.io, videos de YouTube, o cualquier trabajo que quieras mostrar.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setIsPortfolioModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar primer item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {portfolioItems.map((item) => (
                <Card key={item.id} className="group relative overflow-hidden">
                  <button
                    onClick={() => handleRemovePortfolioItem(item.id)}
                    className="absolute top-2 right-2 z-10 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <LinkIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                        >
                          Ver enlace
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Actualiza tu información personal. El email no puede ser modificado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Nombre de usuario</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="edit-username"
                  value={editData.username}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  className="pl-8"
                  maxLength={20}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-displayName">Nombre para mostrar</Label>
              <Input
                id="edit-displayName"
                value={editData.displayName}
                onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                placeholder="Tu nombre visible"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tagline">Tagline</Label>
              <Input
                id="edit-tagline"
                value={editData.tagline}
                onChange={(e) => setEditData({ ...editData, tagline: e.target.value })}
                placeholder="Ej: Indie dev | Unity enthusiast | Pixel art lover"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                Una frase corta que te describa (como en Reddit)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                placeholder="Cuéntanos sobre ti..."
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right">
                {editData.bio.length}/300
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Portfolio Item Modal */}
      <Dialog open={isPortfolioModalOpen} onOpenChange={setIsPortfolioModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agregar al Portfolio</DialogTitle>
            <DialogDescription>
              Agrega un enlace a tu trabajo, proyecto o cualquier cosa que quieras mostrar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio-title">Título *</Label>
              <Input
                id="portfolio-title"
                value={newPortfolioItem.title}
                onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })}
                placeholder="Ej: Mi primer juego en Unity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio-url">URL *</Label>
              <Input
                id="portfolio-url"
                type="url"
                value={newPortfolioItem.url}
                onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, url: e.target.value })}
                placeholder="https://itch.io/mi-juego"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio-description">Descripción</Label>
              <Textarea
                id="portfolio-description"
                value={newPortfolioItem.description}
                onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, description: e.target.value })}
                placeholder="Breve descripción del proyecto..."
                rows={2}
                maxLength={200}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPortfolioModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPortfolioItem} disabled={isSavingPortfolio}>
              {isSavingPortfolio ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
