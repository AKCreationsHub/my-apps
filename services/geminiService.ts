
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Scene, Shot, SubScene, Character } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize the client
let aiClient: GoogleGenAI | null = null;
if (API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: API_KEY });
}

export const analyzeScript = async (scriptText: string): Promise<Scene[]> => {
  if (!aiClient) {
    console.warn("Gemini API Key missing. Returning mock data.");
    return mockAnalysis();
  }

  const model = "gemini-3-pro-preview"; // Using the reasoning model for complex breakdown

  const systemInstruction = `
    You are an expert film director and cinematographer. 
    Analyze the provided screenplay script and break it down into a detailed structured format.
    
    1. Identify Scenes based on location/time headers (INT./EXT.).
    2. Break scenes into SubScenes (beats/moments).
    3. Suggest Shots for each SubScene with visual descriptions and camera directions.
    
    Return the response in strict JSON format.
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Scene heading e.g., INT. KITCHEN - DAY" },
        description: { type: Type.STRING, description: "Brief summary of the scene" },
        location: { type: Type.STRING },
        timeOfDay: { type: Type.STRING, enum: ["dawn", "morning", "afternoon", "evening", "night"] },
        mood: { type: Type.STRING },
        characters: { type: Type.ARRAY, items: { type: Type.STRING } },
        subScenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Short name for the beat" },
              description: { type: Type.STRING },
              action: { type: Type.STRING },
              mood: { type: Type.STRING },
              shots: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    visualPrompt: { type: Type.STRING, description: "Detailed visual description for AI generation" },
                    duration: { type: Type.NUMBER, description: "Estimated duration in seconds" },
                    cameraAngle: { type: Type.STRING, enum: ["wide", "medium", "close-up", "extreme-close-up", "overhead"] },
                    cameraMovement: { type: Type.STRING, enum: ["static", "pan", "tilt", "zoom", "dolly", "tracking"] },
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  try {
    const response = await aiClient.models.generateContent({
      model: model,
      contents: scriptText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const rawData = JSON.parse(response.text || "[]");
    return mapResponseToInternalTypes(rawData);

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error("Failed to analyze script. Please check your API key or script format.");
  }
};

export const analyzeCharacters = async (scriptText: string): Promise<Character[]> => {
  if (!aiClient) {
    return mockCharacterAnalysis();
  }

  const model = "gemini-3-flash-preview";

  const systemInstruction = `
    You are a Casting Director and Concept Artist. 
    Analyze the script to identify the key characters.
    For each character, provide a role, a personality description, and a highly detailed visual prompt suitable for generating a character portrait.
    The visual prompt should describe facial features, clothing, style, and distinctive markers.
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        role: { type: Type.STRING },
        description: { type: Type.STRING, description: "Personality and background summary" },
        visualPrompt: { type: Type.STRING, description: "Physical appearance, clothing, lighting for image generation" }
      }
    }
  };

  try {
    const response = await aiClient.models.generateContent({
      model: model,
      contents: scriptText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const rawData = JSON.parse(response.text || "[]");
    
    return rawData.map((char: any, idx: number) => ({
      id: `char-${idx}`,
      name: char.name,
      role: char.role,
      description: char.description,
      visualPrompt: char.visualPrompt,
      status: 'pending'
    }));

  } catch (error) {
    console.error("Character Analysis Failed", error);
    return mockCharacterAnalysis();
  }
};

export const refineCharacterDetails = async (name: string, scriptText: string): Promise<{ description: string; visualPrompt: string }> => {
  if (!aiClient) {
    await new Promise(r => setTimeout(r, 1500));
    return {
       description: `Refined description for ${name}. This character shows depth and complexity based on the script analysis.`,
       visualPrompt: `Highly detailed portrait of ${name}, featuring specific details from the script, cinematic lighting, photorealistic.`
    };
  }

  const model = "gemini-3-flash-preview";

  const systemInstruction = `
    You are an expert Character Designer and Concept Artist.
    Analyze the provided script and locate every mention of the character "${name}".
    
    Based on their dialogue, actions, and interactions, generate:
    1. A refined, deep psychological profile (description).
    2. An improved, highly specific visual prompt (visualPrompt) for an AI image generator. Include facial features, clothing, accessories, and style.
    
    Return the result in JSON.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING },
      visualPrompt: { type: Type.STRING }
    }
  };

  try {
    const response = await aiClient.models.generateContent({
      model: model,
      contents: scriptText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Refine Character Failed", error);
    throw error;
  }
};

export const refineShotPrompt = async (shot: Shot, mood: string, style: string): Promise<string> => {
    if (!aiClient) {
        await new Promise(r => setTimeout(r, 1000));
        // Updated mock to match the user's requested format
        return `${shot.cameraAngle} shot, ${shot.cameraMovement}, establishing the ${mood} mood. ${shot.visualPrompt} with ${style} aesthetic.`;
    }

    const model = "gemini-3-flash-preview";
    
    const systemInstruction = `
        You are an expert Cinematographer and AI Video Prompt Engineer.
        Rewrite the provided visual prompt to be highly descriptive, cinematic, and optimized for video generation.
        
        Structure your response exactly like this example:
        "Wide shot, static, establishing the scene mood. [Detailed Description...]"
        
        1. Start with the specific camera angle (e.g., Wide shot, Close-up).
        2. Follow with the camera movement (e.g., static, pan, tracking).
        3. Mention the intended mood explicitly (e.g., establishing the suspenseful mood).
        4. Then provide a rich, detailed visual description of the subject, environment, lighting, and textures.
        
        Use the provided Project Style (${style}) to guide the aesthetic vocabulary.
        Output ONLY the refined prompt text.
    `;

    const prompt = `
        Input Prompt: "${shot.visualPrompt}"
        Camera Angle: ${shot.cameraAngle}
        Camera Movement: ${shot.cameraMovement}
        Scene Mood: ${mood}
        Project Style: ${style}
    `;

    try {
        const response = await aiClient.models.generateContent({
            model,
            contents: prompt,
            config: { systemInstruction }
        });
        return response.text?.trim() || shot.visualPrompt;
    } catch (error) {
        console.error("Refine Shot Error", error);
        throw error;
    }
};

export const generateImage = async (prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "16:9" | "9:16" = "1:1"): Promise<string> => {
    if (!aiClient) {
        // Mock fallback delay and image
        await new Promise(r => setTimeout(r, 1500));
        const randomId = Math.floor(Math.random() * 1000);
        return `https://picsum.photos/seed/${randomId}/512/768`;
    }

    try {
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio
                }
            }
        });

        for (const candidate of response.candidates || []) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No image generated in response");
    } catch (error) {
        console.error("Image Gen Error", error);
        // Fallback on error so UI doesn't break
        const randomId = Math.floor(Math.random() * 1000);
        return `https://picsum.photos/seed/${randomId}/512/768`;
    }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
    if (!aiClient) {
        // Fallback for demo without API key
        await new Promise(r => setTimeout(r, 1500));
        return 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg'; // Placeholder audio
    }

    try {
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio content returned");

        // Convert base64 PCM to a playable WAV Blob
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Gemini returns raw PCM at 24000Hz, 1 channel
        // We need to wrap it in a WAV header to make it playable by <audio>
        const wavBytes = pcmToWav(bytes, 24000);
        const blob = new Blob([wavBytes], { type: 'audio/wav' });
        return URL.createObjectURL(blob);

    } catch (error) {
        console.error("Speech Gen Error", error);
        throw error;
    }
};

// Helper function to add WAV header to raw PCM data
function pcmToWav(pcmData: Uint8Array, sampleRate: number): Uint8Array {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = pcmData.length;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // RIFF chunk
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM data
    const wavBytes = new Uint8Array(buffer);
    wavBytes.set(pcmData, 44);

    return wavBytes;
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Helper to map generic JSON to our specific TS types with IDs
const mapResponseToInternalTypes = (data: any[]): Scene[] => {
  let currentTime = 0;
  
  return data.map((sceneData: any, sIdx: number) => {
    const sceneId = `scene-${sIdx}`;
    let sceneDuration = 0;
    
    const subScenes = (sceneData.subScenes || []).map((sub: any, subIdx: number) => {
      let subDuration = 0;
      const shots = (sub.shots || []).map((shot: any, shotIdx: number) => {
        const duration = shot.duration || 4;
        subDuration += duration;
        return {
          id: `shot-${sIdx}-${subIdx}-${shotIdx}`,
          sceneId: sceneId,
          visualPrompt: shot.visualPrompt || "A cinematic shot",
          duration: duration,
          cameraAngle: shot.cameraAngle || 'medium',
          cameraMovement: shot.cameraMovement || 'static',
          status: 'pending',
          style: 'Cinematic Realism',
          timestamp: 0 // Calculated later if needed, relative to timeline
        } as Shot;
      });

      sceneDuration += subDuration;

      return {
        id: `sub-${sIdx}-${subIdx}`,
        parentSceneId: sceneId,
        title: sub.title || `Beat ${subIdx + 1}`,
        description: sub.description || "",
        action: sub.action || "",
        mood: sub.mood || sceneData.mood || "Neutral",
        startTime: 0,
        endTime: 0,
        shots: shots
      } as SubScene;
    });

    const scene: Scene = {
      id: sceneId,
      title: sceneData.title || `Scene ${sIdx + 1}`,
      description: sceneData.description || "",
      location: sceneData.location || "Unknown",
      timeOfDay: (sceneData.timeOfDay as any) || "day",
      mood: sceneData.mood || "Neutral",
      characters: sceneData.characters || [],
      subScenes: subScenes,
      startTime: currentTime,
      endTime: currentTime + sceneDuration
    };

    currentTime += sceneDuration;
    return scene;
  });
};

const mockAnalysis = async (): Promise<Scene[]> => {
  await new Promise(r => setTimeout(r, 1500));
  return mapResponseToInternalTypes([
    {
      title: "INT. COFFEE SHOP - DAY",
      description: "A bustling coffee shop in the city.",
      location: "Coffee Shop",
      timeOfDay: "morning",
      mood: "Energetic",
      characters: ["JANE", "BARISTA"],
      subScenes: [
        {
          title: "Jane Enters",
          description: "Jane walks into the shop, looking tired.",
          action: "Jane pushes door open",
          shots: [
            { visualPrompt: "Wide shot of a modern coffee shop, sunlight streaming in, Jane enters from left", duration: 4, cameraAngle: "wide", cameraMovement: "static" },
            { visualPrompt: "Close up of Jane's face, looking exhausted, under eye circles", duration: 3, cameraAngle: "close-up", cameraMovement: "tracking" }
          ]
        },
        {
          title: "Ordering",
          description: "Jane orders a large black coffee.",
          action: "Jane speaks to Barista",
          shots: [
            { visualPrompt: "Over the shoulder shot of Jane talking to Barista", duration: 5, cameraAngle: "medium", cameraMovement: "static" }
          ]
        }
      ]
    }
  ]);
};

const mockCharacterAnalysis = async (): Promise<Character[]> => {
    await new Promise(r => setTimeout(r, 1000));
    return [
        {
            id: 'char-1',
            name: 'Jane',
            role: 'Protagonist',
            description: 'A dedicated but exhausted architect in her early 30s. Driven, slightly messy, intelligent.',
            visualPrompt: 'Portrait of a woman in her 30s, messy bun, glasses, wearing a structured oversized blazer. Soft natural lighting, cinematic depth of field, high detail.',
            status: 'pending'
        },
        {
            id: 'char-2',
            name: 'The Barista',
            role: 'Supporting',
            description: 'Friendly, hipster vibe, tattoos, calm amidst the chaos.',
            visualPrompt: 'Medium shot of a young man with a beard, beanie, wearing a green apron over a white t-shirt. Steam from espresso machine in background. Warm lighting.',
            status: 'pending'
        }
    ];
};
