import Link from 'next/link'
import {
  Gamepad2,
  Palette,
  Megaphone,
  Sparkles,
  ArrowRight,
  Clock,
  Target,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type ToolkitStatus = 'available' | 'coming_soon' | 'beta'

const toolkits: Array<{
  id: string
  name: string
  description: string
  icon: typeof Gamepad2
  status: ToolkitStatus
  features: string[]
  href: string
}> = [
  {
    id: 'jammaster',
    name: 'JamMaster',
    description:
      'Herramientas optimizadas para Game Jams: ideacion con IA, analisis de scope y gestion de tareas.',
    icon: Gamepad2,
    status: 'available',
    features: [
      'The Oracle - Generador de ideas',
      'Scope Guardian - Analisis de riesgos',
      'Smart Kanban - Gestion de tareas',
      'Asset Manifest - Planificacion de assets',
    ],
    href: '/toolkits/jammaster',
  },
  {
    id: 'assetforge',
    name: 'Asset Forge',
    description:
      'Generacion y edicion de assets con IA. Sprites, modelos 3D, audio y mas.',
    icon: Palette,
    status: 'coming_soon',
    features: [
      'Generacion de sprites con IA',
      'Edicion de modelos 3D',
      'Creacion de efectos de sonido',
      'Optimizacion de assets',
    ],
    href: '#',
  },
  {
    id: 'devtomarket',
    name: 'Dev-to-Market',
    description:
      'Herramientas de marketing, integracion con itch.io y preparacion para lanzamiento.',
    icon: Megaphone,
    status: 'coming_soon',
    features: [
      'Generador de press kits',
      'Integracion con itch.io',
      'Planificador de lanzamiento',
      'Analytics de marketing',
    ],
    href: '#',
  },
]

const statusBadge: Record<ToolkitStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  available: { label: 'Disponible', variant: 'default' },
  coming_soon: { label: 'Proximamente', variant: 'secondary' },
  beta: { label: 'Beta', variant: 'outline' },
}

export default function ToolkitsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Toolkits</h1>
        <p className="text-muted-foreground">
          Herramientas especializadas potenciadas por IA para cada etapa del
          desarrollo de juegos
        </p>
      </div>

      {/* Hero Card - JamMaster */}
      <Card className="overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge>MVP</Badge>
              <Badge variant="outline">IA Powered</Badge>
            </div>
            <h2 className="text-2xl font-bold mb-2">JamMaster Toolkit</h2>
            <p className="text-muted-foreground mb-6">
              Tu copiloto de IA para Game Jams. Genera ideas innovadoras, analiza
              el scope de tu proyecto y gestiona tareas de forma inteligente.
            </p>

            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Ideacion IA</p>
                  <p className="text-xs text-muted-foreground">MDA + Koster</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Scope Guardian</p>
                  <p className="text-xs text-muted-foreground">Analisis de riesgos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Smart Kanban</p>
                  <p className="text-xs text-muted-foreground">Auto-generado</p>
                </div>
              </div>
            </div>

            <Button asChild>
              <Link href="/toolkits/jammaster">
                Abrir JamMaster
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="hidden md:flex items-center justify-center p-6 bg-primary/5">
            <Gamepad2 className="h-32 w-32 text-primary/20" />
          </div>
        </div>
      </Card>

      {/* All Toolkits Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Todos los Toolkits</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {toolkits.map((toolkit) => {
            const Icon = toolkit.icon
            const status = statusBadge[toolkit.status]
            const isAvailable = toolkit.status === 'available'

            return (
              <Card
                key={toolkit.id}
                className={!isAvailable ? 'opacity-75' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <CardTitle className="mt-4">{toolkit.name}</CardTitle>
                  <CardDescription>{toolkit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {toolkit.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isAvailable ? (
                    <Button asChild className="w-full">
                      <Link href={toolkit.href}>
                        Abrir Toolkit
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      <Clock className="mr-2 h-4 w-4" />
                      Proximamente
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
