'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lightbulb,
  Sparkles,
  Trophy,
  Clock,
  Gamepad2,
  Wand2,
  Check,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GAME_GENRES, ART_STYLES } from '@/lib/constants/genres'
import { GAME_ENGINES } from '@/lib/constants/engines'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// Tipos para el wizard
type WizardPath = 'have_idea' | 'need_help' | null
type WizardStep = 'choose_path' | 'jam_question' | 'jam_details' | 'brainstorm' | 'idea_form' | 'review'

interface GameIdea {
  name: string
  elevator_pitch: string
  genre: string
  core_mechanic: string
  unique_twist: string
  art_style_suggestion: string
  scope_assessment: 'muy_simple' | 'simple' | 'moderado'
  why_it_works: string
}

interface BrainstormResponse {
  ideas: GameIdea[]
  creative_questions: string[]
  theme_interpretation?: string
}

interface ProjectData {
  name: string
  description: string
  genre: string
  artStyle: string
  engine: string
  coreMechanic: string
  // Jam specific
  isJamProject: boolean
  jamName: string
  jamTheme: string
  jamTotalHours: number
}

const INITIAL_PROJECT_DATA: ProjectData = {
  name: '',
  description: '',
  genre: '',
  artStyle: '',
  engine: '',
  coreMechanic: '',
  isJamProject: false,
  jamName: '',
  jamTheme: '',
  jamTotalHours: 48,
}

export default function NewProjectPage() {
  const router = useRouter()
  const supabase = createClient()

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('choose_path')
  const [selectedPath, setSelectedPath] = useState<WizardPath>(null)
  const [projectData, setProjectData] = useState<ProjectData>(INITIAL_PROJECT_DATA)

  // AI Brainstorm state
  const [isGenerating, setIsGenerating] = useState(false)
  const [brainstormInput, setBrainstormInput] = useState('')
  const [brainstormResult, setBrainstormResult] = useState<BrainstormResponse | null>(null)
  const [selectedIdea, setSelectedIdea] = useState<GameIdea | null>(null)

  // User context for AI
  const [userContext, setUserContext] = useState<{
    preferredGenres: string[]
    preferredEngine: string | null
    experienceLevel: string | null
  }>({
    preferredGenres: [],
    preferredEngine: null,
    experienceLevel: null,
  })

  // Loading states
  const [isLoading, setIsLoading] = useState(false)

  // Fetch user preferences on mount
  useEffect(() => {
    const fetchUserContext = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_genres')
        .eq('id', user.id)
        .single()

      const { data: engines } = await supabase
        .from('user_engines')
        .select('engine_key, level, is_primary')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single()

      const profileData = profile as { preferred_genres: string[] | null } | null
      const enginesData = engines as { engine_key: string; level: string; is_primary: boolean } | null

      setUserContext({
        preferredGenres: profileData?.preferred_genres || [],
        preferredEngine: enginesData?.engine_key || null,
        experienceLevel: enginesData?.level || null,
      })

      // Pre-fill engine if user has a primary one
      if (enginesData?.engine_key) {
        setProjectData(prev => ({ ...prev, engine: enginesData.engine_key }))
      }
    }

    fetchUserContext()
  }, [supabase])

  // Navigation helpers
  const goToStep = (step: WizardStep) => {
    setCurrentStep(step)
  }

  const handlePathSelection = (path: WizardPath) => {
    setSelectedPath(path)
    goToStep('jam_question')
  }

  const handleJamQuestion = (isJam: boolean) => {
    setProjectData(prev => ({ ...prev, isJamProject: isJam }))
    if (isJam) {
      goToStep('jam_details')
    } else {
      goToStep(selectedPath === 'need_help' ? 'brainstorm' : 'idea_form')
    }
  }

  const handleJamDetailsNext = () => {
    goToStep(selectedPath === 'need_help' ? 'brainstorm' : 'idea_form')
  }

  // AI Brainstorm
  const handleBrainstorm = async () => {
    setIsGenerating(true)
    setBrainstormResult(null)

    try {
      const response = await fetch('/api/ai/oracle/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: brainstormInput,
          jamTheme: projectData.isJamProject ? projectData.jamTheme : null,
          jamHours: projectData.isJamProject ? projectData.jamTotalHours : null,
          preferredGenres: userContext.preferredGenres,
          preferredEngine: userContext.preferredEngine,
          experienceLevel: userContext.experienceLevel,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate ideas')
      }

      const data = await response.json()
      setBrainstormResult(data)
    } catch (error) {
      toast.error('Error al generar ideas. Por favor intenta de nuevo.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectIdea = (idea: GameIdea) => {
    setSelectedIdea(idea)
    setProjectData(prev => ({
      ...prev,
      name: idea.name,
      description: idea.elevator_pitch,
      genre: idea.genre.toLowerCase().replace(/\s+/g, '_'),
      coreMechanic: idea.core_mechanic,
      // artStyle will need to be selected manually
    }))
    goToStep('idea_form')
  }

  // Project submission
  const handleSubmit = async () => {
    if (!projectData.name.trim()) {
      toast.error('El nombre del proyecto es requerido')
      return
    }

    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Debes iniciar sesion para crear un proyecto')
        return
      }

      const slug = projectData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { data, error } = await supabase
        .from('projects')
        .insert({
          owner_id: user.id,
          name: projectData.name,
          slug,
          description: projectData.description || null,
          genre: projectData.genre || null,
          art_style: projectData.artStyle || null,
          engine: projectData.engine || null,
          is_jam_project: projectData.isJamProject,
          jam_name: projectData.isJamProject ? projectData.jamName : null,
          jam_theme: projectData.isJamProject ? projectData.jamTheme : null,
          jam_total_hours: projectData.isJamProject ? projectData.jamTotalHours : null,
          status: 'draft' as const,
        } as never)
        .select()
        .single()

      if (error) throw error

      const project = data as { id: string } | null

      // Create initial project context if we have a core mechanic
      if (projectData.coreMechanic && project) {
        await supabase.from('project_contexts').insert({
          project_id: project.id,
          gdd: {
            name: projectData.name,
            genre: projectData.genre,
            coreMechanic: projectData.coreMechanic,
            artStyle: projectData.artStyle,
            elevator_pitch: projectData.description,
          },
        } as never)
      }

      toast.success('Proyecto creado exitosamente!')
      router.push(`/projects/${project?.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Error al crear el proyecto')
    } finally {
      setIsLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Step indicator
  const getStepNumber = () => {
    const steps: WizardStep[] = ['choose_path', 'jam_question']
    if (projectData.isJamProject) steps.push('jam_details')
    if (selectedPath === 'need_help') steps.push('brainstorm')
    steps.push('idea_form', 'review')

    return {
      current: steps.indexOf(currentStep) + 1,
      total: steps.length,
    }
  }

  const stepInfo = getStepNumber()

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Nuevo Proyecto</h1>
          <p className="text-muted-foreground">
            {currentStep === 'choose_path' && 'Como quieres empezar?'}
            {currentStep === 'jam_question' && 'Tipo de proyecto'}
            {currentStep === 'jam_details' && 'Detalles de la Jam'}
            {currentStep === 'brainstorm' && 'The Oracle - Brainstorming'}
            {currentStep === 'idea_form' && 'Define tu proyecto'}
            {currentStep === 'review' && 'Revisar y crear'}
          </p>
        </div>
        {currentStep !== 'choose_path' && (
          <div className="text-sm text-muted-foreground">
            Paso {stepInfo.current} de {stepInfo.total}
          </div>
        )}
      </div>

      {/* Step: Choose Path */}
      {currentStep === 'choose_path' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary hover:shadow-md",
              selectedPath === 'have_idea' && "border-primary bg-primary/5"
            )}
            onClick={() => handlePathSelection('have_idea')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                <Lightbulb className="h-8 w-8 text-blue-500" />
              </div>
              <CardTitle>Tengo una idea</CardTitle>
              <CardDescription>
                Ya tengo una vision de lo que quiero crear. Solo necesito organizarla.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Formulario guiado paso a paso
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Estructura tu concepto
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Define scope y prioridades
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary hover:shadow-md",
              selectedPath === 'need_help' && "border-primary bg-primary/5"
            )}
            onClick={() => handlePathSelection('need_help')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
              <CardTitle>Necesito ayuda creativa</CardTitle>
              <CardDescription>
                Tengo una idea vaga o ninguna. Quiero explorar posibilidades con IA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-purple-500" />
                  The Oracle: brainstorming con IA
                </li>
                <li className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-purple-500" />
                  Ideas basadas en tu perfil
                </li>
                <li className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-purple-500" />
                  Considera scope y viabilidad
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Is it a Jam? */}
      {currentStep === 'jam_question' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Es un proyecto de Game Jam?</CardTitle>
              <CardDescription>
                Esto nos ayuda a ajustar las recomendaciones de scope y tiempos
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 max-w-[200px] h-auto py-6 flex-col gap-2"
                onClick={() => handleJamQuestion(true)}
              >
                <Trophy className="h-8 w-8 text-amber-500" />
                <span>Si, es una Jam!</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 max-w-[200px] h-auto py-6 flex-col gap-2"
                onClick={() => handleJamQuestion(false)}
              >
                <Gamepad2 className="h-8 w-8 text-blue-500" />
                <span>No, proyecto normal</span>
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-start">
            <Button variant="ghost" onClick={() => goToStep('choose_path')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      )}

      {/* Step: Jam Details */}
      {currentStep === 'jam_details' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Detalles de la Game Jam
              </CardTitle>
              <CardDescription>
                Esta informacion nos ayuda a calibrar las sugerencias de IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jamName">Nombre de la Jam</Label>
                  <Input
                    id="jamName"
                    placeholder="ej: Global Game Jam 2026"
                    value={projectData.jamName}
                    onChange={(e) => setProjectData(prev => ({ ...prev, jamName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jamTheme">Tema de la Jam</Label>
                  <Input
                    id="jamTheme"
                    placeholder="ej: Roots, Duality, etc."
                    value={projectData.jamTheme}
                    onChange={(e) => setProjectData(prev => ({ ...prev, jamTheme: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    El tema se usara para generar ideas si eliges brainstorming
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duracion
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '24h', hours: 24 },
                    { label: '48h', hours: 48 },
                    { label: '72h', hours: 72 },
                    { label: '1 sem', hours: 168 },
                  ].map((option) => (
                    <Button
                      key={option.hours}
                      type="button"
                      variant={projectData.jamTotalHours === option.hours ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setProjectData(prev => ({ ...prev, jamTotalHours: option.hours }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id="jamHours"
                    type="number"
                    min={1}
                    max={720}
                    placeholder="Horas personalizadas"
                    value={[24, 48, 72, 168].includes(projectData.jamTotalHours) ? '' : projectData.jamTotalHours}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      if (value > 0) {
                        setProjectData(prev => ({ ...prev, jamTotalHours: value }))
                      }
                    }}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">
                    = {Math.floor(projectData.jamTotalHours / 24)}d {projectData.jamTotalHours % 24}h
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {projectData.jamTotalHours <= 24 && 'Jam muy corta - las ideas deben ser extremadamente simples'}
                  {projectData.jamTotalHours > 24 && projectData.jamTotalHours <= 48 && 'Jam corta - enfocate en una mecanica core pulida'}
                  {projectData.jamTotalHours > 48 && projectData.jamTotalHours <= 72 && 'Jam estandar - puedes agregar algo de polish'}
                  {projectData.jamTotalHours > 72 && projectData.jamTotalHours <= 168 && 'Jam larga - hay tiempo para features adicionales'}
                  {projectData.jamTotalHours > 168 && 'Jam extendida - puedes planificar con mas detalle'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => goToStep('jam_question')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button onClick={handleJamDetailsNext}>
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Brainstorm with AI */}
      {currentStep === 'brainstorm' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                The Oracle - Brainstorming
              </CardTitle>
              <CardDescription>
                Cuentale a la IA cualquier idea vaga, inspiracion, o dejalo en blanco para ideas aleatorias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectData.isJamProject && projectData.jamTheme && (
                <div className="rounded-lg bg-amber-500/10 p-3 text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    Tema de la Jam: {projectData.jamTheme}
                  </p>
                  <p className="text-muted-foreground">
                    Las ideas se basaran en este tema
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="brainstormInput">Tu idea o inspiracion (opcional)</Label>
                <Textarea
                  id="brainstormInput"
                  placeholder="Ej: Quiero algo con puzzles y magia, o un juego donde el tiempo funcione raro..."
                  value={brainstormInput}
                  onChange={(e) => setBrainstormInput(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleBrainstorm}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando ideas...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {brainstormResult ? 'Generar nuevas ideas' : 'Generar ideas'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Brainstorm Results */}
          {brainstormResult && (
            <div className="space-y-4">
              {brainstormResult.theme_interpretation && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Interpretacion del tema:</strong> {brainstormResult.theme_interpretation}
                    </p>
                  </CardContent>
                </Card>
              )}

              <h3 className="font-semibold">Ideas generadas:</h3>

              {brainstormResult.ideas.map((idea, index) => (
                <Card
                  key={index}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary",
                    selectedIdea?.name === idea.name && "border-primary bg-primary/5"
                  )}
                  onClick={() => setSelectedIdea(idea)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{idea.name}</CardTitle>
                        <CardDescription>{idea.genre}</CardDescription>
                      </div>
                      <span className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        idea.scope_assessment === 'muy_simple' && "bg-green-500/10 text-green-700 dark:text-green-400",
                        idea.scope_assessment === 'simple' && "bg-blue-500/10 text-blue-700 dark:text-blue-400",
                        idea.scope_assessment === 'moderado' && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                      )}>
                        {idea.scope_assessment.replace('_', ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>{idea.elevator_pitch}</p>
                    <div className="grid gap-2 text-muted-foreground">
                      <p><strong>Mecanica core:</strong> {idea.core_mechanic}</p>
                      <p><strong>Twist unico:</strong> {idea.unique_twist}</p>
                      <p><strong>Por que funciona:</strong> {idea.why_it_works}</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectIdea(idea)
                      }}
                    >
                      Usar esta idea
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {brainstormResult.creative_questions.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Preguntas para explorar mas:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {brainstormResult.creative_questions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => goToStep(projectData.isJamProject ? 'jam_details' : 'jam_question')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button
              variant="outline"
              onClick={() => goToStep('idea_form')}
            >
              Continuar sin seleccionar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Idea Form */}
      {currentStep === 'idea_form' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Informacion del Proyecto
              </CardTitle>
              <CardDescription>
                {selectedIdea
                  ? 'Ajusta los detalles de tu idea seleccionada'
                  : 'Define los datos principales de tu proyecto'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Proyecto *</Label>
                <Input
                  id="name"
                  placeholder="Mi Increible Juego"
                  value={projectData.name}
                  onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                {projectData.name && (
                  <p className="text-xs text-muted-foreground">
                    Slug: {generateSlug(projectData.name)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion / Elevator Pitch</Label>
                <Textarea
                  id="description"
                  placeholder="Describe brevemente tu juego en 1-2 oraciones..."
                  value={projectData.description}
                  onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {projectData.coreMechanic && (
                <div className="space-y-2">
                  <Label htmlFor="coreMechanic">Mecanica Core</Label>
                  <Input
                    id="coreMechanic"
                    value={projectData.coreMechanic}
                    onChange={(e) => setProjectData(prev => ({ ...prev, coreMechanic: e.target.value }))}
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Genero</Label>
                  <Select
                    value={projectData.genre}
                    onValueChange={(value) => setProjectData(prev => ({ ...prev, genre: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar genero" />
                    </SelectTrigger>
                    <SelectContent>
                      {GAME_GENRES.map((genre) => (
                        <SelectItem key={genre.value} value={genre.value}>
                          {genre.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estilo Visual</Label>
                  <Select
                    value={projectData.artStyle}
                    onValueChange={(value) => setProjectData(prev => ({ ...prev, artStyle: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      {ART_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motor de Juego</Label>
                <Select
                  value={projectData.engine}
                  onValueChange={(value) => setProjectData(prev => ({ ...prev, engine: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar motor" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GAME_ENGINES).map(([key, engine]) => (
                      <SelectItem key={key} value={key}>
                        {engine.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => goToStep(selectedPath === 'need_help' ? 'brainstorm' : (projectData.isJamProject ? 'jam_details' : 'jam_question'))}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button onClick={() => goToStep('review')}>
              Revisar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revisar Proyecto</CardTitle>
              <CardDescription>
                Verifica que todo este correcto antes de crear el proyecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-lg">{projectData.name || 'Sin nombre'}</h3>
                  <p className="text-muted-foreground">{projectData.description || 'Sin descripcion'}</p>
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Genero:</span>
                    <span>{GAME_GENRES.find(g => g.value === projectData.genre)?.label || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estilo visual:</span>
                    <span>{ART_STYLES.find(s => s.value === projectData.artStyle)?.label || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Motor:</span>
                    <span>{GAME_ENGINES[projectData.engine]?.label || 'No especificado'}</span>
                  </div>
                  {projectData.coreMechanic && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mecanica core:</span>
                      <span>{projectData.coreMechanic}</span>
                    </div>
                  )}
                </div>

                {projectData.isJamProject && (
                  <div className="rounded-lg bg-amber-500/10 p-3">
                    <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
                      <Trophy className="h-4 w-4" />
                      Proyecto de Game Jam
                    </div>
                    <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                      {projectData.jamName && <p>Jam: {projectData.jamName}</p>}
                      {projectData.jamTheme && <p>Tema: {projectData.jamTheme}</p>}
                      <p>Duracion: {projectData.jamTotalHours} horas</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => goToStep('idea_form')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !projectData.name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Crear Proyecto
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
