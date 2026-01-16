// Game engines configuration
export const GAME_ENGINES = {
  unity: {
    label: 'Unity',
    description: 'Motor multiplataforma popular para 2D y 3D',
    languages: ['C#'],
  },
  unreal: {
    label: 'Unreal Engine',
    description: 'Motor AAA con Blueprints y C++',
    languages: ['C++', 'Blueprints'],
  },
  godot: {
    label: 'Godot',
    description: 'Motor open-source con GDScript',
    languages: ['GDScript', 'C#'],
  },
  gamemaker: {
    label: 'GameMaker',
    description: 'Ideal para juegos 2D y prototipos rapidos',
    languages: ['GML'],
  },
  construct: {
    label: 'Construct',
    description: 'Motor visual sin codigo',
    languages: ['Visual'],
  },
  phaser: {
    label: 'Phaser',
    description: 'Framework JavaScript para juegos web',
    languages: ['JavaScript', 'TypeScript'],
  },
  renpy: {
    label: "Ren'Py",
    description: 'Motor especializado en novelas visuales',
    languages: ['Python'],
  },
  rpgmaker: {
    label: 'RPG Maker',
    description: 'Motor para crear RPGs clasicos',
    languages: ['JavaScript', 'Ruby'],
  },
  custom: {
    label: 'Custom/Otro',
    description: 'Framework propio o motor no listado',
    languages: [],
  },
} as const

export type GameEngineKey = keyof typeof GAME_ENGINES
