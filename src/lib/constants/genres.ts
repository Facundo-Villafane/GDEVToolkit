// Game genres configuration
// Icons reference React Icons component names

export interface GameGenreConfig {
  value: string
  label: string
  iconName: string
}

export const GAME_GENRES: readonly GameGenreConfig[] = [
  { value: 'action', label: 'Accion', iconName: 'GiSwordWound' },
  { value: 'adventure', label: 'Aventura', iconName: 'GiTreasureMap' },
  { value: 'rpg', label: 'RPG', iconName: 'GiMagicSwirl' },
  { value: 'strategy', label: 'Estrategia', iconName: 'GiChessKnight' },
  { value: 'puzzle', label: 'Puzzle', iconName: 'GiPuzzle' },
  { value: 'platformer', label: 'Plataformas', iconName: 'GiRunningNinja' },
  { value: 'shooter', label: 'Shooter', iconName: 'GiCrosshair' },
  { value: 'simulation', label: 'Simulacion', iconName: 'GiFactory' },
  { value: 'sports', label: 'Deportes', iconName: 'GiSoccerBall' },
  { value: 'racing', label: 'Carreras', iconName: 'GiRaceCar' },
  { value: 'fighting', label: 'Pelea', iconName: 'GiBoxingGlove' },
  { value: 'horror', label: 'Terror', iconName: 'GiGhost' },
  { value: 'survival', label: 'Supervivencia', iconName: 'GiCampfire' },
  { value: 'sandbox', label: 'Sandbox', iconName: 'GiCube' },
  { value: 'roguelike', label: 'Roguelike', iconName: 'GiSkullCrossedBones' },
  { value: 'metroidvania', label: 'Metroidvania', iconName: 'GiDoorway' },
  { value: 'visual_novel', label: 'Novela Visual', iconName: 'GiBookmarklet' },
  { value: 'rhythm', label: 'Ritmo', iconName: 'GiMusicalNotes' },
  { value: 'tower_defense', label: 'Tower Defense', iconName: 'GiCastle' },
  { value: 'card', label: 'Cartas', iconName: 'GiCardPlay' },
  { value: 'idle', label: 'Idle/Clicker', iconName: 'GiClick' },
  { value: 'educational', label: 'Educativo', iconName: 'GiBookCover' },
  { value: 'narrative', label: 'Narrativo', iconName: 'GiQuillInk' },
  { value: 'multiplayer', label: 'Multijugador', iconName: 'GiThreeFriends' },
  { value: 'mmo', label: 'MMO', iconName: 'GiEarthAmerica' },
  { value: 'battle_royale', label: 'Battle Royale', iconName: 'GiTrophy' },
  { value: 'stealth', label: 'Sigilo', iconName: 'GiNinjaHeroicStance' },
  { value: 'open_world', label: 'Mundo Abierto', iconName: 'GiWorld' },
  { value: 'dungeon_crawler', label: 'Dungeon Crawler', iconName: 'GiDungeonGate' },
  { value: 'bullet_hell', label: 'Bullet Hell', iconName: 'GiLaserBurst' },
] as const

export type GameGenre = typeof GAME_GENRES[number]['value']

// Art styles for game projects
export interface ArtStyleConfig {
  value: string
  label: string
  iconName: string
}

export const ART_STYLES: readonly ArtStyleConfig[] = [
  { value: 'pixel_art', label: 'Pixel Art', iconName: 'GiPixelatedPointer' },
  { value: '2d_cartoon', label: '2D Cartoon', iconName: 'GiPaintBrush' },
  { value: '2d_realistic', label: '2D Realista', iconName: 'GiPhotoCamera' },
  { value: '2d_anime', label: '2D Anime', iconName: 'GiJapan' },
  { value: '2d_vector', label: '2D Vector', iconName: 'GiVectorDown' },
  { value: '3d_lowpoly', label: '3D Low Poly', iconName: 'Gi3DGlasses' },
  { value: '3d_stylized', label: '3D Estilizado', iconName: 'GiCrystalBall' },
  { value: '3d_realistic', label: '3D Realista', iconName: 'GiFilmProjector' },
  { value: 'voxel', label: 'Voxel', iconName: 'GiCube' },
  { value: 'hand_drawn', label: 'Dibujado a mano', iconName: 'GiPencilBrush' },
  { value: 'minimalist', label: 'Minimalista', iconName: 'GiSquare' },
  { value: 'isometric', label: 'Isometrico', iconName: 'GiIsland' },
  { value: 'retro', label: 'Retro', iconName: 'GiRetroController' },
  { value: 'abstract', label: 'Abstracto', iconName: 'GiAbstract047' },
  { value: 'mixed', label: 'Mixto', iconName: 'GiPalette' },
] as const

export type ArtStyle = typeof ART_STYLES[number]['value']
