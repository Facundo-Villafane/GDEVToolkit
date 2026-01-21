'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Loader2, Users, Filter, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { UserCard, type SearchUser } from '@/components/features/users/user-card'
import { GAME_ENGINES } from '@/lib/constants/engines'
import { GAME_GENRES } from '@/lib/constants/genres'
import { useDebounce } from '@/hooks/use-debounce'

export default function CommunityPage() {
  const [users, setUsers] = useState<SearchUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEngine, setSelectedEngine] = useState<string>('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [selectedSkill, setSelectedSkill] = useState<string>('')
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 300)

  const fetchUsers = useCallback(async (reset = false) => {
    setIsLoading(true)
    try {
      const currentOffset = reset ? 0 : offset
      const params = new URLSearchParams({
        limit: '20',
        offset: currentOffset.toString(),
      })

      if (debouncedSearch) params.set('q', debouncedSearch)
      if (selectedEngine) params.set('engine', selectedEngine)
      if (selectedGenre) params.set('genre', selectedGenre)
      if (selectedSkill) params.set('skill', selectedSkill)

      const response = await fetch(`/api/profiles/search?${params}`)
      const data = await response.json()

      if (response.ok) {
        if (reset) {
          setUsers(data.users)
          setOffset(20)
        } else {
          setUsers(prev => [...prev, ...data.users])
          setOffset(prev => prev + 20)
        }
        setTotal(data.total)
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, selectedEngine, selectedGenre, selectedSkill, offset])

  // Fetch on filter change
  useEffect(() => {
    fetchUsers(true)
  }, [debouncedSearch, selectedEngine, selectedGenre, selectedSkill])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedEngine('')
    setSelectedGenre('')
    setSelectedSkill('')
  }

  const activeFiltersCount = [selectedEngine, selectedGenre, selectedSkill].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Comunidad</h1>
          <p className="text-sm text-muted-foreground">
            Encuentra desarrolladores para tu equipo
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Desktop Filters */}
            <div className="hidden md:flex gap-2">
              <Select value={selectedEngine} onValueChange={setSelectedEngine}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Motor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los motores</SelectItem>
                  {Object.entries(GAME_ENGINES).map(([key, engine]) => (
                    <SelectItem key={key} value={key}>
                      {engine.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Genero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los generos</SelectItem>
                  {GAME_GENRES.map((genre) => (
                    <SelectItem key={genre.value} value={genre.value}>
                      {genre.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Skill..."
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-[140px]"
              />

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="icon" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Mobile Filters Button */}
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>
                    Filtra usuarios por motor, genero o skills
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Motor</label>
                    <Select value={selectedEngine} onValueChange={setSelectedEngine}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los motores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los motores</SelectItem>
                        {Object.entries(GAME_ENGINES).map(([key, engine]) => (
                          <SelectItem key={key} value={key}>
                            {engine.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Genero preferido</label>
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los generos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los generos</SelectItem>
                        {GAME_GENRES.map((genre) => (
                          <SelectItem key={genre.value} value={genre.value}>
                            {genre.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Skill</label>
                    <Input
                      placeholder="Ej: Unity, Pixel Art..."
                      value={selectedSkill}
                      onChange={(e) => setSelectedSkill(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        clearFilters()
                        setIsFiltersOpen(false)
                      }}
                    >
                      Limpiar
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => setIsFiltersOpen(false)}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active filters badges */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedEngine && (
                <Badge variant="secondary" className="gap-1">
                  Motor: {GAME_ENGINES[selectedEngine]?.label}
                  <button onClick={() => setSelectedEngine('')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedGenre && (
                <Badge variant="secondary" className="gap-1">
                  Genero: {GAME_GENRES.find(g => g.value === selectedGenre)?.label}
                  <button onClick={() => setSelectedGenre('')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedSkill && (
                <Badge variant="secondary" className="gap-1">
                  Skill: {selectedSkill}
                  <button onClick={() => setSelectedSkill('')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {isLoading && users.length === 0 ? (
          'Buscando...'
        ) : (
          `${total} desarrollador${total !== 1 ? 'es' : ''} encontrado${total !== 1 ? 's' : ''}`
        )}
      </div>

      {/* Users Grid */}
      {isLoading && users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground text-center">
              No se encontraron desarrolladores con esos filtros
            </p>
            {activeFiltersCount > 0 && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchUsers(false)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Cargar mas
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
