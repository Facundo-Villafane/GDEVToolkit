'use client'

import { useState, useEffect, useRef } from 'react'
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
  Search,
  MoreVertical,
  Trash2,
  Heart,
  Camera,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useUserStore } from '@/stores/user-store'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { levelProgress, getLevelTitle, xpForNextLevel } from '@/lib/constants/xp-levels'
import { SKILL_CATEGORIES, SKILL_LEVELS, type SkillLevelKey } from '@/lib/constants/skills'
import { GAME_ENGINES, type GameEngineKey } from '@/lib/constants/engines'
import { GAME_GENRES } from '@/lib/constants/genres'
import { EngineIcon } from '@/components/icons/engine-icon'
import { GenreIcon } from '@/components/icons/genre-icon'
import { SkillLevelBars, SkillLevelSelector } from '@/components/ui/skill-level-selector'
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
  description: string | null
}

interface UserEngine {
  id: string
  engine_key: string
  custom_name: string | null
  level: SkillLevelKey
  is_primary: boolean
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
  const [userEngines, setUserEngines] = useState<UserEngine[]>([])
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false)
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)
  const [isLoadingEngines, setIsLoadingEngines] = useState(true)

  // Edit profile modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [editData, setEditData] = useState<EditProfileData>({
    username: '',
    displayName: '',
    tagline: '',
    bio: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

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

  // Add skill modal
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false)
  const [availableSkills, setAvailableSkills] = useState<Array<{ id: string; name: string; category: string }>>([])
  const [selectedSkillId, setSelectedSkillId] = useState('')
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<SkillLevelKey>('intermediate')
  const [isSavingSkill, setIsSavingSkill] = useState(false)
  const [skillSearchQuery, setSkillSearchQuery] = useState('')
  const [addSkillSearchQuery, setAddSkillSearchQuery] = useState('')
  const [isDeletingSkill, setIsDeletingSkill] = useState<string | null>(null)

  // Engine modal states
  const [isEngineModalOpen, setIsEngineModalOpen] = useState(false)
  const [selectedEngineKey, setSelectedEngineKey] = useState('')
  const [selectedEngineLevel, setSelectedEngineLevel] = useState<SkillLevelKey>('intermediate')
  const [customEngineName, setCustomEngineName] = useState('')
  const [isSavingEngine, setIsSavingEngine] = useState(false)
  const [isDeletingEngine, setIsDeletingEngine] = useState<string | null>(null)

  // Genre modal states
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [isSavingGenres, setIsSavingGenres] = useState(false)

  // Fetch user skills from database
  const fetchUserSkills = async () => {
    if (!user?.id) return

    setIsLoadingSkills(true)
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select(`
          id,
          level,
          skill:skills(id, name, category, description)
        `)
        .eq('user_id', user.id)

      if (error) throw error

      if (data) {
        const skills: UserSkill[] = data.map((item: { id: string; level: string; skill: { id: string; name: string; category: string; description: string | null } | null }) => ({
          id: item.id,
          name: item.skill?.name || '',
          category: item.skill?.category || '',
          level: item.level as SkillLevelKey,
          description: item.skill?.description || null,
        })).filter((s: UserSkill) => s.name)

        setUserSkills(skills)
      }
    } catch (error) {
      console.error('Error fetching skills:', error)
    } finally {
      setIsLoadingSkills(false)
    }
  }

  // Fetch user engines from database
  const fetchUserEngines = async () => {
    if (!user?.id) return

    setIsLoadingEngines(true)
    try {
      const { data, error } = await supabase
        .from('user_engines')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })

      if (error) throw error

      if (data) {
        setUserEngines(data as UserEngine[])
      }
    } catch (error) {
      console.error('Error fetching engines:', error)
    } finally {
      setIsLoadingEngines(false)
    }
  }

  useEffect(() => {
    fetchUserSkills()
    fetchUserEngines()
  }, [user?.id, supabase])

  // Fetch available skills for add modal
  useEffect(() => {
    const fetchAvailableSkills = async () => {
      const { data } = await supabase
        .from('skills')
        .select('id, name, category')
        .order('category')
        .order('name')

      if (data) {
        setAvailableSkills(data)
      }
    }
    fetchAvailableSkills()
  }, [supabase])

  // Load edit data when modal opens
  useEffect(() => {
    if (isEditModalOpen && profile) {
      setEditData({
        username: profile.username || '',
        displayName: profile.displayName || '',
        tagline: (profile as { tagline?: string }).tagline || '',
        bio: profile.bio || '',
      })
      setAvatarFile(null)
      setAvatarPreview(null)
    }
  }, [isEditModalOpen, profile])

  // Handle avatar file change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
        setAvatarFile(file)
      }
      reader.readAsDataURL(file)
    }
  }

  // Upload avatar to storage
  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user?.id) return null

    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  const xpProgress = profile ? levelProgress(profile.xpTotal) : 0
  const levelTitle = profile ? getLevelTitle(profile.xpLevel) : ''
  const nextLevelXP = profile ? xpForNextLevel(profile.xpLevel) : 100

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!user?.id) return

    setIsSavingProfile(true)
    try {
      let newAvatarUrl = profile?.avatarUrl

      // Upload avatar if changed
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar()
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: editData.username,
          display_name: editData.displayName || null,
          tagline: editData.tagline || null,
          bio: editData.bio || null,
          avatar_url: newAvatarUrl || null,
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

  // Add skill handler
  const handleAddSkill = async () => {
    if (!user?.id || !selectedSkillId) {
      toast.error('Selecciona una habilidad')
      return
    }

    // Check if skill already exists
    const skillExists = userSkills.some(s => {
      const matchingAvailable = availableSkills.find(a => a.id === selectedSkillId)
      return matchingAvailable && s.name === matchingAvailable.name
    })

    if (skillExists) {
      toast.error('Ya tienes esta habilidad registrada')
      return
    }

    setIsSavingSkill(true)
    try {
      const { error } = await supabase
        .from('user_skills')
        .insert({
          user_id: user.id,
          skill_id: selectedSkillId,
          level: selectedSkillLevel,
        } as never)

      if (error) throw error

      toast.success('Habilidad agregada!')
      setIsAddSkillModalOpen(false)
      setSelectedSkillId('')
      setSelectedSkillLevel('intermediate')
      fetchUserSkills()
    } catch (error) {
      console.error('Error adding skill:', error)
      toast.error('Error al agregar la habilidad')
    } finally {
      setIsSavingSkill(false)
    }
  }

  // Get skills not yet added by user
  const getUnaddedSkills = () => {
    const userSkillNames = userSkills.map(s => s.name)
    return availableSkills.filter(s => !userSkillNames.includes(s.name))
  }

  // Delete skill handler
  const handleDeleteSkill = async (skillId: string) => {
    if (!user?.id) return

    setIsDeletingSkill(skillId)
    try {
      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('id', skillId)

      if (error) throw error

      toast.success('Habilidad eliminada')
      fetchUserSkills()
    } catch (error) {
      console.error('Error deleting skill:', error)
      toast.error('Error al eliminar la habilidad')
    } finally {
      setIsDeletingSkill(null)
    }
  }

  // Filter skills by search query
  const filteredUserSkills = skillSearchQuery
    ? userSkills.filter(s => s.name.toLowerCase().includes(skillSearchQuery.toLowerCase()))
    : userSkills

  // Filter available skills for add modal
  const filteredAvailableSkills = addSkillSearchQuery
    ? getUnaddedSkills().filter(s => s.name.toLowerCase().includes(addSkillSearchQuery.toLowerCase()))
    : getUnaddedSkills()

  // Add engine handler
  const handleAddEngine = async () => {
    if (!user?.id || !selectedEngineKey) {
      toast.error('Selecciona un motor')
      return
    }

    if (selectedEngineKey === 'other' && !customEngineName.trim()) {
      toast.error('Ingresa el nombre del motor')
      return
    }

    // Check if engine already exists
    const engineExists = userEngines.some(e => {
      if (selectedEngineKey === 'other') {
        return e.engine_key === 'other' && e.custom_name === customEngineName.trim()
      }
      return e.engine_key === selectedEngineKey
    })

    if (engineExists) {
      toast.error('Ya tienes este motor registrado')
      return
    }

    setIsSavingEngine(true)
    try {
      const { error } = await supabase
        .from('user_engines')
        .insert({
          user_id: user.id,
          engine_key: selectedEngineKey,
          custom_name: selectedEngineKey === 'other' ? customEngineName.trim() : null,
          level: selectedEngineLevel,
          is_primary: userEngines.length === 0,
        } as never)

      if (error) throw error

      toast.success('Motor agregado!')
      setIsEngineModalOpen(false)
      setSelectedEngineKey('')
      setSelectedEngineLevel('intermediate')
      setCustomEngineName('')
      fetchUserEngines()
    } catch (error) {
      console.error('Error adding engine:', error)
      toast.error('Error al agregar el motor')
    } finally {
      setIsSavingEngine(false)
    }
  }

  // Delete engine handler
  const handleDeleteEngine = async (engineId: string) => {
    if (!user?.id) return

    setIsDeletingEngine(engineId)
    try {
      const { error } = await supabase
        .from('user_engines')
        .delete()
        .eq('id', engineId)

      if (error) throw error

      toast.success('Motor eliminado')
      fetchUserEngines()
    } catch (error) {
      console.error('Error deleting engine:', error)
      toast.error('Error al eliminar el motor')
    } finally {
      setIsDeletingEngine(null)
    }
  }

  // Get engine display name
  const getEngineDisplayName = (engine: UserEngine) => {
    if (engine.engine_key === 'other' && engine.custom_name) {
      return engine.custom_name
    }
    const engineData = GAME_ENGINES[engine.engine_key as GameEngineKey]
    return engineData?.label || engine.engine_key
  }

  // Get engines not yet added by user
  const getUnaddedEngines = () => {
    const userEngineKeys = userEngines.map(e => e.engine_key)
    return Object.entries(GAME_ENGINES).filter(([key]) => {
      // "other" can be added multiple times with different custom names
      if (key === 'other') return true
      return !userEngineKeys.includes(key)
    })
  }

  // Toggle genre in selection
  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : prev.length < 8 ? [...prev, genre] : prev
    )
  }

  // Open genre modal with current genres
  const openGenreModal = () => {
    setSelectedGenres(profile?.preferredGenres || [])
    setIsGenreModalOpen(true)
  }

  // Save genres
  const handleSaveGenres = async () => {
    if (!user?.id) return

    setIsSavingGenres(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferred_genres: selectedGenres.length > 0 ? selectedGenres : null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', user.id)

      if (error) throw error

      toast.success('Géneros actualizados!')
      setIsGenreModalOpen(false)
      refreshProfile()
    } catch (error) {
      console.error('Error saving genres:', error)
      toast.error('Error al guardar los géneros')
    } finally {
      setIsSavingGenres(false)
    }
  }

  // Get user's preferred genres from profile
  const preferredGenres = profile?.preferredGenres || []
  const tagline = (profile as { tagline?: string })?.tagline

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
        <Button variant="outline" size="icon" onClick={() => setIsEditModalOpen(true)} title="Editar Perfil">
          <Edit2 className="h-4 w-4" />
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

      {/* Preferences Summary - Engines with Levels */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              Preferencias de Desarrollo
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsEngineModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Motor
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Engines with Levels */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Motores de juego</h4>
            {isLoadingEngines ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : userEngines.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  No tienes motores registrados. Agrega los motores que usas y tu nivel de experiencia.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {userEngines.map((engine) => {
                  const levelInfo = SKILL_LEVELS[engine.level]
                  const isCustom = engine.engine_key === 'other'
                  return (
                    <div
                      key={engine.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        engine.is_primary && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-muted">
                        {!isCustom ? (
                          <EngineIcon engineKey={engine.engine_key as GameEngineKey} size={24} />
                        ) : (
                          <Gamepad2 className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {getEngineDisplayName(engine)}
                          </span>
                          {engine.is_primary && (
                            <Badge variant="secondary" className="text-xs">Principal</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <SkillLevelBars level={engine.level} size="md" />
                          <span className={cn("text-xs", levelInfo.color)}>
                            {levelInfo.label}
                          </span>
                        </div>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48" align="end">
                          <div className="space-y-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-destructive hover:text-destructive"
                              onClick={() => handleDeleteEngine(engine.id)}
                              disabled={isDeletingEngine === engine.id}
                            >
                              {isDeletingEngine === engine.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Eliminar
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Genres - editable */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">Géneros favoritos</h4>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openGenreModal} title="Editar géneros">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            {preferredGenres.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tienes géneros favoritos. Agrega los que más te gustan.
              </p>
            ) : (
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
            )}
          </div>
        </CardContent>
      </Card>

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
          {/* Header with search and add button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Mis Habilidades</h2>
              <p className="text-sm text-muted-foreground">
                {userSkills.length > 0
                  ? `${userSkills.length} habilidades registradas`
                  : 'Agrega y gestiona tus habilidades de desarrollo'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {userSkills.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar en el perfil"
                    value={skillSearchQuery}
                    onChange={(e) => setSkillSearchQuery(e.target.value)}
                    className="pl-9 w-[200px]"
                  />
                </div>
              )}
              <Button onClick={() => setIsAddSkillModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Skill
              </Button>
            </div>
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
                const categorySkills = filteredUserSkills.filter((s) => s.category === key)

                if (categorySkills.length === 0) return null

                return (
                  <Card key={key}>
                    <CardHeader className="pb-3">
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
                      <div className="space-y-2">
                        {categorySkills.map((skill) => {
                          const levelInfo = SKILL_LEVELS[skill.level]
                          return (
                            <div key={skill.id} className="flex items-center gap-2 group">
                              <Heart className="h-4 w-4 text-muted-foreground/30 hover:text-red-500 cursor-pointer transition-colors" />
                              <SkillLevelBars level={skill.level} size="md" />
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="start">
                                  <div className="space-y-3">
                                    <div className="font-semibold flex items-center justify-between">
                                      {skill.name}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteSkill(skill.id)}
                                        disabled={isDeletingSkill === skill.id}
                                      >
                                        {isDeletingSkill === skill.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                    {skill.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {skill.description}
                                      </p>
                                    )}
                                    <Separator />
                                    <div className="text-xs text-muted-foreground">
                                      <span className="font-medium">{category.label}</span>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium">Nivel de experiencia</p>
                                      <div className="flex items-center gap-2">
                                        <SkillLevelBars level={skill.level} size="md" />
                                        <span className={cn("text-sm", levelInfo.color)}>
                                          {levelInfo.label}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {levelInfo.description}
                                      </p>
                                    </div>
                                    <Separator />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteSkill(skill.id)}
                                      disabled={isDeletingSkill === skill.id}
                                    >
                                      {isDeletingSkill === skill.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                      )}
                                      Eliminar habilidad
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <span className="text-sm font-medium flex-1">{skill.name}</span>
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
              Actualiza tu información personal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview || profile?.avatarUrl || ''} />
                  <AvatarFallback className="text-xl">
                    {profile?.displayName?.[0] || profile?.username?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Foto de perfil</p>
                <p className="text-xs text-muted-foreground">JPG, PNG. Máx 2MB.</p>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null)
                      setAvatarPreview(null)
                    }}
                    className="text-xs text-destructive hover:underline mt-1"
                  >
                    Quitar cambio
                  </button>
                )}
              </div>
            </div>
            <Separator />
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
                Una frase corta que te describa
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

      {/* Add Skill Modal */}
      <Dialog open={isAddSkillModalOpen} onOpenChange={(open) => {
        setIsAddSkillModalOpen(open)
        if (!open) {
          setAddSkillSearchQuery('')
          setSelectedSkillId('')
          setSelectedSkillLevel('intermediate')
        }
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Agregar Habilidad</DialogTitle>
            <DialogDescription>
              Busca y selecciona una habilidad para agregar a tu perfil.
            </DialogDescription>
          </DialogHeader>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar habilidad..."
              value={addSkillSearchQuery}
              onChange={(e) => setAddSkillSearchQuery(e.target.value)}
              className="pl-9"
            />
            {addSkillSearchQuery && (
              <button
                onClick={() => setAddSkillSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Skills List */}
          <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[400px] border rounded-lg">
            {filteredAvailableSkills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {addSkillSearchQuery
                    ? 'No se encontraron habilidades'
                    : 'Ya agregaste todas las habilidades disponibles'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredAvailableSkills.map((skill) => {
                  const category = SKILL_CATEGORIES[skill.category as keyof typeof SKILL_CATEGORIES]
                  const isSelected = selectedSkillId === skill.id
                  return (
                    <button
                      key={skill.id}
                      onClick={() => setSelectedSkillId(isSelected ? '' : skill.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors",
                        isSelected && "bg-primary/10"
                      )}
                    >
                      <Heart className={cn(
                        "h-4 w-4 transition-colors",
                        isSelected ? "text-red-500 fill-red-500" : "text-muted-foreground/30"
                      )} />
                      <SkillLevelBars level={isSelected ? selectedSkillLevel : 'novice'} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{skill.name}</p>
                        <p className="text-xs text-muted-foreground">{category?.label}</p>
                      </div>
                      {isSelected && (
                        <Badge variant="secondary" className="shrink-0">
                          Seleccionado
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Level Selector - Only show when skill is selected */}
          {selectedSkillId && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <Label className="text-sm font-medium">Nivel de experiencia</Label>
              <div className="flex items-center gap-4">
                <SkillLevelSelector
                  value={selectedSkillLevel}
                  onChange={setSelectedSkillLevel}
                />
                <span className={cn("text-sm font-medium", SKILL_LEVELS[selectedSkillLevel].color)}>
                  {SKILL_LEVELS[selectedSkillLevel].label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {SKILL_LEVELS[selectedSkillLevel].description}
              </p>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsAddSkillModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddSkill} disabled={isSavingSkill || !selectedSkillId}>
              {isSavingSkill ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Habilidad
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Engine Modal */}
      <Dialog open={isEngineModalOpen} onOpenChange={(open) => {
        setIsEngineModalOpen(open)
        if (!open) {
          setSelectedEngineKey('')
          setSelectedEngineLevel('intermediate')
          setCustomEngineName('')
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Motor de Juego</DialogTitle>
            <DialogDescription>
              Selecciona un motor y tu nivel de experiencia con el.
            </DialogDescription>
          </DialogHeader>

          {/* Engine Selection Grid */}
          <div className="space-y-4 py-4">
            <Label>Selecciona un motor</Label>
            <div className="grid grid-cols-3 gap-3">
              {getUnaddedEngines().map(([key, engine]) => {
                const isSelected = selectedEngineKey === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedEngineKey(isSelected ? '' : key)}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                      "hover:scale-105 hover:shadow-md",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                    <div className="h-8 w-8 mb-2 flex items-center justify-center">
                      <EngineIcon engineKey={key as GameEngineKey} size={28} />
                    </div>
                    <span className="text-xs font-medium text-center">{engine.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Custom engine name input */}
            {selectedEngineKey === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="customEngineName">Nombre del motor</Label>
                <Input
                  id="customEngineName"
                  placeholder="Ej: Phaser, Pygame, Love2D, Defold..."
                  value={customEngineName}
                  onChange={(e) => setCustomEngineName(e.target.value)}
                  maxLength={50}
                />
              </div>
            )}

            {/* Level Selector */}
            {selectedEngineKey && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <Label className="text-sm font-medium">Nivel de experiencia</Label>
                <div className="flex items-center gap-4">
                  <SkillLevelSelector
                    value={selectedEngineLevel}
                    onChange={setSelectedEngineLevel}
                  />
                  <span className={cn("text-sm font-medium", SKILL_LEVELS[selectedEngineLevel].color)}>
                    {SKILL_LEVELS[selectedEngineLevel].label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {SKILL_LEVELS[selectedEngineLevel].description}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEngineModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddEngine}
              disabled={isSavingEngine || !selectedEngineKey || (selectedEngineKey === 'other' && !customEngineName.trim())}
            >
              {isSavingEngine ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Motor
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Genres Modal */}
      <Dialog open={isGenreModalOpen} onOpenChange={setIsGenreModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Géneros Favoritos</DialogTitle>
            <DialogDescription>
              Selecciona hasta 8 géneros de juegos que te gusten.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                {selectedGenres.length}/8 seleccionados
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {GAME_GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre.value)
                return (
                  <button
                    key={genre.value}
                    type="button"
                    onClick={() => toggleGenre(genre.value)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border transition-all",
                      "hover:scale-105",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <GenreIcon iconName={genre.iconName} size={20} className="mb-1" />
                    <span className="text-xs font-medium text-center leading-tight">{genre.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenreModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGenres} disabled={isSavingGenres}>
              {isSavingGenres ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Géneros
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
