// Game genres configuration
export const GAME_GENRES = [
  { value: 'action', label: 'Accion' },
  { value: 'adventure', label: 'Aventura' },
  { value: 'rpg', label: 'RPG' },
  { value: 'strategy', label: 'Estrategia' },
  { value: 'puzzle', label: 'Puzzle' },
  { value: 'platformer', label: 'Plataformas' },
  { value: 'shooter', label: 'Shooter' },
  { value: 'simulation', label: 'Simulacion' },
  { value: 'sports', label: 'Deportes' },
  { value: 'racing', label: 'Carreras' },
  { value: 'fighting', label: 'Pelea' },
  { value: 'horror', label: 'Terror' },
  { value: 'survival', label: 'Supervivencia' },
  { value: 'sandbox', label: 'Sandbox' },
  { value: 'roguelike', label: 'Roguelike' },
  { value: 'metroidvania', label: 'Metroidvania' },
  { value: 'visual_novel', label: 'Novela Visual' },
  { value: 'rhythm', label: 'Ritmo' },
  { value: 'tower_defense', label: 'Tower Defense' },
  { value: 'card', label: 'Cartas' },
  { value: 'idle', label: 'Idle/Clicker' },
  { value: 'educational', label: 'Educativo' },
  { value: 'narrative', label: 'Narrativo' },
  { value: 'multiplayer', label: 'Multijugador' },
] as const

export type GameGenre = typeof GAME_GENRES[number]['value']

// Art styles for game projects
export const ART_STYLES = [
  { value: 'pixel_art', label: 'Pixel Art' },
  { value: '2d_cartoon', label: '2D Cartoon' },
  { value: '2d_realistic', label: '2D Realista' },
  { value: '2d_anime', label: '2D Anime' },
  { value: '2d_vector', label: '2D Vector' },
  { value: '3d_lowpoly', label: '3D Low Poly' },
  { value: '3d_stylized', label: '3D Estilizado' },
  { value: '3d_realistic', label: '3D Realista' },
  { value: 'voxel', label: 'Voxel' },
  { value: 'hand_drawn', label: 'Dibujado a mano' },
  { value: 'minimalist', label: 'Minimalista' },
  { value: 'isometric', label: 'Isometrico' },
  { value: 'retro', label: 'Retro' },
  { value: 'abstract', label: 'Abstracto' },
  { value: 'mixed', label: 'Mixto' },
] as const

export type ArtStyle = typeof ART_STYLES[number]['value']
