'use client'

import { useState } from 'react'
import { Edit2, Plus, Trophy, Star, Code, Palette, Music, Lightbulb, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserStore } from '@/stores/user-store'
import { levelProgress, getLevelTitle, xpForNextLevel } from '@/lib/constants/xp-levels'
import { SKILL_CATEGORIES, SKILL_LEVELS } from '@/lib/constants/skills'

const categoryIcons = {
  programming: Code,
  art: Palette,
  audio: Music,
  design: Lightbulb,
  management: Users,
}

export default function ProfilePage() {
  const { profile } = useUserStore()

  const xpProgress = profile ? levelProgress(profile.xpTotal) : 0
  const levelTitle = profile ? getLevelTitle(profile.xpLevel) : ''
  const nextLevelXP = profile ? xpForNextLevel(profile.xpLevel) : 100

  // Skills simuladas para demo
  const demoSkills = [
    { name: 'Unity C#', category: 'programming', level: 'advanced' },
    { name: 'Pixel Art', category: 'art', level: 'intermediate' },
    { name: 'Sound Design', category: 'audio', level: 'novice' },
    { name: 'Level Design', category: 'design', level: 'intermediate' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile?.avatarUrl || ''} />
            <AvatarFallback className="text-2xl">
              {profile?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div>
              <h1 className="text-3xl font-bold">
                {profile?.displayName || profile?.username || 'Usuario'}
              </h1>
              <p className="text-muted-foreground">@{profile?.username || 'username'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3" />
                Nivel {profile?.xpLevel || 1}
              </Badge>
              <Badge variant="outline">{levelTitle}</Badge>
            </div>
            {profile?.bio && (
              <p className="max-w-md text-sm text-muted-foreground">{profile.bio}</p>
            )}
          </div>
        </div>
        <Button variant="outline">
          <Edit2 className="mr-2 h-4 w-4" />
          Editar Perfil
        </Button>
      </div>

      {/* XP Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Progreso de Experiencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Nivel {profile?.xpLevel || 1}</span>
              <span>Nivel {(profile?.xpLevel || 1) + 1}</span>
            </div>
            <Progress value={xpProgress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{profile?.xpTotal || 0} XP total</span>
              <span>{nextLevelXP - (profile?.xpTotal || 0)} XP para siguiente nivel</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList>
          <TabsTrigger value="skills">Habilidades</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Mis Habilidades</h2>
              <p className="text-sm text-muted-foreground">
                Agrega y gestiona tus habilidades de desarrollo
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Skill
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(SKILL_CATEGORIES).map(([key, category]) => {
              const Icon = categoryIcons[key as keyof typeof categoryIcons]
              const categorySkills = demoSkills.filter((s) => s.category === key)

              return (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className={`rounded-lg p-2 ${category.color} bg-opacity-20`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {category.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {categorySkills.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Sin habilidades en esta categoria
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {categorySkills.map((skill) => {
                          const levelInfo =
                            SKILL_LEVELS[skill.level as keyof typeof SKILL_LEVELS]
                          return (
                            <div key={skill.name} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{skill.name}</span>
                              <Badge
                                variant="secondary"
                                className={`${levelInfo.color} bg-opacity-20`}
                              >
                                {levelInfo.label}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="portfolio">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
              <CardDescription>
                Tus proyectos destacados y trabajos completados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Portfolio vacio</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Completa proyectos para agregar entradas a tu portfolio
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Tu historial de actividad y logros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Star className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Cuenta creada</p>
                    <p className="text-sm text-muted-foreground">
                      Bienvenido a DevHub! +50 XP
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
