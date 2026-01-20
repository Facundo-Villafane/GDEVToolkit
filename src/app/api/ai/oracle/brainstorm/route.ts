import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getProvider, getAvailableProviders } from '@/lib/ai/providers'

const SYSTEM_PROMPT = `Eres "The Oracle", un experto creativo en diseño de videojuegos que ayuda a desarrolladores a generar ideas para sus juegos.

Tu rol es ayudar con brainstorming creativo, especialmente para Game Jams donde el tiempo es limitado y las ideas necesitan ser viables.

Contexto importante:
- El usuario puede tener una idea vaga, un tema de jam, o simplemente necesitar inspiración
- Debes generar ideas que sean REALIZABLES considerando las limitaciones (tiempo, equipo, experiencia)
- Enfócate en mecánicas core simples pero interesantes
- Considera el balance entre originalidad y viabilidad

Cuando generes ideas:
1. Prioriza mecánicas simples que puedan implementarse rápido
2. Sugiere twists creativos que hagan el juego memorable
3. Considera géneros que el usuario conozca o pueda aprender rápido
4. Piensa en el scope - menos es más en una jam

Responde SIEMPRE en español.`

const GameIdeaSchema = z.object({
  name: z.string().describe('Nombre sugerido para el juego (catchy y memorable)'),
  elevator_pitch: z.string().describe('Descripción de 1-2 oraciones que capture la esencia del juego'),
  genre: z.string().describe('Género principal del juego'),
  core_mechanic: z.string().describe('La mecánica principal que define el gameplay'),
  unique_twist: z.string().describe('Qué hace este juego diferente o interesante'),
  art_style_suggestion: z.string().describe('Sugerencia de estilo visual que sea viable'),
  scope_assessment: z.enum(['muy_simple', 'simple', 'moderado']).describe('Evaluación del scope'),
  why_it_works: z.string().describe('Por qué esta idea es buena para el contexto dado'),
})

const BrainstormResponseSchema = z.object({
  ideas: z.array(GameIdeaSchema).min(2).max(3).describe('2-3 ideas de juegos generadas'),
  creative_questions: z.array(z.string()).min(2).max(3).describe('Preguntas para explorar más la dirección creativa'),
  theme_interpretation: z.string().optional().describe('Si hay un tema, cómo lo interpretamos creativamente'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      userInput,
      jamTheme,
      jamHours,
      preferredGenres,
      preferredEngine,
      experienceLevel,
    } = body

    const providers = getAvailableProviders()
    if (providers.length === 0) {
      return NextResponse.json(
        { error: 'No hay providers de IA configurados' },
        { status: 500 }
      )
    }

    const providerConfig = providers[0]
    const provider = getProvider(providerConfig.id)

    // Construir el prompt con contexto del usuario
    let contextParts: string[] = []

    if (jamTheme) {
      contextParts.push(`Tema de la Jam: "${jamTheme}"`)
    }

    if (jamHours) {
      contextParts.push(`Duración de la Jam: ${jamHours} horas`)
      if (jamHours <= 24) {
        contextParts.push('(Jam MUY corta - las ideas deben ser extremadamente simples)')
      } else if (jamHours <= 48) {
        contextParts.push('(Jam corta - enfócate en una mecánica core pulida)')
      } else if (jamHours <= 72) {
        contextParts.push('(Jam estándar - puedes agregar algo de polish)')
      }
    }

    if (preferredGenres && preferredGenres.length > 0) {
      contextParts.push(`Géneros preferidos del usuario: ${preferredGenres.join(', ')}`)
    }

    if (preferredEngine) {
      contextParts.push(`Motor que usará: ${preferredEngine}`)
    }

    if (experienceLevel) {
      const levelDescriptions: Record<string, string> = {
        novice: 'Principiante - sugiere ideas muy simples',
        intermediate: 'Intermedio - puede manejar mecánicas moderadas',
        advanced: 'Avanzado - puede implementar sistemas más complejos',
        expert: 'Experto - domina bien el motor y puede hacer cosas elaboradas',
      }
      contextParts.push(`Nivel de experiencia: ${levelDescriptions[experienceLevel] || experienceLevel}`)
    }

    const contextString = contextParts.length > 0
      ? `\n\nContexto del usuario:\n${contextParts.join('\n')}`
      : ''

    const userPrompt = userInput
      ? `El usuario dice: "${userInput}"${contextString}\n\nGenera 2-3 ideas de juegos basándote en lo que el usuario quiere y su contexto.`
      : jamTheme
        ? `${contextString}\n\nGenera 2-3 ideas de juegos basándote en el tema de la jam y el contexto del usuario.`
        : `${contextString}\n\nEl usuario no tiene una idea clara. Genera 2-3 ideas de juegos interesantes y viables considerando su contexto y preferencias.`

    const result = await generateObject({
      model: provider(providerConfig.defaultModel),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      schema: BrainstormResponseSchema,
    })

    return NextResponse.json({
      ...result.object,
      provider: providerConfig.id,
    })
  } catch (error) {
    console.error('Error in Oracle brainstorm:', error)
    return NextResponse.json(
      { error: 'Error al generar ideas. Por favor intenta de nuevo.' },
      { status: 500 }
    )
  }
}
