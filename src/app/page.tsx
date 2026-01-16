import Link from 'next/link'
import {
  Gamepad2,
  Sparkles,
  Target,
  KanbanSquare,
  Users,
  ArrowRight,
  Github,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">DevHub</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              Caracteristicas
            </Link>
            <Link href="#toolkits" className="text-sm text-muted-foreground hover:text-foreground">
              Toolkits
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar Sesion</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Comenzar Gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center rounded-full border px-4 py-1 text-sm">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              Potenciado por IA para Game Developers
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              El Portal Todo-en-Uno para{' '}
              <span className="text-primary">Desarrolladores de Juegos</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Ideacion asistida por IA, analisis de scope inteligente y herramientas
              de produccion. Todo centralizado en un flujo de trabajo gamificado.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/register">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Ver Caracteristicas</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">Herramientas que Impulsan tu Creatividad</h2>
              <p className="mt-4 text-muted-foreground">
                Un ecosistema completo para cada etapa del desarrollo de videojuegos
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-card p-6">
                <div className="rounded-lg bg-purple-500/10 p-3 w-fit">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="mt-4 font-semibold">The Oracle</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Genera conceptos de juego basados en teoria de Game Design: MDA Framework, Koster y Flow.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="rounded-lg bg-yellow-500/10 p-3 w-fit">
                  <Target className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="mt-4 font-semibold">Scope Guardian</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Analiza la viabilidad de tu proyecto con semaforo de riesgos y sugerencias de recorte.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="rounded-lg bg-blue-500/10 p-3 w-fit">
                  <KanbanSquare className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="mt-4 font-semibold">Smart Kanban</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tablero de tareas auto-generado por IA con estimaciones basadas en tu equipo.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="rounded-lg bg-green-500/10 p-3 w-fit">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="mt-4 font-semibold">Sistema de XP</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Perfil gamificado con habilidades validadas, niveles y portfolio integrado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* JamMaster Highlight */}
        <section id="toolkits" className="py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center gap-12 lg:flex-row">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm text-primary">
                  <Zap className="mr-2 h-4 w-4" />
                  MVP Disponible
                </div>
                <h2 className="text-3xl font-bold">
                  JamMaster: Tu Copiloto para Game Jams
                </h2>
                <p className="text-lg text-muted-foreground">
                  Optimizado para velocidad y ejecucion. Genera ideas innovadoras,
                  valida tu scope en tiempo real y organiza tu equipo con
                  herramientas impulsadas por IA.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Generador de conceptos con teoria de la diversion
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Analisis de riesgos consultivo (no restrictivo)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Kanban dinamico con estimaciones inteligentes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Manifest de assets con prompts tecnicos
                  </li>
                </ul>
                <Button asChild>
                  <Link href="/register">
                    Probar JamMaster
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex-1">
                <div className="rounded-lg border bg-gradient-to-br from-primary/20 to-primary/5 p-8">
                  <div className="flex items-center justify-center">
                    <Gamepad2 className="h-48 w-48 text-primary/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-primary py-24 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold">Listo para tu Proxima Game Jam?</h2>
            <p className="mt-4 text-primary-foreground/80">
              Unete a la comunidad de developers que ya usan DevHub para crear juegos increibles.
            </p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link href="/register">
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-primary" />
            <span className="font-semibold">DevHub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Hecho con amor para la comunidad de gamedevs
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              <Github className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
