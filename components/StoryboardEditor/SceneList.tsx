
import React, { useState } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { Clapperboard, Video, MoreVertical, RefreshCw, Play, Image as ImageIcon, Sparkles, Filter, AlertCircle, CheckCircle, Clock, Loader2, Camera, Move, X, ChevronDown } from 'lucide-react';
import { Shot, ShotStatus, CameraAngle, CameraMovement } from '../../types';

const ShotCard: React.FC<{ shot: Shot; onClick: () => void; isSelected: boolean }> = ({ shot, onClick, isSelected }) => {
  const { generateShot, dispatch } = useProject();

  const handleGenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    generateShot(shot.id);
  };

  const handleAngleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    dispatch({ 
        type: 'UPDATE_SHOT', 
        payload: { shotId: shot.id, updates: { cameraAngle: e.target.value as CameraAngle } } 
    });
  };

  return (
    <div 
      onClick={onClick}
      className={`relative group bg-background rounded-lg border transition-all cursor-pointer overflow-hidden h-full flex flex-col
        ${isSelected ? 'border-accent ring-1 ring-accent' : 'border-border hover:border-gray-600'}
      `}
    >
      <div className="aspect-video w-full bg-black/40 flex items-center justify-center relative flex-shrink-0">
        {shot.imageUrl ? (
          <img src={shot.imageUrl} alt="Shot preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-4">
             <Video className="w-8 h-8 text-gray-700 mx-auto mb-2" />
             <span className="text-xs text-gray-500">No generation</span>
          </div>
        )}
        
        {shot.status === 'generating' && (
           <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
             <RefreshCw className="w-6 h-6 text-accent animate-spin" />
           </div>
        )}

        {/* Hover quick action - keeping as secondary option */}
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
             onClick={handleGenerate}
             className="bg-surface/90 p-1.5 rounded-md hover:bg-accent hover:text-white text-gray-300"
             title="Generate Video"
            >
             <RefreshCw className="w-3 h-3" />
           </button>
        </div>
        
        <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-300">
          {shot.duration}s
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
            {shot.cameraAngle} • {shot.cameraMovement}
          </span>
          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded
            ${shot.status === 'completed' ? 'text-green-400 bg-green-400/10' : 
              shot.status === 'generating' ? 'text-blue-400 bg-blue-400/10' :
              shot.status === 'error' ? 'text-red-400 bg-red-400/10' : 'text-gray-500 bg-gray-500/10'}
          `}>
            {shot.status}
          </span>
        </div>
        <p className="text-xs text-gray-300 line-clamp-2 leading-snug mb-2">
          {shot.visualPrompt}
        </p>

        {isSelected && (
           <div className="mt-auto pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2">
                 <Camera className="w-3 h-3 text-accent" />
                 <div className="relative flex-1">
                    <select 
                        value={shot.cameraAngle}
                        onClick={(e) => e.stopPropagation()} 
                        onChange={handleAngleChange}
                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 pr-6 text-[10px] text-white focus:outline-none focus:border-accent appearance-none cursor-pointer hover:border-white/20 transition-colors"
                    >
                        <option value="wide">Wide Shot</option>
                        <option value="medium">Medium Shot</option>
                        <option value="close-up">Close Up</option>
                        <option value="extreme-close-up">Ext. Close Up</option>
                        <option value="overhead">Overhead</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1.5 w-3 h-3 text-gray-500 pointer-events-none" />
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

const SceneList: React.FC = () => {
  const { state, dispatch, generateShot } = useProject();
  const [filterStatus, setFilterStatus] = useState<ShotStatus | 'all'>('all');
  
  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filterAngle, setFilterAngle] = useState<CameraAngle | 'all'>('all');
  const [filterMovement, setFilterMovement] = useState<CameraMovement | 'all'>('all');
  const [minDuration, setMinDuration] = useState(0);

  const handleGenerateAll = () => {
    state.project.scenes.forEach(scene => {
      scene.subScenes.forEach(sub => {
        sub.shots.forEach(shot => {
          if (shot.status === 'pending' || shot.status === 'error') {
            generateShot(shot.id);
          }
        });
      });
    });
  };

  const handleClearFilters = () => {
      setFilterStatus('all');
      setFilterAngle('all');
      setFilterMovement('all');
      setMinDuration(0);
  };

  const allShots = state.project.scenes.flatMap(s => s.subScenes.flatMap(sub => sub.shots));
  
  // Apply advanced filters first to calculate relevant counts
  const matchesAdvancedFilters = (shot: Shot) => {
    if (filterAngle !== 'all' && shot.cameraAngle !== filterAngle) return false;
    if (filterMovement !== 'all' && shot.cameraMovement !== filterMovement) return false;
    if (shot.duration < minDuration) return false;
    return true;
  };

  const relevantShots = allShots.filter(matchesAdvancedFilters);

  const counts = {
    all: relevantShots.length,
    pending: relevantShots.filter(s => s.status === 'pending').length,
    generating: relevantShots.filter(s => s.status === 'generating').length,
    completed: relevantShots.filter(s => s.status === 'completed').length,
    error: relevantShots.filter(s => s.status === 'error').length,
  };

  const filteredScenes = state.project.scenes.map(scene => ({
    ...scene,
    subScenes: scene.subScenes.map(sub => ({
      ...sub,
      shots: sub.shots.filter(shot => {
         const statusMatch = filterStatus === 'all' || shot.status === filterStatus;
         return statusMatch && matchesAdvancedFilters(shot);
      })
    })).filter(sub => sub.shots.length > 0)
  })).filter(scene => scene.subScenes.length > 0);

  const filters: { id: ShotStatus | 'all', label: string, icon: React.ReactNode, count: number }[] = [
    { id: 'all', label: 'All', icon: <Clapperboard className="w-3 h-3" />, count: counts.all },
    { id: 'pending', label: 'Pending', icon: <Clock className="w-3 h-3" />, count: counts.pending },
    { id: 'generating', label: 'Processing', icon: <Loader2 className="w-3 h-3 animate-spin" />, count: counts.generating },
    { id: 'completed', label: 'Done', icon: <CheckCircle className="w-3 h-3" />, count: counts.completed },
    { id: 'error', label: 'Error', icon: <AlertCircle className="w-3 h-3" />, count: counts.error },
  ];

  const hasActiveFilters = filterStatus !== 'all' || filterAngle !== 'all' || filterMovement !== 'all' || minDuration > 0;

  return (
    <div className="h-full bg-surface border-r border-border overflow-y-auto flex flex-col">
      <div className="border-b border-border sticky top-0 bg-surface/95 backdrop-blur z-10">
        <div className="p-4 flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-text flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-accent" />
              Storyboard
            </h2>
            <p className="text-xs text-muted mt-1">{counts.all} Shots {hasActiveFilters && '(Filtered)'}</p>
          </div>

          <div className="flex items-center gap-2">
            {(counts.pending > 0 || counts.error > 0) && (
                <button 
                onClick={handleGenerateAll}
                className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-lg"
                title="Generate all pending shots"
                >
                <Sparkles className="w-3.5 h-3.5" />
                Generate All
                </button>
            )}
            <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition border ${showFilters ? 'bg-accent/10 border-accent text-accent' : 'border-transparent hover:bg-white/5 text-gray-400'}`}
                title="Toggle Filters"
            >
                <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden scroll-smooth">
          {filters.map(filter => (
             <button
               key={filter.id}
               onClick={() => setFilterStatus(filter.id)}
               className={`
                 flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition whitespace-nowrap flex-shrink-0
                 ${filterStatus === filter.id 
                   ? 'bg-white text-black border-white' 
                   : 'bg-transparent text-muted border-border hover:border-gray-500 hover:text-white'}
               `}
             >
               {filter.icon}
               {filter.label}
               <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${
                 filterStatus === filter.id ? 'bg-black/10 text-black' : 'bg-white/10 text-gray-300'
               }`}>
                 {filter.count}
               </span>
             </button>
          ))}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
            <div className="px-4 pb-4 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="bg-black/20 border border-white/5 rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                                <Camera className="w-3 h-3" /> Angle
                            </label>
                            <select 
                                value={filterAngle} 
                                onChange={(e) => setFilterAngle(e.target.value as CameraAngle | 'all')}
                                className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                            >
                                <option value="all">All Angles</option>
                                <option value="wide">Wide</option>
                                <option value="medium">Medium</option>
                                <option value="close-up">Close Up</option>
                                <option value="extreme-close-up">Ext. Close Up</option>
                                <option value="overhead">Overhead</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                                <Move className="w-3 h-3" /> Movement
                            </label>
                            <select 
                                value={filterMovement} 
                                onChange={(e) => setFilterMovement(e.target.value as CameraMovement | 'all')}
                                className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                            >
                                <option value="all">All Movements</option>
                                <option value="static">Static</option>
                                <option value="pan">Pan</option>
                                <option value="tilt">Tilt</option>
                                <option value="zoom">Zoom</option>
                                <option value="dolly">Dolly</option>
                                <option value="tracking">Tracking</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Min Duration
                            </label>
                            <span className="text-[10px] text-gray-400 font-mono">{minDuration}s</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            step="1" 
                            value={minDuration}
                            onChange={(e) => setMinDuration(Number(e.target.value))}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
                        />
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="p-4 space-y-8 flex-1">
        {filteredScenes.length > 0 ? (
          filteredScenes.map((scene, sIdx) => (
            <div key={scene.id} className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                 <div className="bg-accent/10 text-accent font-mono text-sm px-2 py-1 rounded">
                   SCENE {scene.id.split('-').pop()}
                 </div>
                 <div>
                   <h3 className="text-sm font-bold text-white">{scene.title}</h3>
                   <p className="text-xs text-muted capitalize">{scene.timeOfDay} • {scene.location} • {scene.mood}</p>
                 </div>
              </div>

              <div className="pl-4 border-l-2 border-border space-y-6">
                {scene.subScenes.map((sub, subIdx) => (
                  <div key={sub.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{sub.title}</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {sub.shots.map((shot) => (
                        <div key={shot.id} className="flex gap-2 items-stretch group/item">
                          <div className="flex-1 min-w-0">
                            <ShotCard 
                              shot={shot}
                              isSelected={state.selectedShotId === shot.id}
                              onClick={() => dispatch({ type: 'SELECT_SHOT', payload: shot.id })}
                            />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              generateShot(shot.id);
                            }}
                            disabled={shot.status === 'generating'}
                            className={`
                              w-8 flex items-center justify-center rounded-lg border transition-all duration-200
                              ${shot.status === 'generating' 
                                ? 'bg-accent/10 border-accent/20 text-accent cursor-not-allowed' 
                                : 'bg-background border-border text-gray-500 hover:text-white hover:bg-accent hover:border-accent hover:shadow-lg hover:shadow-accent/20'}
                            `}
                            title="Generate Video"
                          >
                            <RefreshCw className={`w-4 h-4 ${shot.status === 'generating' ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-muted">
             <Filter className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>No shots found matching your filters.</p>
             <p className="text-xs mt-2">Try adjusting or clearing your filters.</p>
             {hasActiveFilters && (
               <button 
                  onClick={handleClearFilters}
                  className="mt-4 text-accent hover:text-accent-hover text-sm font-medium flex items-center gap-2 mx-auto"
               >
                 <X className="w-3 h-3" />
                 Clear Filters
               </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneList;
