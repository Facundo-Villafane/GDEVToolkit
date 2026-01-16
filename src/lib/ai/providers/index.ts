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

export const providerRegistry: Record<AIProviderType, AIProviderConfig> = {
  groq: {
    id: 'groq',
    name: 'Groq',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    defaultModel: 'llama-3.3-70b-versatile',
    isAvailable: !!process.env.GROQ_API_KEY,
    priority: 1,
    capabilities: {
      streaming: true,
      functionCalling: true,
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
    case 'groq':
      return createGroq({ apiKey: process.env.GROQ_API_KEY })
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
