// Game engines configuration with icons
// Using React Icons where available, image URLs for others

export type EngineIconType = 'react-icon' | 'image'

export interface GameEngine {
  label: string
  description: string
  languages: readonly string[]
  iconType: EngineIconType
  iconName?: string // For react-icons
  iconUrl?: string // For image-based icons
  color: string
  darkInvert?: boolean // If white icon needs inversion in dark mode
}

export const GAME_ENGINES: Record<string, GameEngine> = {
  unity: {
    label: 'Unity',
    description: 'Motor multiplataforma popular para 2D y 3D',
    languages: ['C#'],
    iconType: 'react-icon',
    iconName: 'FaUnity',
    color: 'bg-slate-800',
  },
  unreal: {
    label: 'Unreal Engine',
    description: 'Motor AAA con Blueprints y C++',
    languages: ['C++', 'Blueprints'],
    iconType: 'react-icon',
    iconName: 'SiUnrealengine',
    color: 'bg-blue-900',
  },
  godot: {
    label: 'Godot',
    description: 'Motor open-source con GDScript',
    languages: ['GDScript', 'C#'],
    iconType: 'react-icon',
    iconName: 'SiGodotengine',
    color: 'bg-blue-600',
  },
  gamemaker: {
    label: 'GameMaker',
    description: 'Ideal para juegos 2D y prototipos rapidos',
    languages: ['GML'],
    iconType: 'react-icon',
    iconName: 'SiGamemaker',
    color: 'bg-green-700',
  },
  construct: {
    label: 'Construct',
    description: 'Motor visual sin codigo',
    languages: ['Visual'],
    iconType: 'react-icon',
    iconName: 'SiConstruct3',
    color: 'bg-emerald-600',
  },
  other: {
    label: 'Otro',
    description: 'Otro motor o framework no listado',
    languages: [],
    iconType: 'react-icon',
    iconName: 'MdOutlineDashboardCustomize',
    color: 'bg-gray-600',
  },
} as const

export type GameEngineKey = keyof typeof GAME_ENGINES
