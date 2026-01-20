import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getProvider, getAvailableProviders } from '@/lib/ai/providers'

const SYSTEM_PROMPT = `Eres un experto en desarrollo de videojuegos. Tu tarea es generar descripciones cortas y concisas de habilidades/skills relacionadas al desarrollo de videojuegos.

Reglas:
- La descripción debe ser en español
- Máximo 1-2 oraciones cortas (menos de 100 caracteres idealmente)
- Enfocada en el contexto de desarrollo de videojuegos
- Describir qué hace alguien con esa habilidad en un equipo de gamedev
- No usar palabras genéricas como "habilidad" o "capacidad"
- Ser específico y práctico

Ejemplos:
- "Unity C#" -> "Desarrollo de juegos en Unity usando C# para mecánicas y sistemas"
- "Pixel Art" -> "Creación de arte 2D con estética retro pixel por pixel"
- "QA Testing" -> "Pruebas y detección de bugs para asegurar la calidad del juego"
- "Sound Design" -> "Diseño y creación de efectos de sonido para ambientación"
- "Level Design" -> "Diseño de niveles, flujo de juego y experiencia del jugador"`

export async function POST(request: Request) {
  try {
    const { skillName, category } = await request.json()

    if (!skillName) {
      return NextResponse.json(
        { error: 'El nombre de la skill es requerido' },
        { status: 400 }
      )
    }

    const providers = getAvailableProviders()
    if (providers.length === 0) {
      return NextResponse.json(
        { error: 'No hay providers de IA configurados' },
        { status: 500 }
      )
    }

    // Usar el mejor provider disponible (Groq por defecto)
    const providerConfig = providers[0]
    const provider = getProvider(providerConfig.id)

    const prompt = `Genera una descripción corta para la skill "${skillName}" en la categoría "${category}". Solo responde con la descripción, sin comillas ni explicaciones adicionales.`

    const result = await generateText({
      model: provider(providerConfig.defaultModel),
      system: SYSTEM_PROMPT,
      prompt,
    })

    return NextResponse.json({
      description: result.text.trim(),
      provider: providerConfig.id,
    })
  } catch (error) {
    console.error('Error generating skill description:', error)
    return NextResponse.json(
      { error: 'Error al generar la descripción' },
      { status: 500 }
    )
  }
}
