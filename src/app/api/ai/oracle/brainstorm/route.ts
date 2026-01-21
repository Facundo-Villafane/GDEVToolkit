import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getProvider, getAvailableProviders } from '@/lib/ai/providers'
import { createClient } from '@/lib/supabase/server'

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

IMPORTANTE: Responde SIEMPRE en español y SOLO en formato JSON válido, sin texto adicional antes o después del JSON.

El formato de respuesta debe ser EXACTAMENTE este JSON:
{
  "ideas": [
    {
      "name": "Nombre del juego",
      "elevator_pitch": "Descripción de 1-2 oraciones",
      "genre": "Género principal",
      "core_mechanic": "La mecánica principal",
      "unique_twist": "Qué lo hace diferente",
      "art_style_suggestion": "Sugerencia de estilo visual viable",
      "scope_assessment": "muy_simple|simple|moderado",
      "why_it_works": "Por qué es buena idea para el contexto"
    }
  ],
  "creative_questions": ["Pregunta 1", "Pregunta 2"],
  "theme_interpretation": "Interpretación del tema (si hay uno)"
}

Genera exactamente 2-3 ideas. El campo scope_assessment debe ser uno de: "muy_simple", "simple", "moderado".`

interface BrainstormResponse {
  ideas: Array<{
    name: string
    elevator_pitch: string
    genre: string
    core_mechanic: string
    unique_twist: string
    art_style_suggestion: string
    scope_assessment: 'muy_simple' | 'simple' | 'moderado'
    why_it_works: string
  }>
  creative_questions: string[]
  theme_interpretation?: string
}

function extractJSON(text: string): BrainstormResponse | null {
  // Intentar parsear directamente
  try {
    return JSON.parse(text)
  } catch {
    // Buscar JSON en el texto
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        return null
      }
    }
    return null
  }
}

interface TeamMember {
  userId: string
  username: string
  displayName: string | null
  skills: Array<{ name: string; level: string }>
  engines: Array<{ key: string; level: string }>
}

// Types for Supabase queries
interface MemberQueryResult {
  user_id: string | null
  profiles: {
    id: string
    username: string
    display_name: string | null
  } | null
}

interface SkillQueryResult {
  level: string
  skills: { name: string } | null
}

interface EngineQueryResult {
  engine_key: string
  level: string
}

async function getTeamMembers(projectId: string): Promise<TeamMember[]> {
  const supabase = await createClient()

  // Obtener miembros del proyecto
  const { data: membersRaw } = await supabase
    .from('project_members')
    .select(`
      user_id,
      profiles (
        id,
        username,
        display_name
      )
    `)
    .eq('project_id', projectId)
    .not('user_id', 'is', null)

  const members = (membersRaw || []) as unknown as MemberQueryResult[]
  if (members.length === 0) return []

  const teamMembers: TeamMember[] = []

  for (const member of members) {
    if (!member.user_id || !member.profiles) continue

    const profile = member.profiles

    // Obtener skills del miembro
    const { data: userSkillsRaw } = await supabase
      .from('user_skills')
      .select(`
        level,
        skills (name)
      `)
      .eq('user_id', member.user_id)

    const userSkills = (userSkillsRaw || []) as unknown as SkillQueryResult[]

    // Obtener engines del miembro
    const { data: userEnginesRaw } = await supabase
      .from('user_engines')
      .select('engine_key, level')
      .eq('user_id', member.user_id)

    const userEngines = (userEnginesRaw || []) as unknown as EngineQueryResult[]

    teamMembers.push({
      userId: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      skills: userSkills.map(us => ({
        name: us.skills?.name || '',
        level: us.level,
      })).filter(s => s.name),
      engines: userEngines.map(ue => ({
        key: ue.engine_key,
        level: ue.level,
      })),
    })
  }

  return teamMembers
}

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
      projectId, // Nuevo: ID del proyecto para obtener miembros
      teamMembers: providedTeamMembers, // O los miembros pueden venir directamente
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
    const contextParts: string[] = []

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

    // Obtener y agregar contexto del equipo
    let teamMembers: TeamMember[] = providedTeamMembers || []
    if (projectId && teamMembers.length === 0) {
      teamMembers = await getTeamMembers(projectId)
    }

    if (teamMembers.length > 0) {
      contextParts.push('\n=== EQUIPO DEL PROYECTO ===')
      contextParts.push(`El equipo tiene ${teamMembers.length} miembro(s) adicionales:`)

      // Recopilar todas las skills del equipo
      const allSkills = new Map<string, string[]>()
      const allEngines = new Map<string, string[]>()

      for (const member of teamMembers) {
        const memberName = member.displayName || member.username

        // Skills
        for (const skill of member.skills) {
          if (!allSkills.has(skill.name)) {
            allSkills.set(skill.name, [])
          }
          allSkills.get(skill.name)!.push(`${memberName} (${skill.level})`)
        }

        // Engines
        for (const engine of member.engines) {
          if (!allEngines.has(engine.key)) {
            allEngines.set(engine.key, [])
          }
          allEngines.get(engine.key)!.push(`${memberName} (${engine.level})`)
        }
      }

      if (allSkills.size > 0) {
        contextParts.push('\nSkills disponibles en el equipo:')
        for (const [skill, members] of allSkills) {
          contextParts.push(`- ${skill}: ${members.join(', ')}`)
        }
      }

      if (allEngines.size > 0) {
        contextParts.push('\nMotores que domina el equipo:')
        for (const [engine, members] of allEngines) {
          contextParts.push(`- ${engine}: ${members.join(', ')}`)
        }
      }

      contextParts.push('\nIMPORTANTE: Considera las habilidades del equipo completo al generar ideas. Si hay artistas, sugiere juegos con énfasis visual. Si hay programadores experimentados, puedes sugerir mecánicas más complejas.')
    }

    const contextString = contextParts.length > 0
      ? `\n\nContexto del usuario:\n${contextParts.join('\n')}`
      : ''

    const userPrompt = userInput
      ? `El usuario dice: "${userInput}"${contextString}\n\nGenera 2-3 ideas de juegos basándote en lo que el usuario quiere y su contexto. Responde SOLO con el JSON.`
      : jamTheme
        ? `${contextString}\n\nGenera 2-3 ideas de juegos basándote en el tema de la jam y el contexto del usuario. Responde SOLO con el JSON.`
        : `${contextString}\n\nEl usuario no tiene una idea clara. Genera 2-3 ideas de juegos interesantes y viables considerando su contexto y preferencias. Responde SOLO con el JSON.`

    const result = await generateText({
      model: provider(providerConfig.defaultModel),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    })

    // Parsear el JSON de la respuesta
    const parsed = extractJSON(result.text)

    if (!parsed || !parsed.ideas || parsed.ideas.length === 0) {
      console.error('Failed to parse AI response:', result.text)
      return NextResponse.json(
        { error: 'Error al procesar la respuesta de la IA. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...parsed,
      provider: providerConfig.id,
    })
  } catch (error) {
    console.error('Error in Oracle brainstorm:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error('Error details:', errorDetails)

    if (errorMessage.includes('rate') || errorMessage.includes('429')) {
      return NextResponse.json(
        { error: 'Limite de requests alcanzado. Intenta de nuevo en unos segundos.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: `Error al generar ideas: ${errorMessage}` },
      { status: 500 }
    )
  }
}
