import { streamText, generateText, generateObject } from 'ai'
import { z } from 'zod'
import { getProvider, getAvailableProviders, AIProviderType, AIProviderConfig } from './providers'
import type { ProjectContext } from '@/types'

// Simple message type for chat
interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type TaskType = 'oracle' | 'scope' | 'kanban' | 'assets' | 'chat'

export interface OrchestratorConfig {
  taskType: TaskType
  projectContext?: ProjectContext
  preferredProvider?: AIProviderType
}

export class AIOrchestrator {
  private config: OrchestratorConfig

  constructor(config: OrchestratorConfig) {
    this.config = config
  }

  // Seleccionar el mejor modelo para la tarea
  private selectProvider(): { provider: ReturnType<typeof getProvider>; model: string; config: AIProviderConfig } {
    const providers = getAvailableProviders()

    if (providers.length === 0) {
      throw new Error('No AI providers available. Please configure at least one API key.')
    }

    // Si el usuario tiene preferencia y está disponible
    if (this.config.preferredProvider) {
      const preferred = providers.find(p => p.id === this.config.preferredProvider)
      if (preferred) {
        return {
          provider: getProvider(preferred.id),
          model: preferred.defaultModel,
          config: preferred,
        }
      }
    }

    // Seleccionar según el tipo de tarea
    const taskRequirements: Record<TaskType, Partial<AIProviderConfig['capabilities']>> = {
      oracle: { longContext: true },
      scope: { functionCalling: true },
      kanban: { functionCalling: true },
      assets: {},
      chat: { streaming: true, longContext: true },
    }

    const requirements = taskRequirements[this.config.taskType]

    // Encontrar el mejor provider que cumpla requisitos
    const suitable = providers.find(p =>
      Object.entries(requirements).every(
        ([cap, needed]) => !needed || p.capabilities[cap as keyof typeof p.capabilities]
      )
    )

    const selected = suitable || providers[0]

    return {
      provider: getProvider(selected.id),
      model: selected.defaultModel,
      config: selected,
    }
  }

  // Construir contexto del proyecto para el prompt
  private buildContextString(): string {
    if (!this.config.projectContext) return ''

    const { gdd, scopeReport } = this.config.projectContext
    const parts: string[] = []

    if (gdd) {
      parts.push('## Project Context (GDD)')
      if (gdd.name) parts.push(`- Name: ${gdd.name}`)
      if (gdd.genre) parts.push(`- Genre: ${gdd.genre}`)
      if (gdd.theme) parts.push(`- Theme: ${gdd.theme}`)
      if (gdd.coreMechanic) parts.push(`- Core Mechanic: ${gdd.coreMechanic}`)
      if (gdd.artStyle) parts.push(`- Art Style: ${gdd.artStyle}`)
      if (gdd.elevator_pitch) parts.push(`- Pitch: ${gdd.elevator_pitch}`)
    }

    if (scopeReport) {
      parts.push('\n## Scope Analysis')
      parts.push(`- Viability Score: ${scopeReport.score}/100`)
      parts.push(`- Risk Level: ${scopeReport.riskLevel}`)
      if (scopeReport.criticalPath.length > 0) {
        parts.push(`- Critical Path: ${scopeReport.criticalPath.join(', ')}`)
      }
    }

    return parts.join('\n')
  }

  // Streaming para chat en tiempo real
  async stream(systemPrompt: string, messages: ChatMessage[]) {
    const { provider, model } = this.selectProvider()

    const contextString = this.buildContextString()
    const fullSystemPrompt = contextString
      ? `${systemPrompt}\n\n${contextString}`
      : systemPrompt

    return streamText({
      model: provider(model),
      system: fullSystemPrompt,
      messages,
    })
  }

  // Generación de texto completo
  async generate(systemPrompt: string, userMessage: string) {
    const { provider, model } = this.selectProvider()

    const contextString = this.buildContextString()
    const fullPrompt = contextString
      ? `${systemPrompt}\n\n${contextString}\n\nUser Request:\n${userMessage}`
      : `${systemPrompt}\n\nUser Request:\n${userMessage}`

    return generateText({
      model: provider(model),
      prompt: fullPrompt,
    })
  }

  // Generación de objetos estructurados (con schema Zod)
  async generateStructured<T extends z.ZodTypeAny>(
    systemPrompt: string,
    userMessage: string,
    schema: T
  ): Promise<z.infer<T>> {
    const { provider, model } = this.selectProvider()

    const contextString = this.buildContextString()
    const fullPrompt = contextString
      ? `${systemPrompt}\n\n${contextString}\n\nUser Request:\n${userMessage}`
      : `${systemPrompt}\n\nUser Request:\n${userMessage}`

    const result = await generateObject({
      model: provider(model),
      prompt: fullPrompt,
      schema,
    })

    return result.object as z.infer<T>
  }

  // Ejecutar con fallback automático
  async executeWithFallback<T>(
    operation: (provider: ReturnType<typeof getProvider>, model: string) => Promise<T>
  ): Promise<T> {
    const providers = getAvailableProviders()

    for (const providerConfig of providers) {
      try {
        const provider = getProvider(providerConfig.id)
        return await operation(provider, providerConfig.defaultModel)
      } catch (error) {
        console.error(`Provider ${providerConfig.id} failed:`, error)
        // Continuar con el siguiente provider
      }
    }

    throw new Error('All AI providers failed')
  }
}

// Helper para crear un orquestador rápidamente
export function createOrchestrator(taskType: TaskType, projectContext?: ProjectContext) {
  return new AIOrchestrator({ taskType, projectContext })
}
