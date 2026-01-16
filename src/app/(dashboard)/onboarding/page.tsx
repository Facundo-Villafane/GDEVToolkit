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
import { GAME_ENGINES } from '@/lib/constants/engines'
import { GAME_GENRES } from '@/lib/constants/genres'
import { SKILL_CATEGORIES, SKILL_LEVELS, type SkillLevelKey } from '@/lib/constants/skills'
import type { UpdateTables, InsertTables } from '@/types/database'
import { toast } from 'sonner'

const TOTAL_STEPS = 4

interface SkillSelection {
  skillId: string
  name: string
  category: string
  level: SkillLevelKey
}

interface OnboardingData {
  // Step 1: Basic Info
  displayName: string
  bio: string
  avatarUrl: string

  // Step 2: Preferences
  preferredEngine: string
  preferredGenres: string[]

  // Step 3: Skills
  skills: SkillSelection[]

  // Step 4: Confirmation
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

  const [data, setData] = useState<OnboardingData>({
    displayName: '',
    bio: '',
    avatarUrl: '',
    preferredEngine: '',
    preferredGenres: [],
    skills: [],
  })

  // Fetch available skills from DB
  useEffect(() => {
    const fetchSkills = async () => {
      const { data: skills } = await supabase
        .from('skills')
        .select('id, name, category')
        .order('category')

      if (skills) {
        setAvailableSkills(skills)
      }
    }
    fetchSkills()
  }, [supabase])

  // Pre-fill with user data if available
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

  const toggleGenre = (genre: string) => {
    setData(prev => ({
      ...prev,
      preferredGenres: prev.preferredGenres.includes(genre)
        ? prev.preferredGenres.filter(g => g !== genre)
        : [...prev.preferredGenres, genre].slice(0, 5), // Max 5 genres
    }))
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
          level: 'novice' as SkillLevelKey
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
      // Update profile
      const profileUpdate: UpdateTables<'profiles'> = {
        display_name: data.displayName || null,
        bio: data.bio || null,
        avatar_url: data.avatarUrl || null,
        preferred_engine: data.preferredEngine || null,
        preferred_genres: data.preferredGenres.length > 0 ? data.preferredGenres : null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate as never)
        .eq('id', user.id)

      if (profileError) throw profileError

      // Insert user skills
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

      // Add XP for completing onboarding
      // Note: RPC function types not defined in Database type yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('add_user_xp', {
        p_user_id: user.id,
        p_amount: 100,
        p_reason: 'Perfil completado durante onboarding',
        p_source_type: 'profile_completed',
      })

      toast.success('Perfil completado! +100 XP')
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
      case 2:
        return true // Optional step
      case 3:
        return true // Optional step
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">DevHub</span>
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
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
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
                    <CardTitle className="text-2xl">Bienvenido a DevHub!</CardTitle>
                    <CardDescription>
                      Cuentanos un poco sobre ti para personalizar tu experiencia
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Preview */}
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
                      <Label htmlFor="bio">Bio (opcional)</Label>
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

              {/* Step 2: Preferences */}
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
                  <CardContent className="space-y-6">
                    {/* Engine Selection */}
                    <div className="space-y-3">
                      <Label>Motor de juego preferido</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(GAME_ENGINES).map(([key, engine]) => (
                          <Button
                            key={key}
                            type="button"
                            variant={data.preferredEngine === key ? 'default' : 'outline'}
                            className="h-auto py-3 flex-col gap-1"
                            onClick={() => setData({ ...data, preferredEngine: key })}
                          >
                            <span className="text-sm font-medium">{engine.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Genre Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Generos favoritos</Label>
                        <span className="text-xs text-muted-foreground">
                          {data.preferredGenres.length}/5 seleccionados
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {GAME_GENRES.map((genre) => (
                          <Badge
                            key={genre.value}
                            variant={data.preferredGenres.includes(genre.value) ? 'default' : 'outline'}
                            className="cursor-pointer transition-colors"
                            onClick={() => toggleGenre(genre.value)}
                          >
                            {genre.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Skills */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Code className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Tus Habilidades</CardTitle>
                    <CardDescription>
                      Selecciona tus habilidades y nivel de experiencia
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Skills by Category */}
                    {Object.entries(SKILL_CATEGORIES).map(([categoryKey, category]) => {
                      const Icon = categoryIcons[categoryKey as keyof typeof categoryIcons]
                      const categorySkills = availableSkills.filter(s => s.category === categoryKey)

                      if (categorySkills.length === 0) return null

                      return (
                        <div key={categoryKey} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className={`rounded-lg p-1.5 ${category.color} bg-opacity-20`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <Label>{category.label}</Label>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {categorySkills.map((skill) => {
                              const isSelected = data.skills.some(s => s.skillId === skill.id)
                              return (
                                <Badge
                                  key={skill.id}
                                  variant={isSelected ? 'default' : 'outline'}
                                  className="cursor-pointer transition-colors"
                                  onClick={() => toggleSkill(skill)}
                                >
                                  {skill.name}
                                  {isSelected && <Check className="ml-1 h-3 w-3" />}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}

                    {/* Selected Skills with Level */}
                    {data.skills.length > 0 && (
                      <div className="space-y-3 pt-4 border-t">
                        <Label>Nivel de experiencia</Label>
                        <div className="space-y-2">
                          {data.skills.map((skill) => (
                            <div key={skill.skillId} className="flex items-center justify-between p-3 rounded-lg border">
                              <span className="font-medium">{skill.name}</span>
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
                                    {SKILL_LEVELS[level].label}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ))}
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

                    {/* Preferences Summary */}
                    {(data.preferredEngine || data.preferredGenres.length > 0) && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Preferencias</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.preferredEngine && (
                            <Badge variant="secondary">
                              {GAME_ENGINES[data.preferredEngine as keyof typeof GAME_ENGINES]?.label}
                            </Badge>
                          )}
                          {data.preferredGenres.map((genre) => (
                            <Badge key={genre} variant="outline">
                              {GAME_GENRES.find(g => g.value === genre)?.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills Summary */}
                    {data.skills.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Habilidades ({data.skills.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.skills.map((skill) => (
                            <Badge key={skill.skillId} variant="secondary">
                              {skill.name} - {SKILL_LEVELS[skill.level].label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* XP Reward */}
                    <div className="p-4 rounded-lg bg-primary/10 text-center">
                      <p className="text-sm text-muted-foreground">Al completar recibiras</p>
                      <p className="text-2xl font-bold text-primary">+100 XP</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Atras
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isLoading}>
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
                className="text-sm text-muted-foreground hover:text-foreground"
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
