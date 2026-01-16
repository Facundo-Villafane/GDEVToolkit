'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Gamepad2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isJamProject, setIsJamProject] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    genre: '',
    artStyle: '',
    engine: '',
    // Jam specific
    jamName: '',
    jamTheme: '',
    jamTotalHours: 48,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('El nombre del proyecto es requerido')
      return
    }

    setIsLoading(true)

    try {
      // TODO: Implement actual project creation with Supabase
      // For now, just show success and redirect
      toast.success('Proyecto creado exitosamente!')
      router.push('/projects')
    } catch (error) {
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Proyecto</h1>
          <p className="text-muted-foreground">
            Crea un nuevo proyecto de desarrollo de juego
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Informacion Basica
            </CardTitle>
            <CardDescription>
              Define los datos principales de tu proyecto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Proyecto *</Label>
              <Input
                id="name"
                placeholder="Mi Increible Juego"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              {formData.name && (
                <p className="text-xs text-muted-foreground">
                  Slug: {generateSlug(formData.name)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                placeholder="Describe brevemente tu juego..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Genero</Label>
                <Select
                  value={formData.genre}
                  onValueChange={(value) =>
                    setFormData({ ...formData, genre: value })
                  }
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
                  value={formData.artStyle}
                  onValueChange={(value) =>
                    setFormData({ ...formData, artStyle: value })
                  }
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
                value={formData.engine}
                onValueChange={(value) =>
                  setFormData({ ...formData, engine: value })
                }
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

        {/* Game Jam Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isJam"
                checked={isJamProject}
                onCheckedChange={(checked) => setIsJamProject(checked as boolean)}
              />
              <Label htmlFor="isJam" className="cursor-pointer">
                Es un proyecto de Game Jam
              </Label>
            </div>
            <CardDescription>
              Activa esta opcion si estas participando en una jam
            </CardDescription>
          </CardHeader>
          {isJamProject && (
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jamName">Nombre de la Jam</Label>
                  <Input
                    id="jamName"
                    placeholder="ej: Global Game Jam 2025"
                    value={formData.jamName}
                    onChange={(e) =>
                      setFormData({ ...formData, jamName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jamTheme">Tema de la Jam</Label>
                  <Input
                    id="jamTheme"
                    placeholder="ej: Roots"
                    value={formData.jamTheme}
                    onChange={(e) =>
                      setFormData({ ...formData, jamTheme: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jamHours">Duracion (horas)</Label>
                <Input
                  id="jamHours"
                  type="number"
                  min={1}
                  max={168}
                  value={formData.jamTotalHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jamTotalHours: parseInt(e.target.value) || 48,
                    })
                  }
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/projects">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Proyecto
          </Button>
        </div>
      </form>
    </div>
  )
}
