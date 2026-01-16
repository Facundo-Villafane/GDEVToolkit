'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Por favor ingresa tu email')
      return
    }

    setIsLoading(true)

    try {
      await resetPassword(email)
      setIsSubmitted(true)
      toast.success('Email enviado!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al enviar el email'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Revisa tu email</h1>
          <p className="text-muted-foreground">
            Hemos enviado un enlace de recuperacion a <strong>{email}</strong>
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No recibiste el email? Revisa tu carpeta de spam o intenta de nuevo.
          </p>
          <Button
            variant="outline"
            onClick={() => setIsSubmitted(false)}
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" />
            Intentar con otro email
          </Button>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Recuperar Contrasena</h1>
        <p className="text-muted-foreground">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contrasena
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            autoFocus
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Enviar enlace de recuperacion
            </>
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al login
        </Link>
      </div>
    </div>
  )
}
