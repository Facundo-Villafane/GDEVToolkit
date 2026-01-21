import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

export type AIProviderType = 'groq' | 'openai' | 'anthropic'

export interface AIProviderConfig {
  id: AIProviderType
  name: string
  models: string[]
  defaultModel: string
  isAvailable: boolean
  priority: number
  capabilities: {
    streaming: boolean
    functionCalling: boolean
    vision: boolean
    longContext: boolean
  }
}

// =============================================================================
// GROQ MULTI-KEY SYSTEM
// =============================================================================

interface GroqKeyState {
  key: string
  failureCount: number
  lastFailure: number | null
  isRateLimited: boolean
  rateLimitResetTime: number | null
}

class GroqKeyManager {
  private keys: GroqKeyState[] = []
  private currentIndex: number = 0
  private readonly FAILURE_COOLDOWN = 60000 // 1 minuto de cooldown tras fallo
  private readonly MAX_FAILURES = 3 // Máximo de fallos antes de cooldown largo
  private readonly RATE_LIMIT_COOLDOWN = 60000 // 1 minuto tras rate limit

  constructor() {
    this.loadKeys()
  }

  private loadKeys() {
    // Cargar todas las keys de Groq desde variables de entorno
    const keyPatterns = [
      'GROQ_API_KEY',
      'GROQ_API_KEY_2',
      'GROQ_API_KEY_3',
      'GROQ_API_KEY_4',
      'GROQ_API_KEY_5',
    ]

    for (const pattern of keyPatterns) {
      const key = process.env[pattern]
      if (key && key.trim()) {
        this.keys.push({
          key: key.trim(),
          failureCount: 0,
          lastFailure: null,
          isRateLimited: false,
          rateLimitResetTime: null,
        })
      }
    }

    if (this.keys.length > 0) {
      console.log(`[GroqKeyManager] Loaded ${this.keys.length} API key(s)`)
    }
  }

  hasKeys(): boolean {
    return this.keys.length > 0
  }

  getKeyCount(): number {
    return this.keys.length
  }

  getAvailableKeyCount(): number {
    const now = Date.now()
    return this.keys.filter(k => this.isKeyAvailable(k, now)).length
  }

  private isKeyAvailable(keyState: GroqKeyState, now: number): boolean {
    // Check rate limit
    if (keyState.isRateLimited && keyState.rateLimitResetTime) {
      if (now < keyState.rateLimitResetTime) {
        return false
      }
      // Reset rate limit status
      keyState.isRateLimited = false
      keyState.rateLimitResetTime = null
    }

    // Check failure cooldown
    if (keyState.failureCount >= this.MAX_FAILURES && keyState.lastFailure) {
      const cooldownTime = this.FAILURE_COOLDOWN * keyState.failureCount
      if (now - keyState.lastFailure < cooldownTime) {
        return false
      }
      // Reset after cooldown
      keyState.failureCount = 0
      keyState.lastFailure = null
    }

    return true
  }

  getCurrentKey(): string | null {
    if (this.keys.length === 0) return null

    const now = Date.now()
    const startIndex = this.currentIndex

    // Buscar la siguiente key disponible
    do {
      const keyState = this.keys[this.currentIndex]
      if (this.isKeyAvailable(keyState, now)) {
        return keyState.key
      }
      this.currentIndex = (this.currentIndex + 1) % this.keys.length
    } while (this.currentIndex !== startIndex)

    // Si ninguna está disponible, usar la primera de todas formas
    // (mejor intentar que fallar sin intentar)
    console.warn('[GroqKeyManager] All keys are in cooldown, using first key anyway')
    return this.keys[0].key
  }

  // Llamar cuando una request es exitosa
  reportSuccess() {
    if (this.keys.length === 0) return

    const keyState = this.keys[this.currentIndex]
    // Reducir el contador de fallos gradualmente
    if (keyState.failureCount > 0) {
      keyState.failureCount = Math.max(0, keyState.failureCount - 1)
    }
  }

  // Llamar cuando una request falla
  reportFailure(isRateLimit: boolean = false) {
    if (this.keys.length === 0) return

    const keyState = this.keys[this.currentIndex]
    const now = Date.now()

    if (isRateLimit) {
      keyState.isRateLimited = true
      keyState.rateLimitResetTime = now + this.RATE_LIMIT_COOLDOWN
      console.warn(`[GroqKeyManager] Key ${this.currentIndex + 1} rate limited, cooldown until ${new Date(keyState.rateLimitResetTime).toISOString()}`)
    } else {
      keyState.failureCount++
      keyState.lastFailure = now
      console.warn(`[GroqKeyManager] Key ${this.currentIndex + 1} failed (${keyState.failureCount}/${this.MAX_FAILURES})`)
    }

    // Rotar a la siguiente key
    this.rotateKey()
  }

  // Rotar manualmente a la siguiente key
  rotateKey() {
    if (this.keys.length <= 1) return

    const previousIndex = this.currentIndex
    this.currentIndex = (this.currentIndex + 1) % this.keys.length
    console.log(`[GroqKeyManager] Rotated from key ${previousIndex + 1} to key ${this.currentIndex + 1}`)
  }

  // Obtener estadísticas de las keys
  getStats(): { total: number; available: number; rateLimited: number; inCooldown: number } {
    const now = Date.now()
    let available = 0
    let rateLimited = 0
    let inCooldown = 0

    for (const key of this.keys) {
      if (key.isRateLimited && key.rateLimitResetTime && now < key.rateLimitResetTime) {
        rateLimited++
      } else if (key.failureCount >= this.MAX_FAILURES && key.lastFailure) {
        const cooldownTime = this.FAILURE_COOLDOWN * key.failureCount
        if (now - key.lastFailure < cooldownTime) {
          inCooldown++
        } else {
          available++
        }
      } else {
        available++
      }
    }

    return {
      total: this.keys.length,
      available,
      rateLimited,
      inCooldown,
    }
  }
}

// Singleton instance
export const groqKeyManager = new GroqKeyManager()

// =============================================================================
// PROVIDER REGISTRY
// =============================================================================

export const providerRegistry: Record<AIProviderType, AIProviderConfig> = {
  groq: {
    id: 'groq',
    name: 'Groq',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    defaultModel: 'llama-3.3-70b-versatile',
    isAvailable: groqKeyManager.hasKeys(),
    priority: 1,
    capabilities: {
      streaming: true,
      functionCalling: false, // No soporta structured outputs/json_schema
      vision: false,
      longContext: true,
    },
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    defaultModel: 'gpt-4o-mini',
    isAvailable: !!process.env.OPENAI_API_KEY,
    priority: 2,
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: true,
      longContext: true,
    },
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    defaultModel: 'claude-3-5-sonnet-20241022',
    isAvailable: !!process.env.ANTHROPIC_API_KEY,
    priority: 3,
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: true,
      longContext: true,
    },
  },
}

// Factory para crear providers
export function getProvider(type: AIProviderType) {
  switch (type) {
    case 'groq': {
      const apiKey = groqKeyManager.getCurrentKey()
      if (!apiKey) {
        throw new Error('No Groq API keys available')
      }
      return createGroq({ apiKey })
    }
    case 'openai':
      return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
    case 'anthropic':
      return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    default:
      throw new Error(`Provider ${type} not supported`)
  }
}

// Obtener providers disponibles ordenados por prioridad
export function getAvailableProviders(): AIProviderConfig[] {
  // Actualizar disponibilidad de Groq dinámicamente
  providerRegistry.groq.isAvailable = groqKeyManager.hasKeys()

  return Object.values(providerRegistry)
    .filter(p => p.isAvailable)
    .sort((a, b) => a.priority - b.priority)
}

// Obtener el mejor provider disponible
export function getBestProvider(): { provider: ReturnType<typeof getProvider>; model: string; config: AIProviderConfig } | null {
  const available = getAvailableProviders()
  if (available.length === 0) return null

  const config = available[0]
  return {
    provider: getProvider(config.id),
    model: config.defaultModel,
    config,
  }
}

// Helper para reportar éxito/fallo de Groq
export function reportGroqSuccess() {
  groqKeyManager.reportSuccess()
}

export function reportGroqFailure(isRateLimit: boolean = false) {
  groqKeyManager.reportFailure(isRateLimit)
}

// Obtener estadísticas de keys de Groq
export function getGroqKeyStats() {
  return groqKeyManager.getStats()
}
