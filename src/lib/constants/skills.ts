// Skills configuration for user profiles
export const SKILL_CATEGORIES = {
  programming: {
    label: 'Programacion',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  art: {
    label: 'Arte',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  audio: {
    label: 'Audio',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  design: {
    label: 'Game Design',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  management: {
    label: 'Gestion',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
} as const

export type SkillCategory = keyof typeof SKILL_CATEGORIES

export const SKILL_LEVELS = {
  novice: {
    label: 'Principiante',
    description: 'Conocimientos basicos, aprendiendo',
    color: 'text-gray-500',
    xpMultiplier: 1,
  },
  intermediate: {
    label: 'Intermedio',
    description: 'Experiencia practica, puede trabajar de forma independiente',
    color: 'text-blue-500',
    xpMultiplier: 1.5,
  },
  advanced: {
    label: 'Avanzado',
    description: 'Amplia experiencia, puede guiar a otros',
    color: 'text-purple-500',
    xpMultiplier: 2,
  },
  expert: {
    label: 'Experto',
    description: 'Dominio completo, referente en el area',
    color: 'text-yellow-500',
    xpMultiplier: 3,
  },
} as const

export type SkillLevelKey = keyof typeof SKILL_LEVELS

// Default skills that should be in the database
// These match the seed data in the SQL schema
export const DEFAULT_SKILLS = [
  // Programming
  { name: 'Unity/C#', category: 'programming' },
  { name: 'Unreal/C++', category: 'programming' },
  { name: 'Godot/GDScript', category: 'programming' },
  { name: 'JavaScript/TypeScript', category: 'programming' },
  { name: 'Python', category: 'programming' },
  { name: 'Shaders/HLSL', category: 'programming' },

  // Art
  { name: 'Pixel Art', category: 'art' },
  { name: '2D Animation', category: 'art' },
  { name: '3D Modeling', category: 'art' },
  { name: 'Texturing', category: 'art' },
  { name: 'UI/UX Design', category: 'art' },
  { name: 'Concept Art', category: 'art' },

  // Audio
  { name: 'Music Composition', category: 'audio' },
  { name: 'Sound Design', category: 'audio' },
  { name: 'Voice Acting', category: 'audio' },
  { name: 'Audio Implementation', category: 'audio' },

  // Design
  { name: 'Level Design', category: 'design' },
  { name: 'Systems Design', category: 'design' },
  { name: 'Narrative Design', category: 'design' },
  { name: 'Economy Design', category: 'design' },
  { name: 'Balancing', category: 'design' },

  // Management
  { name: 'Project Management', category: 'management' },
  { name: 'QA Testing', category: 'management' },
  { name: 'Community Management', category: 'management' },
  { name: 'Marketing', category: 'management' },
] as const
