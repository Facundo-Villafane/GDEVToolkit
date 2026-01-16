'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Target,
  KanbanSquare,
  Package,
  ArrowRight,
  Play,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjectStore } from '@/stores/project-store'

const modules = [
  {
    id: 'oracle',
    name: 'The Oracle',
    description:
      'Genera conceptos de juego innovadores basados en teoria de Game Design (MDA, Koster, Flow)',
    icon: Sparkles,
    status: 'available',
    color: 'bg-purple-500',
  },
  {
    id: 'scope',
    name: 'Scope Guardian',
    description:
      'Analiza la viabilidad de tu proyecto y detecta riesgos antes de que sea tarde',
    icon: Target,
    status: 'available',
    color: 'bg-yellow-500',
  },
  {
    id: 'kanban',
    name: 'Smart Kanban',
    description:
      'Tablero de tareas auto-generado con estimaciones inteligentes',
    icon: KanbanSquare,
    status: 'available',
    color: 'bg-blue-500',
  },
  {
    id: 'assets',
    name: 'Asset Manifest',
    description:
      'Planifica tus assets con especificaciones tecnicas y prompts de IA',
    icon: Package,
    status: 'available',
    color: 'bg-green-500',
  },
]

export default function JamMasterPage() {
  const { projects } = useProjectStore()
  const [selectedProject, setSelectedProject] = useState<string>('')

  const jamProjects = projects.filter((p) => p.isJamProject)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">JamMaster Toolkit</h1>
            <Badge>MVP</Badge>
          </div>
          <p className="text-muted-foreground">
            Tu copiloto de IA para Game Jams - ideacion, scope y produccion
          </p>
        </div>
      </div>

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Selecciona un Proyecto</CardTitle>
          <CardDescription>
            Elige un proyecto de Game Jam existente o crea uno nuevo para usar las herramientas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Seleccionar proyecto..." />
              </SelectTrigger>
              <SelectContent>
                {jamProjects.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    No hay proyectos de Jam
                  </SelectItem>
                ) : (
                  jamProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">o</span>
            <Button variant="outline" asChild>
              <Link href="/projects/new">
                Crear Nuevo Proyecto de Jam
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start without project */}
      {!selectedProject && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Modo Rapido
            </CardTitle>
            <CardDescription>
              Prueba The Oracle sin crear un proyecto - perfecto para brainstorming
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/toolkits/jammaster/oracle-quick">
                <Sparkles className="mr-2 h-4 w-4" />
                Generar Ideas Rapido
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modules Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Modulos Disponibles</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((module) => {
            const Icon = module.icon
            const isDisabled = !selectedProject && module.id !== 'oracle'

            return (
              <Card
                key={module.id}
                className={isDisabled ? 'opacity-60' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`rounded-lg p-2 ${module.color} bg-opacity-20`}>
                      <Icon className={`h-6 w-6 ${module.color.replace('bg-', 'text-')}`} />
                    </div>
                    {module.status === 'available' ? (
                      <Badge variant="secondary">Disponible</Badge>
                    ) : (
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        Pronto
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2">{module.name}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isDisabled ? (
                    <Button disabled className="w-full">
                      Selecciona un proyecto primero
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full"
                      variant={module.id === 'oracle' ? 'default' : 'outline'}
                    >
                      <Link
                        href={
                          selectedProject
                            ? `/toolkits/jammaster/${selectedProject}/${module.id}`
                            : `/toolkits/jammaster/oracle-quick`
                        }
                      >
                        Abrir {module.name}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Workflow Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Flujo de Trabajo Recomendado</CardTitle>
          <CardDescription>
            Sigue estos pasos para maximizar tu productividad en la Game Jam
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
              <div className="rounded-full bg-purple-500/20 p-3 mb-2">
                <Sparkles className="h-6 w-6 text-purple-500" />
              </div>
              <span className="font-medium">1. Ideacion</span>
              <span className="text-xs text-muted-foreground">
                Genera conceptos con The Oracle
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
              <div className="rounded-full bg-yellow-500/20 p-3 mb-2">
                <Target className="h-6 w-6 text-yellow-500" />
              </div>
              <span className="font-medium">2. Analisis</span>
              <span className="text-xs text-muted-foreground">
                Valida el scope con Guardian
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
              <div className="rounded-full bg-blue-500/20 p-3 mb-2">
                <KanbanSquare className="h-6 w-6 text-blue-500" />
              </div>
              <span className="font-medium">3. Planificacion</span>
              <span className="text-xs text-muted-foreground">
                Organiza tareas en Kanban
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
              <div className="rounded-full bg-green-500/20 p-3 mb-2">
                <Package className="h-6 w-6 text-green-500" />
              </div>
              <span className="font-medium">4. Produccion</span>
              <span className="text-xs text-muted-foreground">
                Define assets con Manifest
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
