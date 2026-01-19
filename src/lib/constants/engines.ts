// Game engines configuration with icons
export const GAME_ENGINES = {
  unity: {
    label: 'Unity',
    description: 'Motor multiplataforma popular para 2D y 3D',
    languages: ['C#'],
    icon: '🎮',
    color: 'bg-slate-800',
  },
  unreal: {
    label: 'Unreal Engine',
    description: 'Motor AAA con Blueprints y C++',
    languages: ['C++', 'Blueprints'],
    icon: '🔷',
    color: 'bg-blue-900',
  },
  godot: {
    label: 'Godot',
    description: 'Motor open-source con GDScript',
    languages: ['GDScript', 'C#'],
    icon: '🤖',
    color: 'bg-blue-600',
  },
  gamemaker: {
    label: 'GameMaker',
    description: 'Ideal para juegos 2D y prototipos rapidos',
    languages: ['GML'],
    icon: '🎯',
    color: 'bg-green-700',
  },
  construct: {
    label: 'Construct',
    description: 'Motor visual sin codigo',
    languages: ['Visual'],
    icon: '🧱',
    color: 'bg-emerald-600',
  },
  phaser: {
    label: 'Phaser',
    description: 'Framework JavaScript para juegos web',
    languages: ['JavaScript', 'TypeScript'],
    icon: '⚡',
    color: 'bg-purple-600',
  },
  renpy: {
    label: "Ren'Py",
    description: 'Motor especializado en novelas visuales',
    languages: ['Python'],
    icon: '📖',
    color: 'bg-pink-600',
  },
  rpgmaker: {
    label: 'RPG Maker',
    description: 'Motor para crear RPGs clasicos',
    languages: ['JavaScript', 'Ruby'],
    icon: '⚔️',
    color: 'bg-orange-600',
  },
  pygame: {
    label: 'Pygame',
    description: 'Biblioteca Python para juegos 2D',
    languages: ['Python'],
    icon: '🐍',
    color: 'bg-yellow-600',
  },
  love2d: {
    label: 'LÖVE 2D',
    description: 'Framework Lua para juegos 2D',
    languages: ['Lua'],
    icon: '💗',
    color: 'bg-pink-500',
  },
  defold: {
    label: 'Defold',
    description: 'Motor multiplataforma de King',
    languages: ['Lua'],
    icon: '🦊',
    color: 'bg-orange-500',
  },
  custom: {
    label: 'Custom/Otro',
    description: 'Framework propio o motor no listado',
    languages: [],
    icon: '🛠️',
    color: 'bg-gray-600',
  },
} as const

export type GameEngineKey = keyof typeof GAME_ENGINES
