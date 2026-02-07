
export type CameraAngle = 'wide' | 'medium' | 'close-up' | 'extreme-close-up' | 'overhead';
export type CameraMovement = 'static' | 'pan' | 'tilt' | 'zoom' | 'dolly' | 'tracking';
export type ShotStatus = 'pending' | 'generating' | 'completed' | 'error';
export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
export type VisualStyle = 'Cinematic' | 'Documentary' | 'Animation' | 'Minimalist';

export interface Shot {
  id: string;
  sceneId: string;
  visualPrompt: string;
  userPrompt?: string;
  duration: number; // seconds
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  imageUrl?: string;
  videoUrl?: string;
  bRollUrl?: string; // Secondary video/overlay
  pipUrl?: string; // Picture-in-Picture / Insert clip
  status: ShotStatus;
  style: string;
  timestamp: number; // timeline position
  focalLength?: string;
  aperture?: string;
  iso?: string;
  voiceOverUrl?: string;
  voiceOverScript?: string;
  isRefining?: boolean;
  isGeneratingBRoll?: boolean;
}

export interface SubScene {
  id: string;
  parentSceneId: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  shots: Shot[];
  action: string;
  mood: string;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  location: string;
  timeOfDay: TimeOfDay;
  weather?: string;
  mood: string;
  characters: string[];
  subScenes: SubScene[];
  startTime: number;
  endTime: number;
}

export interface Character {
  id: string;
  name: string;
  role: string; // e.g. Protagonist, Antagonist, Supporting
  description: string; // Personality and background
  visualPrompt: string; // Physical appearance for AI generation
  imageUrl?: string;
  status: 'pending' | 'generating' | 'completed';
  isRefining?: boolean;
}

export interface AudioTrack {
  id: string;
  type: 'dialogue' | 'narration' | 'music' | 'sfx';
  url: string;
  name: string;
  startTime: number;
  duration: number;
  volume: number;
}

export interface ProjectSettings {
  visualStyle: VisualStyle;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  resolution: '720p' | '1080p' | '4K' | '8K';
  frameRate: 24 | 30 | 60 | 120 | 240;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  script: string;
  scenes: Scene[];
  characters: Character[];
  audioTracks: AudioTrack[];
  settings: ProjectSettings;
  status: 'draft' | 'processing' | 'completed';
}

export enum AppView {
  SCRIPT = 'SCRIPT',
  STORYBOARD = 'STORYBOARD',
  TIMELINE = 'TIMELINE',
  CHARACTERS = 'CHARACTERS'
}
