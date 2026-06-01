
export enum AppTab {
  ANGLES = 'ANGLES',
  TRY_ON = 'TRY_ON',
  CREATE = 'CREATE',
  HISTORY = 'HISTORY'
}

export type PoseType = 'SWING' | 'PUTTING' | 'WALKING' | 'PORTRAIT' | 'SITTING';

export interface DNAParams {
  face: boolean;
  body: boolean;
  product: boolean;
  pose?: PoseType;
}

export interface ProductImage {
  id: string;
  url: string;
}

export interface SavedModel {
  id: string;
  dataUrl: string;
  timestamp: number;
}

export interface GenerationResult {
  id: string;
  url: string;
  timestamp: number;
  prompt: string;
  lifestyle: string;
}

export type LifestyleType = 
  | 'FAIRWAY_SUNSET' 
  | 'CLUBHOUSE_LOUNGE' 
  | 'TEE_OFF_MORNING' 
  | 'GOLF_RESORT_VILLA' 
  | 'DRIVING_RANGE_PRO' 
  | 'PUTTING_GREEN'
  | 'GOLF_PRO_SHOP'
  | 'BUNKER_SHOT'
  | 'GOLF_CART_PATH'
  | 'LUXURY_LOCKER_ROOM'
  | '3D_GOLF_SIMULATOR'
  | 'CHAMPIONSHIP_PODIUM'
  | 'STUDIO_MINIMAL'
  | 'STUDIO_EDITORIAL'
  | 'STUDIO_DRAMATIC'
  | 'NEON_NIGHT_GOLF'
  | 'DESERT_OASIS'
  | 'RAINY_PERFORMANCE'
  | 'ABSTRACT_FASHION'
  | 'VINTAGE_HERITAGE';

export interface LifestyleOption {
  id: LifestyleType;
  label: string;
  description: string;
  icon: string;
}

export type ImageResolution = '1K' | '2K' | '4K';
