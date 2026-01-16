'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  Gamepad2,
  MoreVertical,
  FolderKanban,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjectStore } from '@/stores/project-store'

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  archived: 'bg-yellow-100 text-yellow-800',
}

const statusLabels = {
  draft: 'Borrador',
  active: 'Activo',
  completed: 'Completado',
  archived: 'Archivado',
}

export default function ProjectsPage() {
  const { projects } = useProjectStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Proyectos</h1>
          <p className="text-muted-foreground">
            Gestiona todos tus proyectos de desarrollo de juegos
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
            <SelectItem value="archived">Archivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-xl font-semibold">
              {projects.length === 0
                ? 'No tienes proyectos aun'
                : 'No se encontraron proyectos'}
            </h3>
            <p className="mt-2 text-center text-muted-foreground">
              {projects.length === 0
                ? 'Crea tu primer proyecto para comenzar a desarrollar'
                : 'Intenta con otros filtros de busqueda'}
            </p>
            {projects.length === 0 && (
              <Button asChild className="mt-4">
                <Link href="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Proyecto
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group relative overflow-hidden">
              {/* Thumbnail placeholder */}
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                {project.thumbnailUrl ? (
                  <img
                    src={project.thumbnailUrl}
                    alt={project.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Gamepad2 className="h-12 w-12 text-primary/50" />
                )}
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'Sin descripcion'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/projects/${project.id}`}>Ver proyecto</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/projects/${project.id}/settings`}>
                          Configuracion
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge
                    className={statusColors[project.status]}
                    variant="secondary"
                  >
                    {statusLabels[project.status]}
                  </Badge>
                  {project.isJamProject && (
                    <Badge variant="outline">Game Jam</Badge>
                  )}
                  {project.genre && (
                    <Badge variant="outline">{project.genre}</Badge>
                  )}
                </div>

                {/* Scope Score if available */}
                {project.scopeScore !== null && (
                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        project.riskLevel === 'green'
                          ? 'bg-green-500'
                          : project.riskLevel === 'yellow'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm text-muted-foreground">
                      Scope: {project.scopeScore}%
                    </span>
                  </div>
                )}
              </CardContent>

              {/* Hover overlay */}
              <Link
                href={`/projects/${project.id}`}
                className="absolute inset-0 z-10"
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
