
import React, { useState, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, Volume2, Mic, Video, Plus, Scissors, Layers, GripVertical, Monitor } from 'lucide-react';

const Timeline: React.FC = () => {
  const { state, dispatch } = useProject();
  const { scenes } = state.project;
  const [zoomLevel, setZoomLevel] = useState(20); // pixels per second
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Flatten shots for timeline using useMemo to avoid recalc on every render unless project changes
  const allShots = useMemo(() => scenes.flatMap(s => s.subScenes.flatMap(sub => sub.shots)), [scenes]);
  
  // Local state for resizing operation
  const [resizingShot, setResizingShot] = useState<{ id: string, startX: number, startDuration: number, currentDuration: number } | null>(null);

  // Helper to get effective duration (visual or actual)
  const getShotDuration = (shotId: string, actualDuration: number) => {
    if (resizingShot && resizingShot.id === shotId) {
      return resizingShot.currentDuration;
    }
    return actualDuration;
  };

  const totalDuration = allShots.reduce((acc, shot) => acc + getShotDuration(shot.id, shot.duration), 0) || 60;

  const togglePlay = () => {
    dispatch({ type: 'SET_PLAYING', payload: !state.isPlaying });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(300, prev * 1.25));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(5, prev * 0.8));
  };

  const handleSliderZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomLevel(Number(e.target.value));
  };

  // Resize Event Listeners
  useEffect(() => {
    if (resizingShot) {
        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizingShot.startX;
            const deltaSeconds = deltaX / zoomLevel;
            // Min duration 0.5s
            const newDuration = Math.max(0.5, resizingShot.startDuration + deltaSeconds);
            setResizingShot(prev => prev ? { ...prev, currentDuration: newDuration } : null);
        };

        const handleMouseUp = () => {
             // Commit the new duration
             dispatch({ 
                 type: 'UPDATE_SHOT', 
                 payload: { 
                     shotId: resizingShot.id, 
                     updates: { duration: Number(resizingShot.currentDuration.toFixed(1)) } 
                 } 
             });
             setResizingShot(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }
  }, [resizingShot, zoomLevel, dispatch]);

  // Wheel Zoom & Scroll Logic
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoomLevel(prev => {
          const sensitivity = 0.002;
          const delta = -e.deltaY;
          const factor = Math.exp(delta * sensitivity);
          return Math.min(300, Math.max(5, prev * factor));
        });
      } else {
        if (!e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
             e.preventDefault();
             container.scrollLeft += e.deltaY;
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Auto-scroll logic
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    let focusTime = state.currentTime;
    if (state.selectedShotId) {
      let startTime = 0;
      let found = false;
      for (const shot of allShots) {
        const duration = getShotDuration(shot.id, shot.duration);
        if (shot.id === state.selectedShotId) {
          focusTime = startTime + (duration / 2);
          found = true;
          break;
        }
        startTime += duration;
      }
      if (!found) focusTime = state.currentTime;
    }

    const targetScroll = (focusTime * zoomLevel) - (container.clientWidth / 2);
    // Only auto-scroll if we are significantly off? For now just center on zoom.
    // We don't want to lock scroll on every render, only when zoom changes drastically or selection changes
  }, [zoomLevel]); // Reduced dependency to avoid jumping while resizing

  const tickInterval = zoomLevel < 10 ? 30 : zoomLevel < 40 ? 10 : zoomLevel < 100 ? 5 : 1;
  const ticks = Array.from({ length: Math.ceil(totalDuration / tickInterval) + 2 });

  return (
    <div className="h-72 bg-background border-t border-border flex flex-col select-none">
      {/* Timeline Controls */}
      <div className="h-10 border-b border-border bg-surface px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-white transition"><SkipBack className="w-4 h-4" /></button>
          <button onClick={togglePlay} className="text-white hover:text-accent transition">
            {state.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
          <button className="text-gray-400 hover:text-white transition"><SkipForward className="w-4 h-4" /></button>
          <div className="text-xs font-mono text-accent ml-4">
            {new Date(state.currentTime * 1000).toISOString().substr(14, 5)} / {new Date(totalDuration * 1000).toISOString().substr(14, 5)}
          </div>
        </div>

        <div className="flex items-center gap-3">
           <Volume2 className="w-4 h-4 text-gray-400" />
           <div className="h-1 w-20 bg-gray-700 rounded-full overflow-hidden mr-2">
             <div className="h-full w-2/3 bg-accent"></div>
           </div>
           
           <div className="w-px h-4 bg-gray-700 mx-2"></div>
           
           <div className="flex items-center gap-2">
             <button onClick={handleZoomOut} className="text-gray-400 hover:text-white transition" title="Zoom Out">
               <ZoomOut className="w-4 h-4" />
             </button>
             <input 
               type="range" 
               min="5" 
               max="300" 
               step="1"
               value={zoomLevel} 
               onChange={handleSliderZoom}
               className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
               title="Zoom Level (Ctrl+Scroll)"
             />
             <button onClick={handleZoomIn} className="text-gray-400 hover:text-white transition" title="Zoom In">
               <ZoomIn className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar"
      >
        <div style={{ width: `${Math.max(containerRef.current?.clientWidth || 0, totalDuration * zoomLevel + 100)}px` }} className="min-w-full pb-4">
            
            {/* Time Ruler */}
            <div className="h-6 bg-surface border-b border-white/5 flex items-end text-[10px] text-gray-500 font-mono select-none sticky top-0 z-20 bg-surface/95 backdrop-blur pl-2">
              {ticks.map((_, i) => (
                <div 
                  key={i} 
                  className="border-l border-white/10 pl-1 h-3 box-border flex-shrink-0" 
                  style={{ width: `${tickInterval * zoomLevel}px` }}
                >
                  {new Date(i * tickInterval * 1000).toISOString().substr(14, 5)}
                </div>
              ))}
            </div>

            {/* Tracks Container */}
            <div className="p-2 space-y-2 relative">
              
              {/* Storyboard / Scene Track (Reorderable) */}
              <div className="flex h-16 bg-black/20 rounded relative">
                {allShots.map((shot, idx) => {
                  const displayDuration = getShotDuration(shot.id, shot.duration);
                  const isResizing = resizingShot?.id === shot.id;
                  
                  return (
                    <div 
                      key={shot.id}
                      draggable={!isResizing}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('shotId', shot.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault(); // Necessary to allow dropping
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceId = e.dataTransfer.getData('shotId');
                        if (sourceId && sourceId !== shot.id) {
                            dispatch({ type: 'MOVE_SHOT', payload: { sourceShotId: sourceId, targetShotId: shot.id } });
                        }
                      }}
                      className={`
                          relative h-full border-r border-black/50 group cursor-pointer overflow-visible transition-colors
                          ${shot.status === 'completed' ? 'bg-indigo-900/30' : 'bg-gray-800/30'}
                          ${state.selectedShotId === shot.id ? 'ring-2 ring-accent z-10 bg-indigo-900/50' : 'hover:bg-gray-700/40'}
                      `}
                      style={{ 
                          width: `${displayDuration * zoomLevel}px`,
                          minWidth: '20px' 
                      }} 
                      onClick={() => dispatch({ type: 'SELECT_SHOT', payload: shot.id })}
                    >
                      {/* Drag Handle (Visual indicator) */}
                      {zoomLevel > 30 && (
                          <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing text-white z-20">
                              <GripVertical className="w-3 h-3" />
                          </div>
                      )}

                      {/* Content */}
                      {shot.imageUrl && zoomLevel > 10 ? (
                        <img src={shot.imageUrl} className="h-full w-full object-cover opacity-60 pointer-events-none" alt="" />
                      ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-600 font-mono pointer-events-none">
                            {zoomLevel > 30 ? `Shot ${idx + 1}` : ''}
                          </div>
                      )}
                      
                      {zoomLevel > 15 && (
                        <div className="absolute bottom-1 left-1 text-[10px] font-bold text-white drop-shadow-md truncate max-w-full px-1 pointer-events-none">
                            {displayDuration.toFixed(1)}s
                        </div>
                      )}

                      {/* Resize Handle */}
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-accent/50 z-30 transition-colors"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // Prevent drag start
                            setResizingShot({ 
                                id: shot.id, 
                                startX: e.clientX, 
                                startDuration: shot.duration, 
                                currentDuration: shot.duration 
                            });
                        }}
                      />
                    </div>
                  );
                })}
              </div>

               {/* Video Clip Track (Visual Sync) */}
               <div className="flex h-12 bg-black/40 rounded-lg relative mt-1 items-center overflow-hidden border border-white/5">
                {allShots.map((shot, idx) => {
                    const displayDuration = getShotDuration(shot.id, shot.duration);
                    return (
                        <div
                            key={`vid-${shot.id}`}
                            className={`
                                h-full border-r border-white/10 relative flex items-center cursor-pointer group overflow-hidden
                                ${shot.videoUrl ? 'bg-blue-900/10' : 'bg-transparent hover:bg-white/5'}
                            `}
                            style={{ width: `${displayDuration * zoomLevel}px` }}
                            onClick={() => dispatch({ type: 'SELECT_SHOT', payload: shot.id })}
                        >
                             {shot.videoUrl ? (
                                 <>
                                    {zoomLevel > 15 && shot.imageUrl && (
                                       <div className="absolute inset-0 flex opacity-40 grayscale group-hover:grayscale-0 transition-all duration-300">
                                           {Array.from({ length: Math.min(20, Math.ceil((displayDuration * zoomLevel) / 64)) }).map((_, i) => (
                                               <img 
                                                key={i} 
                                                src={shot.imageUrl} 
                                                className="h-full w-auto aspect-video object-cover border-r border-white/10" 
                                                alt=""
                                                draggable={false}
                                               />
                                           ))}
                                       </div>
                                    )}
                                    <div className={`absolute inset-0 border-y-2 border-blue-500/30 group-hover:border-blue-400/60 transition-colors flex items-center justify-center
                                        ${state.selectedShotId === shot.id ? 'bg-blue-600/10 border-blue-400' : ''}
                                    `}>
                                        <div className="z-10 flex items-center gap-1.5 drop-shadow-md bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                                            {zoomLevel > 20 && <Video className="w-3 h-3 text-blue-200" />}
                                            {zoomLevel > 50 && (
                                                <span className="text-[10px] text-blue-100 font-bold font-mono tracking-tight shadow-black">
                                                    CLIP {idx + 1}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                 </>
                             ) : (
                                 <div className={`absolute inset-1 m-1 rounded border border-dashed border-gray-700 flex items-center justify-center transition-opacity
                                    ${state.selectedShotId === shot.id ? 'opacity-100 border-gray-500' : 'opacity-0 group-hover:opacity-100'}
                                 `}>
                                     {zoomLevel > 30 && <span className="text-[9px] text-gray-600 font-mono flex items-center gap-1"><Video className="w-3 h-3"/> Empty</span>}
                                 </div>
                             )}
                        </div>
                    );
                })}
                <div className="absolute left-0 top-0 bottom-0 pointer-events-none flex items-center px-2 z-20">
                     <span className="text-[9px] text-blue-300/50 font-bold uppercase tracking-widest bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded border border-blue-500/10 shadow-sm">
                        Video
                     </span>
                </div>
              </div>

               {/* B-Roll Track */}
               <div className="flex h-10 bg-black/30 rounded relative mt-1 items-center overflow-hidden border border-white/5">
                {allShots.map((shot, idx) => (
                    <div
                        key={`broll-${shot.id}`}
                        className={`h-full border-r border-white/5 relative flex items-center justify-center cursor-pointer group ${shot.bRollUrl ? 'bg-purple-900/20' : 'bg-transparent hover:bg-white/5'}`}
                        style={{ width: `${getShotDuration(shot.id, shot.duration) * zoomLevel}px` }}
                        onClick={() => dispatch({ type: 'SELECT_SHOT', payload: shot.id })}
                    >
                         {shot.bRollUrl ? (
                             <div className="absolute inset-1 rounded bg-purple-600/40 border border-purple-500/50 flex items-center overflow-hidden group-hover:border-purple-400/60 transition-colors">
                                  {zoomLevel > 30 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-400"></div>}
                                  <div className="flex items-center px-2 w-full gap-2 relative z-10">
                                     <Layers className="w-3 h-3 text-purple-200 flex-shrink-0" />
                                     {zoomLevel > 50 && <span className="text-[9px] text-purple-100 font-medium truncate">Overlay</span>}
                                  </div>
                             </div>
                         ) : (
                             zoomLevel > 40 && (
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[9px] text-gray-600 group-hover:text-gray-400 transition-colors border border-dashed border-gray-700 rounded px-1.5 py-0.5">
                                    <Plus className="w-2.5 h-2.5" /> B-Roll
                                </div>
                             )
                         )}
                    </div>
                ))}
                <div className="absolute left-0 top-0 bottom-0 pointer-events-none flex items-center px-2 z-10">
                     <span className="text-[9px] text-purple-400/50 font-bold uppercase tracking-widest bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded border border-purple-500/10 shadow-sm">
                        B-Roll
                     </span>
                </div>
              </div>

               {/* Insert / PIP Video Track */}
               <div className="flex h-10 bg-black/30 rounded relative mt-1 items-center overflow-hidden border border-white/5">
                {allShots.map((shot, idx) => (
                    <div
                        key={`pip-${shot.id}`}
                        className={`h-full border-r border-white/5 relative flex items-center justify-center cursor-pointer group ${shot.pipUrl ? 'bg-cyan-900/20' : 'bg-transparent hover:bg-white/5'}`}
                        style={{ width: `${getShotDuration(shot.id, shot.duration) * zoomLevel}px` }}
                        onClick={() => dispatch({ type: 'SELECT_SHOT', payload: shot.id })}
                    >
                         {shot.pipUrl ? (
                             <div className="absolute inset-1 rounded bg-cyan-600/40 border border-cyan-500/50 flex items-center overflow-hidden group-hover:border-cyan-400/60 transition-colors">
                                  {zoomLevel > 30 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400"></div>}
                                  <div className="flex items-center px-2 w-full gap-2 relative z-10">
                                     <Monitor className="w-3 h-3 text-cyan-200 flex-shrink-0" />
                                     {zoomLevel > 50 && <span className="text-[9px] text-cyan-100 font-medium truncate">PIP / Insert</span>}
                                  </div>
                             </div>
                         ) : (
                             zoomLevel > 40 && (
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[9px] text-gray-600 group-hover:text-gray-400 transition-colors border border-dashed border-gray-700 rounded px-1.5 py-0.5">
                                    <Plus className="w-2.5 h-2.5" /> Insert
                                </div>
                             )
                         )}
                    </div>
                ))}
                <div className="absolute left-0 top-0 bottom-0 pointer-events-none flex items-center px-2 z-10">
                     <span className="text-[9px] text-cyan-400/50 font-bold uppercase tracking-widest bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded border border-cyan-500/10 shadow-sm">
                        Insert
                     </span>
                </div>
              </div>

               {/* Voice Over Track */}
               <div className="flex h-8 bg-black/20 rounded relative mt-1 items-center overflow-hidden">
                {allShots.map((shot, idx) => (
                    <div
                        key={`vo-${shot.id}`}
                        className={`h-full border-r border-white/5 relative flex items-center justify-center cursor-pointer group ${shot.voiceOverUrl ? 'bg-amber-900/40' : 'bg-transparent hover:bg-white/5'}`}
                        style={{ width: `${getShotDuration(shot.id, shot.duration) * zoomLevel}px` }}
                        onClick={() => dispatch({ type: 'SELECT_SHOT', payload: shot.id })}
                    >
                         {shot.voiceOverUrl ? (
                             <div className="absolute inset-1 rounded bg-amber-600/50 border border-amber-600/30 flex items-center px-2 overflow-hidden group-hover:border-amber-400/50 transition-colors">
                                  <Mic className="w-3 h-3 text-amber-200 mr-1 flex-shrink-0" />
                             </div>
                         ) : (
                             zoomLevel > 25 && (
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[9px] text-gray-500 group-hover:text-gray-300 transition-colors">
                                    <Plus className="w-3 h-3" />
                                </div>
                             )
                         )}
                    </div>
                ))}
                <div className="absolute left-0 top-0 bottom-0 pointer-events-none flex items-center px-2 z-10">
                     <span className="text-[10px] text-amber-400/30 font-mono font-bold uppercase tracking-widest bg-black/20 backdrop-blur-[1px] rounded px-1">Voice Over</span>
                </div>
              </div>

              {/* Audio Track Placeholder (Music) */}
              <div className="flex h-8 bg-black/20 rounded relative mt-1 items-center overflow-hidden">
                <div className="absolute left-0 top-0 h-full bg-green-900/40 border-r border-green-800/50 w-full flex items-center px-2">
                    <span className="text-[10px] text-green-400 font-mono truncate">Audio Track 1 (Music)</span>
                </div>
              </div>
              
            </div>

            {/* Playhead */}
            <div 
              className="absolute top-6 bottom-0 w-px bg-red-500 z-20 pointer-events-none transition-all duration-75"
              style={{ left: `${(state.currentTime * zoomLevel) + 8}px` }}
            >
              <div className="w-3 h-3 bg-red-500 -ml-1.5 transform rotate-45 -mt-1.5 shadow-sm shadow-red-900"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
