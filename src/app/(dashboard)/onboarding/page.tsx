'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Code,
  Palette,
  Music,
  Lightbulb,
  Users,
  Gamepad2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  displayName: string
  bio: string
  avatarUrl: string
  preferredEngines: string[]
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

  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [availableSkills, setAvailableSkills] = useState<Array<{ id: string; name: string; category: string }>>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['programming', 'art'])

  const [data, setData] = useState<OnboardingData>({
    displayName: '',
    bio: '',
    avatarUrl: '',
    preferredEngines: [],
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
    if (user?.user_metadata) {
      setData(prev => ({
        ...prev,
        displayName: user.user_metadata.full_name || user.user_metadata.name || '',
        avatarUrl: user.user_metadata.avatar_url || '',
      }))
    }
  }, [user])

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

  const toggleEngine = (engine: string) => {
    setData(prev => ({
      ...prev,
      preferredEngines: prev.preferredEngines.includes(engine)
        ? prev.preferredEngines.filter(e => e !== engine)
        : [...prev.preferredEngines, engine].slice(0, 5),
    }))
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

  const handleComplete = async () => {
    if (!user) {
      toast.error('No se encontro el usuario')
      return
    }

    setIsLoading(true)

    try {
      const profileUpdate: UpdateTables<'profiles'> = {
        display_name: data.displayName || null,
        bio: data.bio || null,
        avatar_url: data.avatarUrl || null,
        preferred_engine: data.preferredEngines[0] || null,
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

      // Calculate XP based on profile completeness
      let xpAmount = 50 // Base XP
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
        return data.displayName.trim().length >= 2
      default:
        return true
    }
  }

  // Calculate XP preview
  const calculateXpPreview = () => {
    let xp = 50
    if (data.bio) xp += 10
    if (data.preferredEngines.length > 0) xp += 15
    if (data.preferredGenres.length > 0) xp += 15
    if (data.skills.length > 0) xp += 10 + (data.skills.length * 5)
    return xp
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
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
                    <div className="flex justify-center">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={data.avatarUrl} />
                        <AvatarFallback className="text-2xl">
                          {data.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
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
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Engines & Genres */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Gamepad2 className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Tus Preferencias</CardTitle>
                    <CardDescription>
                      Esto nos ayuda a personalizar las sugerencias de la IA
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Engine Selection - Grid with Icons */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base">Motores de juego <span className="text-primary text-xs">+15 XP</span></Label>
                        <span className="text-xs text-muted-foreground">
                          {data.preferredEngines.length}/5 seleccionados
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
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
                              <span className="text-2xl mb-2">{engine.icon}</span>
                              <span className="text-sm font-medium text-center">{engine.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Genre Selection - Grid Boxes */}
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
                              <span className="text-xl mb-1">{genre.icon}</span>
                              <span className="text-xs font-medium text-center leading-tight">{genre.label}</span>
                            </button>
                          )
                        })}
                      </div>
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
                      const selectedCount = data.skills.filter(s => s.category === categoryKey).length

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
                              {selectedCount > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                  {selectedCount} seleccionadas
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
                                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {categorySkills.map((skill) => {
                                    const isSelected = data.skills.some(s => s.skillId === skill.id)
                                    return (
                                      <button
                                        key={skill.id}
                                        type="button"
                                        onClick={() => toggleSkill(skill)}
                                        className={cn(
                                          "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                                          "hover:shadow-sm",
                                          isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                        )}
                                      >
                                        <span className="text-sm font-medium">{skill.name}</span>
                                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                                      </button>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}

                    {/* Selected Skills with Level Selection */}
                    {data.skills.length > 0 && (
                      <div className="mt-6 space-y-4 pt-4 border-t">
                        <Label className="text-base">Nivel de experiencia</Label>
                        <div className="space-y-2">
                          {data.skills.map((skill) => {
                            const skillLevel = SKILL_LEVELS[skill.level]
                            return (
                              <div key={skill.skillId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{skill.name}</span>
                                  <span className={cn("text-xs", skillLevel.color)}>
                                    {skillLevel.label}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  {(Object.keys(SKILL_LEVELS) as SkillLevelKey[]).map((level) => (
                                    <Button
                                      key={level}
                                      type="button"
                                      size="sm"
                                      variant={skill.level === level ? 'default' : 'ghost'}
                                      className="text-xs h-7 px-2"
                                      onClick={() => updateSkillLevel(skill.skillId, level)}
                                    >
                                      {SKILL_LEVELS[level].label.substring(0, 3)}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
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
                        <AvatarImage src={data.avatarUrl} />
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
                              <Badge key={engine} variant="secondary" className="text-sm py-1 px-3">
                                <span className="mr-1">{engineData?.icon}</span>
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
                              <Badge key={genre} variant="outline" className="text-sm py-1 px-3">
                                <span className="mr-1">{genreData?.icon}</span>
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
                            <Badge key={skill.skillId} variant="secondary" className="text-sm py-1 px-3">
                              {skill.name}
                              <span className={cn("ml-1 text-xs", SKILL_LEVELS[skill.level].color)}>
                                ({SKILL_LEVELS[skill.level].label})
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* XP Reward - Dynamic */}
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

          {/* Navigation - Fixed Height */}
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
