'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Code,
  Palette,
  Music,
  Lightbulb,
  Users,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Loader2,
  Camera,
  Info,
} from 'lucide-react'
import { GiGamepad } from 'react-icons/gi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SkillLevelSelector, SkillLevelBars } from '@/components/ui/skill-level-selector'
import { EngineIcon } from '@/components/icons/engine-icon'
import { GenreIcon } from '@/components/icons/genre-icon'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { GAME_ENGINES, type GameEngineKey } from '@/lib/constants/engines'
import { GAME_GENRES } from '@/lib/constants/genres'
import { SKILL_CATEGORIES, SKILL_LEVELS, type SkillLevelKey } from '@/lib/constants/skills'
import type { UpdateTables, InsertTables } from '@/types/database'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TOTAL_STEPS = 4

interface SkillSelection {
  skillId: string
  name: string
  category: string
  level: SkillLevelKey
}

interface OnboardingData {
  username: string
  displayName: string
  bio: string
  avatarUrl: string
  customAvatarFile: File | null
  useCustomAvatar: boolean
  preferredEngines: string[]
  customEngine: string
  preferredGenres: string[]
  skills: SkillSelection[]
}

const categoryIcons = {
  programming: Code,
  art: Palette,
  audio: Music,
  design: Lightbulb,
  management: Users,
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [availableSkills, setAvailableSkills] = useState<Array<{ id: string; name: string; category: string }>>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['programming', 'art'])
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null)

  const [data, setData] = useState<OnboardingData>({
    username: '',
    displayName: '',
    bio: '',
    avatarUrl: '',
    customAvatarFile: null,
    useCustomAvatar: false,
    preferredEngines: [],
    customEngine: '',
    preferredGenres: [],
    skills: [],
  })

  useEffect(() => {
    const fetchSkills = async () => {
      const { data: skills } = await supabase
        .from('skills')
        .select('id, name, category')
        .order('category')

      if (skills) {
        setAvailableSkills(skills as { id: string; name: string; category: string }[])
      }
    }
    fetchSkills()
  }, [supabase])

  useEffect(() => {
    if (user) {
      // Fetch existing profile to get username
      const fetchProfile = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()

        const profileData = profile as { username: string } | null

        setData(prev => ({
          ...prev,
          username: profileData?.username || '',
          displayName: user.user_metadata?.full_name || user.user_metadata?.name || '',
          avatarUrl: user.user_metadata?.avatar_url || '',
        }))
      }
      fetchProfile()
    }
  }, [user, supabase])

  const progress = (currentStep / TOTAL_STEPS) * 100

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 2MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setCustomAvatarPreview(reader.result as string)
        setData(prev => ({
          ...prev,
          customAvatarFile: file,
          useCustomAvatar: true,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUseProviderAvatar = () => {
    setData(prev => ({
      ...prev,
      useCustomAvatar: false,
      customAvatarFile: null,
    }))
    setCustomAvatarPreview(null)
  }

  const toggleEngine = (engine: string) => {
    setData(prev => {
      const isRemoving = prev.preferredEngines.includes(engine)
      const newEngines = isRemoving
        ? prev.preferredEngines.filter(e => e !== engine)
        : [...prev.preferredEngines, engine].slice(0, 3)

      // Clear custom engine if "other" is deselected
      const newCustomEngine = engine === 'other' && isRemoving ? '' : prev.customEngine

      return {
        ...prev,
        preferredEngines: newEngines,
        customEngine: newCustomEngine,
      }
    })
  }

  const toggleGenre = (genre: string) => {
    setData(prev => ({
      ...prev,
      preferredGenres: prev.preferredGenres.includes(genre)
        ? prev.preferredGenres.filter(g => g !== genre)
        : [...prev.preferredGenres, genre].slice(0, 8),
    }))
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleSkill = (skill: { id: string; name: string; category: string }) => {
    setData(prev => {
      const exists = prev.skills.find(s => s.skillId === skill.id)
      if (exists) {
        return {
          ...prev,
          skills: prev.skills.filter(s => s.skillId !== skill.id),
        }
      }
      return {
        ...prev,
        skills: [...prev.skills, {
          skillId: skill.id,
          name: skill.name,
          category: skill.category,
          level: 'intermediate' as SkillLevelKey
        }],
      }
    })
  }

  const updateSkillLevel = (skillId: string, level: SkillLevelKey) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.map(s =>
        s.skillId === skillId ? { ...s, level } : s
      ),
    }))
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!data.customAvatarFile || !user?.id) return null

    const fileExt = data.customAvatarFile.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, data.customAvatarFile)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  const handleComplete = async () => {
    if (!user) {
      toast.error('No se encontro el usuario')
      return
    }

    setIsLoading(true)

    try {
      let finalAvatarUrl = data.avatarUrl

      if (data.useCustomAvatar && data.customAvatarFile) {
        const uploadedUrl = await uploadAvatar()
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl
        }
      }

      // If "other" is selected and has custom engine, use that; otherwise use first selected engine
      const preferredEngine = data.preferredEngines.includes('other') && data.customEngine
        ? `other:${data.customEngine}`
        : data.preferredEngines[0] || null

      const profileUpdate: UpdateTables<'profiles'> = {
        username: data.username,
        display_name: data.displayName || null,
        bio: data.bio || null,
        avatar_url: finalAvatarUrl || null,
        preferred_engine: preferredEngine,
        preferred_genres: data.preferredGenres.length > 0 ? data.preferredGenres : null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate as never)
        .eq('id', user.id)

      if (profileError) throw profileError

      if (data.skills.length > 0) {
        const skillsToInsert: InsertTables<'user_skills'>[] = data.skills.map(skill => ({
          user_id: user.id,
          skill_id: skill.skillId,
          level: skill.level as 'novice' | 'intermediate' | 'advanced' | 'expert',
        }))

        const { error: skillsError } = await supabase
          .from('user_skills')
          .upsert(skillsToInsert as never[], { onConflict: 'user_id,skill_id' })

        if (skillsError) throw skillsError
      }

      // Save engines to user_engines table
      if (data.preferredEngines.length > 0) {
        const enginesToInsert = data.preferredEngines.map((engine, index) => ({
          user_id: user.id,
          engine_key: engine === 'other' ? 'other' : engine,
          custom_name: engine === 'other' && data.customEngine ? data.customEngine : null,
          level: 'intermediate' as const,
          is_primary: index === 0,
        }))

        const { error: enginesError } = await supabase
          .from('user_engines')
          .upsert(enginesToInsert as never[], { onConflict: 'user_id,engine_key,custom_name' })

        if (enginesError) {
          console.error('Error saving engines:', enginesError)
        }
      }

      let xpAmount = 50
      if (data.bio) xpAmount += 10
      if (data.preferredEngines.length > 0) xpAmount += 15
      if (data.preferredGenres.length > 0) xpAmount += 15
      if (data.skills.length > 0) xpAmount += 10 + (data.skills.length * 5)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('add_user_xp', {
        p_user_id: user.id,
        p_amount: xpAmount,
        p_reason: 'Perfil completado durante onboarding',
        p_source_type: 'profile_completed',
      })

      toast.success(`Perfil completado! +${xpAmount} XP`)
      router.push('/dashboard')
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error('Error al guardar el perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.username.trim().length >= 3 && data.displayName.trim().length >= 2
      default:
        return true
    }
  }

  const calculateXpPreview = () => {
    let xp = 50
    if (data.bio) xp += 10
    if (data.preferredEngines.length > 0) xp += 15
    if (data.preferredGenres.length > 0) xp += 15
    if (data.skills.length > 0) xp += 10 + (data.skills.length * 5)
    return xp
  }

  const currentAvatarUrl = data.useCustomAvatar && customAvatarPreview
    ? customAvatarPreview
    : data.avatarUrl

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GiGamepad className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">GDev Toolkit</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Paso {currentStep} de {TOTAL_STEPS}
            </span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="container mx-auto px-4 py-4">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Bienvenido a GDev Toolkit!</CardTitle>
                    <CardDescription>
                      Cuentanos un poco sobre ti para personalizar tu experiencia
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Selection */}
                    <div className="space-y-4">
                      <Label>Foto de perfil</Label>
                      <div className="flex items-center gap-6">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={currentAvatarUrl} />
                            <AvatarFallback className="text-2xl">
                              {data.displayName?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Click en la imagen para cambiarla
                          </p>
                          {data.avatarUrl && data.useCustomAvatar && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleUseProviderAvatar}
                              className="text-xs p-0 h-auto"
                            >
                              Usar imagen de {user?.app_metadata?.provider || 'proveedor'}
                            </Button>
                          )}
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG o GIF. Max 2MB.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Nombre de usuario *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                        <Input
                          id="username"
                          placeholder="tu_nombre"
                          value={data.username}
                          onChange={(e) => setData({ ...data, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                          className="pl-8"
                          maxLength={20}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Solo letras, numeros y guiones bajos. Sera tu identificador unico.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="displayName">Nombre para mostrar *</Label>
                      <Input
                        id="displayName"
                        placeholder="Como quieres que te llamen?"
                        value={data.displayName}
                        onChange={(e) => setData({ ...data, displayName: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Este nombre sera visible para otros usuarios
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio (opcional) <span className="text-primary text-xs">+10 XP</span></Label>
                      <Textarea
                        id="bio"
                        placeholder="Cuentanos sobre ti, tus proyectos o intereses..."
                        value={data.bio}
                        onChange={(e) => setData({ ...data, bio: e.target.value })}
                        rows={3}
                        maxLength={300}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {data.bio.length}/300
                      </p>
                    </div>

                    {/* Info note */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-muted-foreground">
                        Todos estos datos los puedes modificar mas adelante desde tu perfil.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Engines & Genres */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <GiGamepad className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Tus Preferencias</CardTitle>
                    <CardDescription>
                      Esto nos ayuda a personalizar las sugerencias de la IA
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Engine Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Motores de juego <span className="text-primary text-xs">+15 XP</span></Label>
                        <span className="text-xs text-muted-foreground">
                          {data.preferredEngines.length}/3 seleccionados
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {Object.entries(GAME_ENGINES).map(([key, engine]) => {
                          const isSelected = data.preferredEngines.includes(key)
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleEngine(key)}
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
                                  <Check className="h-4 w-4 text-primary" />
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

                      {/* Custom engine input */}
                      {data.preferredEngines.includes('other') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <Label htmlFor="customEngine">¿Cual motor usas?</Label>
                          <Input
                            id="customEngine"
                            placeholder="Ej: Phaser, Pygame, Love2D, Defold..."
                            value={data.customEngine}
                            onChange={(e) => setData({ ...data, customEngine: e.target.value })}
                            maxLength={50}
                          />
                        </motion.div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Puedes agregar mas motores desde tu perfil.
                      </p>
                    </div>

                    {/* Genre Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Generos favoritos <span className="text-primary text-xs">+15 XP</span></Label>
                        <span className="text-xs text-muted-foreground">
                          {data.preferredGenres.length}/8 seleccionados
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {GAME_GENRES.map((genre) => {
                          const isSelected = data.preferredGenres.includes(genre.value)
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

                    {/* Info note */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-muted-foreground">
                        Puedes cambiar tus preferencias cuando quieras desde la configuracion de tu perfil.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Skills with Collapsible Categories */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Code className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Tus Habilidades</CardTitle>
                    <CardDescription>
                      Selecciona tus habilidades y nivel de experiencia <span className="text-primary">+10 XP base + 5 XP por skill</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Collapsible Categories */}
                    {Object.entries(SKILL_CATEGORIES).map(([categoryKey, category]) => {
                      const Icon = categoryIcons[categoryKey as keyof typeof categoryIcons]
                      const categorySkills = availableSkills.filter(s => s.category === categoryKey)
                      const isExpanded = expandedCategories.includes(categoryKey)
                      const selectedInCategory = data.skills.filter(s => s.category === categoryKey)

                      if (categorySkills.length === 0) return null

                      return (
                        <div key={categoryKey} className="border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleCategory(categoryKey)}
                            className={cn(
                              "w-full flex items-center justify-between p-4 transition-colors",
                              "hover:bg-muted/50",
                              isExpanded && "border-b"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("rounded-lg p-2", category.bgColor)}>
                                <Icon className={cn("h-5 w-5", category.color)} />
                              </div>
                              <span className="font-medium">{category.label}</span>
                              {selectedInCategory.length > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                  {selectedInCategory.length}
                                </Badge>
                              )}
                            </div>
                            <ChevronDown className={cn(
                              "h-5 w-5 transition-transform",
                              isExpanded && "rotate-180"
                            )} />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 space-y-2">
                                  {categorySkills.map((skill) => {
                                    const selectedSkill = data.skills.find(s => s.skillId === skill.id)
                                    const isSelected = !!selectedSkill

                                    return (
                                      <div
                                        key={skill.id}
                                        className={cn(
                                          "flex items-center justify-between p-3 rounded-lg border transition-all",
                                          isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                        )}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => toggleSkill(skill)}
                                          className="flex items-center gap-3 flex-1 text-left"
                                        >
                                          <div className={cn(
                                            "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                                            isSelected
                                              ? "bg-primary border-primary"
                                              : "border-muted-foreground/30"
                                          )}>
                                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                          </div>
                                          <span className="text-sm font-medium">{skill.name}</span>
                                        </button>

                                        {isSelected && selectedSkill && (
                                          <SkillLevelSelector
                                            value={selectedSkill.level}
                                            onChange={(level) => updateSkillLevel(skill.id, level)}
                                          />
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}

                    {/* Selected skills summary */}
                    {data.skills.length > 0 && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground mb-2">
                          {data.skills.length} habilidades seleccionadas
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {data.skills.map((skill) => (
                            <Badge key={skill.skillId} variant="secondary" className="gap-1">
                              {skill.name}
                              <SkillLevelBars level={skill.level} size="sm" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Info note */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-muted-foreground">
                        Las barras indican tu nivel: gris (principiante), azul (intermedio), morado (avanzado), amarillo (experto).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                      <Check className="h-8 w-8 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl">Todo Listo!</CardTitle>
                    <CardDescription>
                      Revisa tu perfil antes de continuar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Summary */}
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={currentAvatarUrl} />
                        <AvatarFallback className="text-xl">
                          {data.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{data.displayName}</h3>
                        {data.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{data.bio}</p>
                        )}
                      </div>
                    </div>

                    {/* Engines Summary */}
                    {data.preferredEngines.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Motores preferidos</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.preferredEngines.map((engine) => {
                            const engineData = GAME_ENGINES[engine as GameEngineKey]
                            return (
                              <Badge key={engine} variant="secondary" className="text-sm py-1 px-3 gap-2">
                                <EngineIcon engineKey={engine as GameEngineKey} size={16} />
                                {engineData?.label}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Genres Summary */}
                    {data.preferredGenres.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Generos favoritos</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.preferredGenres.map((genre) => {
                            const genreData = GAME_GENRES.find(g => g.value === genre)
                            return (
                              <Badge key={genre} variant="outline" className="text-sm py-1 px-3 gap-1">
                                {genreData && <GenreIcon iconName={genreData.iconName} size={14} />}
                                {genreData?.label}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Skills Summary */}
                    {data.skills.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Habilidades ({data.skills.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.skills.map((skill) => (
                            <Badge key={skill.skillId} variant="secondary" className="text-sm py-1 px-3 gap-2">
                              {skill.name}
                              <SkillLevelBars level={skill.level} size="sm" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* XP Reward */}
                    <div className="p-4 rounded-lg bg-primary/10 text-center">
                      <p className="text-sm text-muted-foreground">Al completar recibiras</p>
                      <p className="text-3xl font-bold text-primary">+{calculateXpPreview()} XP</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Base 50 XP + bonificaciones por completar tu perfil
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-6 h-12">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="w-32"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Atras
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button onClick={handleNext} disabled={!canProceed()} className="w-32">
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isLoading} className="w-40">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    Completar Perfil
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Skip Option */}
          {currentStep < TOTAL_STEPS && currentStep > 1 && (
            <p className="text-center mt-4">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleNext}
              >
                Saltar este paso
              </button>
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
