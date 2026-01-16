'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  FolderKanban,
  Gamepad2,
  Plus,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useUserStore } from '@/stores/user-store'
import { useProjectStore } from '@/stores/project-store'
import { levelProgress, getLevelTitle, xpForNextLevel } from '@/lib/constants/xp-levels'

export default function DashboardPage() {
  const { profile } = useUserStore()
  const { projects } = useProjectStore()

  const xpProgress = profile ? levelProgress(profile.xpTotal) : 0
  const levelTitle = profile ? getLevelTitle(profile.xpLevel) : ''
  const nextLevelXP = profile ? xpForNextLevel(profile.xpLevel) : 100

  // Stats simulados por ahora
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === 'active').length,
    completedTasks: 24,
    hoursThisWeek: 12,
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Hola, {profile?.displayName || profile?.username || 'Developer'}!
          </h1>
          <p className="text-muted-foreground">
            Aqui tienes un resumen de tu actividad
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/toolkits/jammaster">
              <Gamepad2 className="mr-2 h-4 w-4" />
              JamMaster
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Proyectos</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Horas de Trabajo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hoursThisWeek}h</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nivel</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{profile?.xpLevel || 1}</span>
              <Badge variant="secondary">{levelTitle}</Badge>
            </div>
            <div className="mt-2 space-y-1">
              <Progress value={xpProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {profile?.xpTotal || 0} / {nextLevelXP} XP
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Proyectos Recientes</CardTitle>
            <CardDescription>
              Tus proyectos mas recientes y su estado actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Sin proyectos aun</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Crea tu primer proyecto para comenzar
                </p>
                <Button asChild className="mt-4">
                  <Link href="/projects/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Proyecto
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Gamepad2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.genre || 'Sin genero'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        project.status === 'active'
                          ? 'default'
                          : project.status === 'completed'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rapidas</CardTitle>
            <CardDescription>Herramientas y acciones frecuentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/toolkits/jammaster">
                <Sparkles className="mr-2 h-4 w-4" />
                Generar Ideas con IA
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proyecto
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/profile">
                <Target className="mr-2 h-4 w-4" />
                Actualizar Skills
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
