
import React, { useEffect, useState } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { Play, Loader2, Film, Mic, Upload, Volume2, Wand2, Layers, Trash2, Video, Camera, Aperture, Clock, Type, RefreshCw, Sparkles } from 'lucide-react';
import { Shot } from '../../types';

const VideoPlayer: React.FC = () => {
  const { state, dispatch, generateShot, generateVoiceOver, refineShot, generateBRoll } = useProject();
  const { selectedShotId, project } = state;
  
  // Find the selected shot and its parent context
  let selectedShot: Shot | null = null;
  let parentScene = null;
  let parentSubScene = null;

  if (selectedShotId) {
    for (const scene of project.scenes) {
      for (const sub of scene.subScenes) {
        const shot = sub.shots.find(s => s.id === selectedShotId);
        if (shot) {
          selectedShot = shot;
          parentScene = scene;
          parentSubScene = sub;
          break;
        }
      }
      if (selectedShot) break;
    }
  }

  const [currentSrc, setCurrentSrc] = useState<string | undefined>(undefined);
  const [isGeneratingVo, setIsGeneratingVo] = useState(false);

  useEffect(() => {
    if (selectedShot?.videoUrl) {
      setCurrentSrc(selectedShot.videoUrl);
    } else if (selectedShot?.imageUrl) {
        setCurrentSrc(selectedShot.imageUrl);
    } else {
      setCurrentSrc(undefined);
    }
  }, [selectedShot]);

  const handleUpdateShot = (updates: Partial<Shot>) => {
    if (selectedShot) {
      dispatch({ 
        type: 'UPDATE_SHOT', 
        payload: { shotId: selectedShot.id, updates } 
      });
    }
  };

  const handleGenerateVO = async () => {
      if (!selectedShot || !selectedShot.voiceOverScript) return;
      setIsGeneratingVo(true);
      await generateVoiceOver(selectedShot.id, selectedShot.voiceOverScript);
      setIsGeneratingVo(false);
  };

  const handleUploadVO = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedShot) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              handleUpdateShot({ voiceOverUrl: event.target.result as string });
            }
          };
          reader.readAsDataURL(file);
      }
      e.target.value = '';
  };

  const handleUploadBRoll = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedShot) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              handleUpdateShot({ bRollUrl: event.target.result as string });
            }
          };
          reader.readAsDataURL(file);
      }
      e.target.value = '';
  };

  const isVideo = (url: string) => {
      return url.startsWith('data:video') || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov');
  };

  if (!selectedShot) {
     return (
        <div className="flex flex-col h-full bg-black relative">
            <div className="flex-1 flex items-center justify-center bg-black/50 text-muted text-sm">
                <div className="text-center">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Play className="w-6 h-6 ml-1 text-gray-700" />
                    </div>
                    <p>Select a shot to preview</p>
                </div>
            </div>
            <div className="h-1/3 bg-surface border-t border-border p-6 flex items-center justify-center text-muted text-sm">
                Select a shot to view details
            </div>
        </div>
     )
  }

  return (
    <div className="flex flex-col h-full bg-black relative">
      <div className="flex-1 flex items-center justify-center bg-black/50 p-6 relative">
        <div className="aspect-video w-full max-w-4xl bg-gray-900 rounded-lg shadow-2xl overflow-hidden relative border border-white/10 group">
          
          {/* Main Content Layer */}
          {currentSrc ? (
            isVideo(currentSrc) ? (
                <video 
                    src={currentSrc} 
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
            ) : (
                <img 
                src={currentSrc} 
                alt="Preview" 
                className="w-full h-full object-cover"
                />
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
               {selectedShot.status === 'generating' ? (
                 <>
                    <Loader2 className="w-10 h-10 animate-spin text-accent mb-2" />
                    <p className="text-sm font-mono">Generating Video...</p>
                 </>
               ) : (
                 <>
                    <Play className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-sm font-mono">No preview available</p>
                 </>
               )}
            </div>
          )}

          {/* B-Roll / Overlay Layer */}
          {selectedShot.bRollUrl && (
             <div className="absolute inset-0 z-10 pointer-events-none opacity-60 mix-blend-overlay">
                {isVideo(selectedShot.bRollUrl) ? (
                     <video 
                        src={selectedShot.bRollUrl} 
                        className="w-full h-full object-cover" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                    />
                ) : (
                    <img src={selectedShot.bRollUrl} className="w-full h-full object-cover" alt="B-Roll Overlay" />
                )}
                <div className="absolute top-2 right-2 bg-purple-600/80 px-2 py-0.5 rounded text-[10px] text-white backdrop-blur-md">
                   B-Roll Active
                </div>
             </div>
          )}

          {/* Overlay Stats */}
          <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded text-xs font-mono text-gray-300 pointer-events-none backdrop-blur-sm z-20">
             <span className="text-accent">{selectedShot.duration}s</span> • {state.project.settings.resolution} @ {state.project.settings.frameRate}fps
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <div className="h-1/3 bg-surface border-t border-border p-6 overflow-y-auto">
           <div className="max-w-[1400px] mx-auto space-y-6">
             <div className="flex justify-between items-start">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                      <Film className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-none mb-1">Shot {selectedShot.id.split('-').pop()}</h3>
                    <p className="text-xs text-muted font-mono uppercase flex items-center gap-2">
                        {parentScene?.title} <span className="text-gray-600">•</span> {parentSubScene?.title}
                    </p>
                  </div>
               </div>
               
               <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                    selectedShot.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                    selectedShot.status === 'generating' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    selectedShot.status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>
                    {selectedShot.status}
                  </span>
                  <button 
                    onClick={() => generateShot(selectedShot!.id)}
                    disabled={selectedShot.status === 'generating'}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition disabled:opacity-50"
                    title="Regenerate Shot"
                  >
                    <RefreshCw className={`w-4 h-4 ${selectedShot.status === 'generating' ? 'animate-spin' : ''}`} />
                  </button>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Column 1: Visual Prompt */}
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Type className="w-3 h-3" /> Visual Prompt
                     </label>
                     <button
                        onClick={() => refineShot(selectedShot!.id)}
                        disabled={selectedShot.isRefining}
                        className="text-[10px] bg-accent/10 hover:bg-accent hover:text-white text-accent px-2 py-1 rounded transition flex items-center gap-1.5 disabled:opacity-50 font-medium"
                        title="Refine using AI based on mood and camera settings"
                     >
                        {selectedShot.isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        {selectedShot.isRefining ? 'Refining...' : 'Refine'}
                     </button>
                   </div>
                   <textarea 
                     className="w-full bg-black/20 border border-border rounded-lg p-3 text-sm text-gray-300 h-32 resize-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition placeholder:text-gray-600"
                     value={selectedShot.visualPrompt}
                     onChange={(e) => handleUpdateShot({ visualPrompt: e.target.value })}
                     placeholder="e.g. Wide shot, static, establishing the scene mood..."
                   />
                </div>

                 {/* Column 2: Camera & Settings */}
                <div className="space-y-4">
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                         <Camera className="w-3 h-3" /> Camera & Movement
                      </label>
                      <div className="space-y-2 mb-3">
                         <div className="space-y-1">
                             <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Angle</span>
                             <select 
                                className="w-full bg-black/20 border border-border rounded px-2 py-2 text-xs text-white focus:outline-none focus:border-accent"
                                value={selectedShot.cameraAngle}
                                onChange={(e) => handleUpdateShot({ cameraAngle: e.target.value as any })}
                             >
                                <option value="wide">Wide Shot</option>
                                <option value="medium">Medium Shot</option>
                                <option value="close-up">Close Up</option>
                                <option value="extreme-close-up">Extreme Close Up</option>
                                <option value="overhead">Overhead</option>
                             </select>
                         </div>
                         <div className="space-y-1">
                             <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Movement</span>
                             <select 
                                className="w-full bg-black/20 border border-border rounded px-2 py-2 text-xs text-white focus:outline-none focus:border-accent"
                                value={selectedShot.cameraMovement}
                                onChange={(e) => handleUpdateShot({ cameraMovement: e.target.value as any })}
                             >
                                <option value="static">Static</option>
                                <option value="pan">Pan</option>
                                <option value="tilt">Tilt</option>
                                <option value="zoom">Zoom</option>
                                <option value="dolly">Dolly</option>
                                <option value="tracking">Tracking</option>
                             </select>
                         </div>
                      </div>
                      
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                         <Aperture className="w-3 h-3" /> Tech Specs
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                         <input 
                            type="text" 
                            placeholder="35mm"
                            className="w-full bg-black/20 border border-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                            value={selectedShot.focalLength || ''}
                            onChange={(e) => handleUpdateShot({ focalLength: e.target.value })}
                         />
                         <input 
                            type="text" 
                            placeholder="f/2.8"
                            className="w-full bg-black/20 border border-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                            value={selectedShot.aperture || ''}
                            onChange={(e) => handleUpdateShot({ aperture: e.target.value })}
                         />
                      </div>
                   </div>
                   
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-1">
                         <Clock className="w-3 h-3" /> Duration: <span className="text-white">{selectedShot.duration}s</span>
                      </label>
                      <input 
                         type="range" 
                         min="1" 
                         max="10" 
                         step="0.5"
                         className="w-full accent-accent h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                         value={selectedShot.duration}
                         onChange={(e) => handleUpdateShot({ duration: parseFloat(e.target.value) })}
                      />
                   </div>
                </div>

                 {/* Column 3: Audio & VO */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <Mic className="w-3 h-3" /> Audio & Voice Over
                    </label>
                    
                    {selectedShot.voiceOverUrl ? (
                         <div className="bg-black/20 border border-border rounded-lg p-3 space-y-2">
                             <div className="flex items-center gap-2 mb-2">
                                <Volume2 className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-white font-medium">Voice Over Ready</span>
                             </div>
                             <audio controls src={selectedShot.voiceOverUrl} className="w-full h-8" />
                             <div className="flex gap-2 mt-2">
                                <label className="flex-1 text-[10px] bg-white/5 hover:bg-white/10 text-gray-300 py-1.5 rounded flex items-center justify-center gap-2 cursor-pointer border border-white/5 transition hover:border-white/20">
                                    <Upload className="w-3 h-3" />
                                    Replace
                                    <input type="file" className="hidden" accept="audio/*" onChange={handleUploadVO} />
                                </label>
                                <button 
                                    onClick={() => handleUpdateShot({ voiceOverUrl: undefined })}
                                    className="flex-1 text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 py-1.5 rounded transition"
                                >
                                    Remove
                                </button>
                             </div>
                         </div>
                    ) : (
                        <div className="space-y-2">
                            <textarea 
                                className="w-full bg-black/20 border border-border rounded-lg p-3 text-sm text-gray-300 h-20 resize-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition placeholder:text-gray-600"
                                placeholder="Enter text for voice over generation..."
                                value={selectedShot.voiceOverScript || ''}
                                onChange={(e) => handleUpdateShot({ voiceOverScript: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleGenerateVO}
                                    disabled={!selectedShot.voiceOverScript || isGeneratingVo}
                                    className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition"
                                >
                                    {isGeneratingVo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mic className="w-3 h-3" />}
                                    Generate
                                </button>
                                <label className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold py-2 rounded flex items-center justify-center gap-2 cursor-pointer transition border border-white/5">
                                    <Upload className="w-3 h-3" />
                                    Upload
                                    <input type="file" className="hidden" accept="audio/*" onChange={handleUploadVO} />
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 4: Video Layers (B-Roll) */}
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-3 h-3" /> B-Roll / Overlay
                     </label>
                     <button
                        onClick={() => generateBRoll(selectedShot!.id)}
                        disabled={selectedShot.isGeneratingBRoll || !!selectedShot.bRollUrl}
                        className="text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-1 rounded transition flex items-center gap-1.5 disabled:opacity-50 font-medium"
                        title="AI Generate B-Roll based on visual prompt and style"
                     >
                        {selectedShot.isGeneratingBRoll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Generate B-Roll
                     </button>
                   </div>
                   
                   {selectedShot.bRollUrl ? (
                        <div className="bg-black/20 border border-border rounded-lg p-3 flex gap-3 items-center">
                            {/* Thumbnail */}
                            <div className="w-24 h-14 bg-black rounded overflow-hidden flex-shrink-0 relative border border-white/10">
                                {isVideo(selectedShot.bRollUrl) ? (
                                    <video 
                                        src={selectedShot.bRollUrl} 
                                        className="w-full h-full object-cover" 
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline
                                    />
                                ) : (
                                    <img src={selectedShot.bRollUrl} className="w-full h-full object-cover" alt="B-Roll" />
                                )}
                            </div>

                            {/* Info & Actions */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between h-14 py-0.5">
                                <div className="flex items-center gap-2">
                                     <Layers className="w-3.5 h-3.5 text-purple-400" />
                                     <span className="text-xs text-gray-200 font-medium truncate">B-Roll Overlay</span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                     <label className="cursor-pointer text-[10px] text-accent hover:text-accent-hover font-bold uppercase tracking-wide transition">
                                        Replace
                                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleUploadBRoll} />
                                     </label>
                                     <button 
                                        onClick={() => handleUpdateShot({ bRollUrl: undefined })}
                                        className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 transition"
                                     >
                                        <Trash2 className="w-3 h-3" />
                                        Remove
                                     </button>
                                </div>
                            </div>
                        </div>
                   ) : (
                       <div className="h-32 border-2 border-dashed border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group cursor-pointer relative">
                           {selectedShot.isGeneratingBRoll ? (
                               <div className="flex flex-col items-center gap-2">
                                   <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                                   <p className="text-xs text-purple-300">Creating B-Roll...</p>
                               </div>
                           ) : (
                               <>
                                <input 
                                    type="file" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                    accept="image/*,video/*"
                                    onChange={handleUploadBRoll} 
                                />
                                <Layers className="w-8 h-8 text-gray-600 group-hover:text-purple-400 mb-2 transition-colors" />
                                <p className="text-xs text-gray-400 group-hover:text-gray-200 mb-3">
                                    Drag & drop or <span className="text-purple-400 font-medium">browse</span>
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering file input
                                        generateBRoll(selectedShot!.id);
                                    }}
                                    className="relative z-20 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-1.5 rounded-full text-[10px] font-medium transition flex items-center gap-1.5 border border-purple-500/20"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    Auto-Generate B-Roll
                                </button>
                               </>
                           )}
                       </div>
                   )}
                </div>

             </div>
           </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
