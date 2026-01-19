// Game genres configuration with icons
export const GAME_GENRES = [
  { value: 'action', label: 'Accion', icon: '⚔️' },
  { value: 'adventure', label: 'Aventura', icon: '🗺️' },
  { value: 'rpg', label: 'RPG', icon: '🧙' },
  { value: 'strategy', label: 'Estrategia', icon: '♟️' },
  { value: 'puzzle', label: 'Puzzle', icon: '🧩' },
  { value: 'platformer', label: 'Plataformas', icon: '🏃' },
  { value: 'shooter', label: 'Shooter', icon: '🎯' },
  { value: 'simulation', label: 'Simulacion', icon: '🏗️' },
  { value: 'sports', label: 'Deportes', icon: '⚽' },
  { value: 'racing', label: 'Carreras', icon: '🏎️' },
  { value: 'fighting', label: 'Pelea', icon: '🥊' },
  { value: 'horror', label: 'Terror', icon: '👻' },
  { value: 'survival', label: 'Supervivencia', icon: '🏕️' },
  { value: 'sandbox', label: 'Sandbox', icon: '🪣' },
  { value: 'roguelike', label: 'Roguelike', icon: '💀' },
  { value: 'metroidvania', label: 'Metroidvania', icon: '🗝️' },
  { value: 'visual_novel', label: 'Novela Visual', icon: '📖' },
  { value: 'rhythm', label: 'Ritmo', icon: '🎵' },
  { value: 'tower_defense', label: 'Tower Defense', icon: '🏰' },
  { value: 'card', label: 'Cartas', icon: '🃏' },
  { value: 'idle', label: 'Idle/Clicker', icon: '👆' },
  { value: 'educational', label: 'Educativo', icon: '📚' },
  { value: 'narrative', label: 'Narrativo', icon: '📝' },
  { value: 'multiplayer', label: 'Multijugador', icon: '👥' },
  { value: 'mmo', label: 'MMO', icon: '🌐' },
  { value: 'battle_royale', label: 'Battle Royale', icon: '🏆' },
  { value: 'stealth', label: 'Sigilo', icon: '🥷' },
  { value: 'open_world', label: 'Mundo Abierto', icon: '🌍' },
  { value: 'dungeon_crawler', label: 'Dungeon Crawler', icon: '🏚️' },
  { value: 'bullet_hell', label: 'Bullet Hell', icon: '💫' },
] as const

export type GameGenre = typeof GAME_GENRES[number]['value']

// Art styles for game projects
export const ART_STYLES = [
  { value: 'pixel_art', label: 'Pixel Art', icon: '👾' },
  { value: '2d_cartoon', label: '2D Cartoon', icon: '🎨' },
  { value: '2d_realistic', label: '2D Realista', icon: '🖼️' },
  { value: '2d_anime', label: '2D Anime', icon: '🎌' },
  { value: '2d_vector', label: '2D Vector', icon: '📐' },
  { value: '3d_lowpoly', label: '3D Low Poly', icon: '🔷' },
  { value: '3d_stylized', label: '3D Estilizado', icon: '✨' },
  { value: '3d_realistic', label: '3D Realista', icon: '🎥' },
  { value: 'voxel', label: 'Voxel', icon: '🧊' },
  { value: 'hand_drawn', label: 'Dibujado a mano', icon: '✏️' },
  { value: 'minimalist', label: 'Minimalista', icon: '⬜' },
  { value: 'isometric', label: 'Isometrico', icon: '🔶' },
  { value: 'retro', label: 'Retro', icon: '📺' },
  { value: 'abstract', label: 'Abstracto', icon: '🌀' },
  { value: 'mixed', label: 'Mixto', icon: '🎭' },
] as const

export type ArtStyle = typeof ART_STYLES[number]['value']
