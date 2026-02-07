
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Project, Scene, Shot, AudioTrack, ProjectSettings, Character } from '../types';
import { analyzeScript, analyzeCharacters, generateImage, refineCharacterDetails, generateSpeech, refineShotPrompt } from '../services/geminiService';

interface ProjectState {
  project: Project;
  isLoading: boolean;
  activeView: 'SCRIPT' | 'STORYBOARD' | 'TIMELINE' | 'CHARACTERS';
  selectedSceneId: string | null;
  selectedShotId: string | null;
  isPlaying: boolean;
  currentTime: number;
}

type Action =
  | { type: 'SET_SCRIPT'; payload: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'ANALYSIS_SUCCESS'; payload: Scene[] }
  | { type: 'CHARACTERS_SUCCESS'; payload: Character[] }
  | { type: 'ANALYSIS_ERROR'; payload: string }
  | { type: 'SET_VIEW'; payload: ProjectState['activeView'] }
  | { type: 'SELECT_SHOT'; payload: string | null }
  | { type: 'UPDATE_SHOT'; payload: { shotId: string; updates: Partial<Shot> } }
  | { type: 'MOVE_SHOT'; payload: { sourceShotId: string; targetShotId: string } }
  | { type: 'UPDATE_CHARACTER'; payload: { charId: string; updates: Partial<Character> } }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ProjectSettings> };

const initialProject: Project = {
  id: 'new-project',
  name: 'Untitled Project',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  script: '',
  scenes: [],
  characters: [],
  audioTracks: [],
  settings: {
    visualStyle: 'Cinematic',
    aspectRatio: '16:9',
    resolution: '1080p',
    frameRate: 24
  },
  status: 'draft'
};

const initialState: ProjectState = {
  project: initialProject,
  isLoading: false,
  activeView: 'SCRIPT',
  selectedSceneId: null,
  selectedShotId: null,
  isPlaying: false,
  currentTime: 0,
};

const projectReducer = (state: ProjectState, action: Action): ProjectState => {
  switch (action.type) {
    case 'SET_SCRIPT':
      return { ...state, project: { ...state.project, script: action.payload } };
    case 'START_ANALYSIS':
      return { ...state, isLoading: true };
    case 'ANALYSIS_SUCCESS':
      return {
        ...state,
        isLoading: false,
        activeView: 'STORYBOARD',
        project: { ...state.project, scenes: action.payload }
      };
    case 'CHARACTERS_SUCCESS':
      return {
        ...state,
        isLoading: false,
        project: { ...state.project, characters: action.payload }
      };
    case 'ANALYSIS_ERROR':
      return { ...state, isLoading: false }; // In real app, store error
    case 'SET_VIEW':
      return { ...state, activeView: action.payload };
    case 'SELECT_SHOT':
      return { ...state, selectedShotId: action.payload };
    case 'UPDATE_SHOT': {
      const newScenes = state.project.scenes.map(scene => ({
        ...scene,
        subScenes: scene.subScenes.map(sub => ({
          ...sub,
          shots: sub.shots.map(shot => 
            shot.id === action.payload.shotId ? { ...shot, ...action.payload.updates } : shot
          )
        }))
      }));
      return { ...state, project: { ...state.project, scenes: newScenes } };
    }
    case 'MOVE_SHOT': {
      const { sourceShotId, targetShotId } = action.payload;
      if (sourceShotId === targetShotId) return state;

      // Deep copy scenes to perform surgery
      const newScenes = JSON.parse(JSON.stringify(state.project.scenes));
      
      let sourceShot: Shot | null = null;
      
      // 1. Find and remove source shot
      outerLoop:
      for (const scene of newScenes) {
        for (const sub of scene.subScenes) {
          const idx = sub.shots.findIndex((s: Shot) => s.id === sourceShotId);
          if (idx !== -1) {
            [sourceShot] = sub.shots.splice(idx, 1);
            break outerLoop;
          }
        }
      }

      if (!sourceShot) return state;

      // 2. Insert at target position
      let inserted = false;
      outerLoopInsert:
      for (const scene of newScenes) {
        for (const sub of scene.subScenes) {
          const idx = sub.shots.findIndex((s: Shot) => s.id === targetShotId);
          if (idx !== -1) {
            sub.shots.splice(idx, 0, sourceShot);
            inserted = true;
            break outerLoopInsert;
          }
        }
      }

      // If dropped somewhere invalid or target not found, we revert (by returning state, effectively cancelling the removal)
      // Ideally we would place it at the end, but for 'swap/reorder' logic, target is required.
      if (!inserted) return state;

      return { ...state, project: { ...state.project, scenes: newScenes } };
    }
    case 'UPDATE_CHARACTER': {
        const newCharacters = state.project.characters.map(char => 
            char.id === action.payload.charId ? { ...char, ...action.payload.updates } : char
        );
        return { ...state, project: { ...state.project, characters: newCharacters }};
    }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_TIME':
      return { ...state, currentTime: action.payload };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        project: {
          ...state.project,
          settings: { ...state.project.settings, ...action.payload }
        }
      };
    default:
      return state;
  }
};

const ProjectContext = createContext<{
  state: ProjectState;
  dispatch: React.Dispatch<Action>;
  runAnalysis: () => Promise<void>;
  runCharacterAnalysis: () => Promise<void>;
  refineCharacter: (charId: string) => Promise<void>;
  refineShot: (shotId: string) => Promise<void>;
  generateShot: (shotId: string) => Promise<void>;
  generateBRoll: (shotId: string) => Promise<void>;
  generateCharacterImage: (charId: string) => Promise<void>;
  generateAllCharacterImages: () => Promise<void>;
  generateVoiceOver: (shotId: string, text: string) => Promise<void>;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
} | null>(null);

export const ProjectProvider = ({ children }: { children?: ReactNode }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('currentProject');
    if (saved) {
      // Logic to restore state could go here
    }
  }, []);

  // Save on change
  useEffect(() => {
    localStorage.setItem('currentProject', JSON.stringify(state.project));
  }, [state.project]);

  const runAnalysis = async () => {
    dispatch({ type: 'START_ANALYSIS' });
    try {
      const scenes = await analyzeScript(state.project.script);
      dispatch({ type: 'ANALYSIS_SUCCESS', payload: scenes });
    } catch (e) {
      console.error(e);
      dispatch({ type: 'ANALYSIS_ERROR', payload: "Failed" });
    }
  };

  const runCharacterAnalysis = async () => {
    dispatch({ type: 'START_ANALYSIS' });
    try {
        const characters = await analyzeCharacters(state.project.script);
        dispatch({ type: 'CHARACTERS_SUCCESS', payload: characters });
    } catch (e) {
        console.error(e);
        dispatch({ type: 'ANALYSIS_ERROR', payload: "Failed Character Analysis"});
    }
  };

  const refineCharacter = async (charId: string) => {
    const char = state.project.characters.find(c => c.id === charId);
    if (!char) return;

    dispatch({ type: 'UPDATE_CHARACTER', payload: { charId, updates: { isRefining: true } } });
    
    try {
        const details = await refineCharacterDetails(char.name, state.project.script);
        if (details.description && details.visualPrompt) {
            dispatch({
                type: 'UPDATE_CHARACTER',
                payload: {
                    charId,
                    updates: {
                        description: details.description,
                        visualPrompt: details.visualPrompt,
                        isRefining: false
                    }
                }
            });
        }
    } catch (e) {
        console.error("Failed to refine character", e);
        dispatch({ type: 'UPDATE_CHARACTER', payload: { charId, updates: { isRefining: false } } });
    }
  };

  const refineShot = async (shotId: string) => {
    // Find shot and parent scene
    let shot: Shot | undefined;
    let scene: Scene | undefined;
    
    for (const s of state.project.scenes) {
        for (const sub of s.subScenes) {
            const found = sub.shots.find(sh => sh.id === shotId);
            if (found) {
                shot = found;
                scene = s;
                break;
            }
        }
        if (shot) break;
    }

    if (!shot || !scene) return;

    dispatch({ type: 'UPDATE_SHOT', payload: { shotId, updates: { isRefining: true } } });

    try {
        const refinedPrompt = await refineShotPrompt(shot, scene.mood, state.project.settings.visualStyle);
        dispatch({ 
            type: 'UPDATE_SHOT', 
            payload: { 
                shotId, 
                updates: { 
                    visualPrompt: refinedPrompt,
                    isRefining: false 
                } 
            } 
        });
    } catch (e) {
        console.error("Failed to refine shot", e);
        dispatch({ type: 'UPDATE_SHOT', payload: { shotId, updates: { isRefining: false } } });
    }
  };

  const generateShot = async (shotId: string) => {
    // Mock video generation
    dispatch({ type: 'UPDATE_SHOT', payload: { shotId, updates: { status: 'generating' } } });
    setTimeout(() => {
      // Generate a random placeholder image URL
      const randomId = Math.floor(Math.random() * 1000);
      const imageUrl = `https://picsum.photos/seed/${randomId}/1920/1080`;
      dispatch({ 
        type: 'UPDATE_SHOT', 
        payload: { 
          shotId, 
          updates: { 
            status: 'completed', 
            imageUrl: imageUrl, 
            videoUrl: imageUrl // Using image as video placeholder
          } 
        } 
      });
    }, 2000);
  };

  const generateBRoll = async (shotId: string) => {
    // Find shot
    let shot: Shot | undefined;
    for (const s of state.project.scenes) {
        for (const sub of s.subScenes) {
            const found = sub.shots.find(sh => sh.id === shotId);
            if (found) {
                shot = found;
                break;
            }
        }
        if (shot) break;
    }

    if (!shot) return;

    dispatch({ type: 'UPDATE_SHOT', payload: { shotId, updates: { isGeneratingBRoll: true } } });

    const prompt = `Cinematic B-roll footage texture overlay, ${shot.visualPrompt}, ${state.project.settings.visualStyle} style, abstract, atmospheric background, sharp focus, high quality, 16:9`;

    try {
        // We use generateImage as a proxy for a single frame video generation for the B-roll overlay
        const imageUrl = await generateImage(prompt, '16:9');
        dispatch({
            type: 'UPDATE_SHOT',
            payload: {
                shotId,
                updates: {
                    bRollUrl: imageUrl,
                    isGeneratingBRoll: false
                }
            }
        });
    } catch (e) {
        console.error("Failed to generate B-Roll", e);
        dispatch({ type: 'UPDATE_SHOT', payload: { shotId, updates: { isGeneratingBRoll: false } } });
    }
  };

  const generateCharacterImage = async (charId: string) => {
    const char = state.project.characters.find(c => c.id === charId);
    if (!char) return;

    // Prevent duplicate requests
    if (char.status === 'generating') return;

    dispatch({ type: 'UPDATE_CHARACTER', payload: { charId, updates: { status: 'generating' } } });

    // Sophisticated Prompt Generation
    
    // 1. Gather context from scenes where this character appears to find the best environment match
    // Sort scenes by those that explicitly mention the character in the description or characters list
    const relevantScenes = state.project.scenes.filter(s => 
        s.characters.includes(char.name) || 
        s.description.toLowerCase().includes(char.name.toLowerCase())
    );

    // Default to the first relevant scene or just the first scene if none specific found
    const contextScene = relevantScenes.length > 0 ? relevantScenes[0] : state.project.scenes[0];
    
    const location = contextScene ? contextScene.location : "Neutral cinematic studio background";
    const timeOfDay = contextScene ? contextScene.timeOfDay : "dramatic lighting";
    const mood = contextScene ? contextScene.mood : "Character Portrait";
    
    // 2. Incorporate global project settings with specific style keywords
    const visualStyle = state.project.settings.visualStyle;
    let styleKeywords = "cinematic, photorealistic, 8k, highly detailed, sharp focus";
    
    if (visualStyle === 'Animation') styleKeywords = "3D pixar style animation, stylized, vibrant, octane render, smooth textures";
    if (visualStyle === 'Minimalist') styleKeywords = "minimalist, clean lines, flat colors, abstract, modern art direction";
    if (visualStyle === 'Documentary') styleKeywords = "raw, handheld camera feel, natural lighting, gritty realism, 35mm film grain, editorial photography";
    if (visualStyle === 'Cinematic') styleKeywords = "cinematic lighting, dramatic atmosphere, anamorphic lens, shallow depth of field, color graded, movie poster quality";

    // 3. Construct the detailed prompt
    const prompt = `
      Medium shot portrait of ${char.name} (${char.role}).
      
      Visual Details: ${char.visualPrompt}
      Personality Traits: ${char.description}
      
      Context & Environment:
      Location: ${location}
      Time/Lighting: ${timeOfDay}
      Mood: ${mood}
      
      Art Direction: ${styleKeywords}.
      Composition: Professional portraiture, center frame, looking at camera or slightly off-axis.
    `.trim();

    try {
        const imageUrl = await generateImage(prompt, '3:4'); // Portrait aspect ratio

        dispatch({
            type: 'UPDATE_CHARACTER',
            payload: {
                charId,
                updates: {
                    status: 'completed',
                    imageUrl: imageUrl
                }
            }
        });
    } catch (e) {
        console.error("Failed to generate character image", e);
        dispatch({ type: 'UPDATE_CHARACTER', payload: { charId, updates: { status: 'pending' } } }); // Reset status on error
    }
  };

  const generateAllCharacterImages = async () => {
    state.project.characters.forEach(char => {
        if (!char.imageUrl && char.status !== 'generating') {
            generateCharacterImage(char.id);
        }
    });
  };

  const generateVoiceOver = async (shotId: string, text: string) => {
      // Optimistic update if needed, but here we just wait
      try {
          const audioUrl = await generateSpeech(text);
          dispatch({
              type: 'UPDATE_SHOT',
              payload: {
                  shotId,
                  updates: {
                      voiceOverUrl: audioUrl,
                      voiceOverScript: text
                  }
              }
          });
      } catch (e) {
          console.error("Voice over generation failed", e);
      }
  };

  const updateSettings = (settings: Partial<ProjectSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  return (
    <ProjectContext.Provider value={{ state, dispatch, runAnalysis, runCharacterAnalysis, refineCharacter, refineShot, generateShot, generateBRoll, generateCharacterImage, generateAllCharacterImages, generateVoiceOver, updateSettings }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectProvider");
  return context;
};
