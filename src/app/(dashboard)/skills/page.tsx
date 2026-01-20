'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Sparkles,
  Code,
  Palette,
  Music,
  Lightbulb,
  Users,
  Save,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/user-store'
import { useAuthStore } from '@/stores/auth-store'
import { SKILL_CATEGORIES } from '@/lib/constants/skills'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const categoryIcons = {
  programming: Code,
  art: Palette,
  audio: Music,
  design: Lightbulb,
  management: Users,
}

interface Skill {
  id: string
  name: string
  category: string
  created_at: string
}

interface SkillFormData {
  name: string
  category: string
}

export default function SkillsManagementPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useUserStore()
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthStore()

  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState<SkillFormData>({
    name: '',
    category: 'programming',
  })

  // Check admin access
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      if (profile && profile.role !== 'admin') {
        router.push('/dashboard')
        toast.error('No tienes permisos para acceder a esta sección')
        return
      }
    }
  }, [isAuthLoading, isAuthenticated, profile, router])

  // Fetch skills
  const fetchSkills = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('category')
        .order('name')

      if (error) throw error
      setSkills(data || [])
    } catch (error) {
      console.error('Error fetching skills:', error)
      toast.error('Error al cargar las habilidades')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchSkills()
    }
  }, [profile])

  // Filter skills
  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Create skill
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('skills')
        .insert({
          name: formData.name.trim(),
          category: formData.category,
        } as never)

      if (error) throw error

      toast.success('Habilidad creada correctamente')
      setIsCreateModalOpen(false)
      setFormData({ name: '', category: 'programming' })
      fetchSkills()
    } catch (error: unknown) {
      console.error('Error creating skill:', error)
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        toast.error('Ya existe una habilidad con ese nombre')
      } else {
        toast.error('Error al crear la habilidad')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Edit skill
  const handleEdit = async () => {
    if (!selectedSkill || !formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('skills')
        .update({
          name: formData.name.trim(),
          category: formData.category,
        } as never)
        .eq('id', selectedSkill.id)

      if (error) throw error

      toast.success('Habilidad actualizada correctamente')
      setIsEditModalOpen(false)
      setSelectedSkill(null)
      setFormData({ name: '', category: 'programming' })
      fetchSkills()
    } catch (error: unknown) {
      console.error('Error updating skill:', error)
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        toast.error('Ya existe una habilidad con ese nombre')
      } else {
        toast.error('Error al actualizar la habilidad')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Delete skill
  const handleDelete = async () => {
    if (!selectedSkill) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', selectedSkill.id)

      if (error) throw error

      toast.success('Habilidad eliminada correctamente')
      setIsDeleteDialogOpen(false)
      setSelectedSkill(null)
      fetchSkills()
    } catch (error) {
      console.error('Error deleting skill:', error)
      toast.error('Error al eliminar la habilidad. Puede que haya usuarios con esta habilidad.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Open edit modal
  const openEditModal = (skill: Skill) => {
    setSelectedSkill(skill)
    setFormData({ name: skill.name, category: skill.category })
    setIsEditModalOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (skill: Skill) => {
    setSelectedSkill(skill)
    setIsDeleteDialogOpen(true)
  }

  // Get category stats
  const getCategoryStats = () => {
    const stats: Record<string, number> = {}
    skills.forEach((skill) => {
      stats[skill.category] = (stats[skill.category] || 0) + 1
    })
    return stats
  }

  const categoryStats = getCategoryStats()

  // Show loading while checking auth
  if (isAuthLoading || !profile || profile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gestión de Skills</h1>
            <p className="text-sm text-muted-foreground">
              {skills.length} habilidades en total
            </p>
          </div>
        </div>
        <Button onClick={() => {
          setFormData({ name: '', category: 'programming' })
          setIsCreateModalOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Skill
        </Button>
      </div>

      {/* Category Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(SKILL_CATEGORIES).map(([key, category]) => {
          const Icon = categoryIcons[key as keyof typeof categoryIcons]
          const count = categoryStats[key] || 0
          return (
            <Card
              key={key}
              className={cn(
                "cursor-pointer transition-colors hover:border-primary/50",
                selectedCategory === key && "border-primary"
              )}
              onClick={() => setSelectedCategory(selectedCategory === key ? 'all' : key)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn("rounded-lg p-2", category.bgColor)}>
                  <Icon className={cn("h-5 w-5", category.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{category.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar habilidades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {Object.entries(SKILL_CATEGORIES).map(([key, category]) => (
                  <SelectItem key={key} value={key}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Skills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Habilidades</CardTitle>
          <CardDescription>
            {filteredSkills.length} de {skills.length} habilidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {searchQuery || selectedCategory !== 'all'
                  ? 'No se encontraron habilidades con esos filtros'
                  : 'No hay habilidades registradas'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSkills.map((skill) => {
                  const category = SKILL_CATEGORIES[skill.category as keyof typeof SKILL_CATEGORIES]
                  const Icon = categoryIcons[skill.category as keyof typeof categoryIcons]
                  return (
                    <TableRow key={skill.id}>
                      <TableCell className="font-medium">{skill.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          {Icon && <Icon className="h-3 w-3" />}
                          {category?.label || skill.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(skill.created_at).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(skill)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(skill)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Habilidad</DialogTitle>
            <DialogDescription>
              Agrega una nueva habilidad a la plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: React Native"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SKILL_CATEGORIES).map(([key, category]) => (
                    <SelectItem key={key} value={key}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Habilidad</DialogTitle>
            <DialogDescription>
              Modifica los datos de la habilidad
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SKILL_CATEGORIES).map(([key, category]) => (
                    <SelectItem key={key} value={key}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar habilidad?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la habilidad "{selectedSkill?.name}"?
              Esta acción no se puede deshacer y podría afectar a usuarios que tengan esta habilidad.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
