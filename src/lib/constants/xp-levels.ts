export const XP_ACTIONS = {
  // Acciones de proyecto
  project_created: { xp: 50, label: 'Proyecto creado' },
  project_completed: { xp: 200, label: 'Proyecto completado' },
  jam_submitted: { xp: 300, label: 'Juego enviado a Jam' },
  jam_won: { xp: 500, label: 'Victoria en Jam' },

  // Acciones de tareas
  task_completed: { xp: 10, label: 'Tarea completada' },
  task_reviewed: { xp: 5, label: 'Tarea revisada' },

  // Acciones sociales
  skill_endorsed: { xp: 15, label: 'Skill endorseada' },
  profile_completed: { xp: 100, label: 'Perfil completado' },

  // Streaks
  daily_login: { xp: 5, label: 'Login diario' },
  weekly_streak: { xp: 50, label: 'Racha semanal' },
} as const

export type XPAction = keyof typeof XP_ACTIONS

// Calcula el nivel basado en XP total
// Formula: level = floor(sqrt(xp / 100)) + 1
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

// Calcula el XP necesario para el siguiente nivel
export function xpForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100
}

// Calcula el progreso hacia el siguiente nivel (0-100)
export function levelProgress(xp: number): number {
  const currentLevel = calculateLevel(xp)
  const currentLevelXP = Math.pow(currentLevel - 1, 2) * 100
  const nextLevelXP = xpForNextLevel(currentLevel)
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
  return Math.min(100, Math.max(0, progress))
}

// Titulos por nivel
export function getLevelTitle(level: number): string {
  if (level < 5) return 'Aprendiz'
  if (level < 10) return 'Desarrollador'
  if (level < 20) return 'Veterano'
  if (level < 30) return 'Experto'
  if (level < 50) return 'Maestro'
  return 'Leyenda'
}
