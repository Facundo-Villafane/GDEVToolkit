import { Gamepad2 } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-10 w-10" />
          <span className="text-2xl font-bold">DevHub</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            El Portal Todo-en-Uno para
            <br />
            Desarrolladores de Juegos
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Ideacion asistida por IA, gestion de scope inteligente y
            herramientas de produccion para Game Jams y mas alla.
          </p>
        </div>

        <p className="text-sm text-primary-foreground/60">
          Hecho con amor para la comunidad de gamedevs
        </p>
      </div>

      {/* Right side - Auth form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
