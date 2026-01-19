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
  phaser: {
    label: 'Phaser',
    description: 'Framework JavaScript para juegos web',
    languages: ['JavaScript', 'TypeScript'],
    iconType: 'image',
    iconUrl: 'https://cdn.phaser.io/images/logo/phaser-planet-web.png',
    color: 'bg-purple-600',
  },
  renpy: {
    label: "Ren'Py",
    description: 'Motor especializado en novelas visuales',
    languages: ['Python'],
    iconType: 'react-icon',
    iconName: 'SiRenpy',
    color: 'bg-pink-600',
  },
  rpgmaker: {
    label: 'RPG Maker',
    description: 'Motor para crear RPGs clasicos',
    languages: ['JavaScript', 'Ruby'],
    iconType: 'image',
    iconUrl: 'https://cdn.prod.website-files.com/5efc0159f9a97ba05a8b2902/5f2938eda3e9bd25724fcb6e_rpg-maker-logo.svg',
    color: 'bg-orange-600',
    darkInvert: true,
  },
  pygame: {
    label: 'Pygame',
    description: 'Biblioteca Python para juegos 2D',
    languages: ['Python'],
    iconType: 'image',
    iconUrl: 'https://www.pygame.org/docs/_static/pygame_logo.svg',
    color: 'bg-yellow-600',
  },
  love2d: {
    label: 'LOVE 2D',
    description: 'Framework Lua para juegos 2D',
    languages: ['Lua'],
    iconType: 'image',
    iconUrl: 'https://love2d.org/style/logo.png',
    color: 'bg-pink-500',
  },
  defold: {
    label: 'Defold',
    description: 'Motor multiplataforma de King',
    languages: ['Lua'],
    iconType: 'image',
    iconUrl: 'https://forum.defold.com/uploads/default/original/3X/3/9/397d7884aa8851a1697ec548fb01325643938a16.png',
    color: 'bg-orange-500',
    darkInvert: true,
  },
  custom: {
    label: 'Custom/Otro',
    description: 'Framework propio o motor no listado',
    languages: [],
    iconType: 'react-icon',
    iconName: 'MdOutlineDashboardCustomize',
    color: 'bg-gray-600',
  },
} as const

export type GameEngineKey = keyof typeof GAME_ENGINES
