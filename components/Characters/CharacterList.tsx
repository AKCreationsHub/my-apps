
import React, { useEffect } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { Users, Sparkles, User, RefreshCw, Loader2, Wand2, Image as ImageIcon } from 'lucide-react';

const CharacterList: React.FC = () => {
  const { state, dispatch, runCharacterAnalysis, generateCharacterImage, refineCharacter, generateAllCharacterImages } = useProject();
  const { characters } = state.project;

  const handleAnalyze = () => {
    if (!state.project.script) return;
    runCharacterAnalysis();
  };

  // Automatically trigger generation for characters that have been identified but have no image
  useEffect(() => {
    characters.forEach(char => {
      if (!char.imageUrl && char.status === 'pending') {
        generateCharacterImage(char.id);
      }
    });
  }, [characters, generateCharacterImage]);

  const missingImagesCount = characters.filter(c => !c.imageUrl && c.status !== 'generating').length;

  return (
    <div className="h-full bg-surface border-r border-border overflow-y-auto">
      <div className="p-4 border-b border-border sticky top-0 bg-surface/95 backdrop-blur z-10 flex justify-between items-center gap-4">
        <div>
            <h2 className="font-semibold text-text flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Characters
            </h2>
            <p className="text-xs text-muted mt-1">{characters.length} Identified</p>
        </div>
        
        <div className="flex items-center gap-2">
            {missingImagesCount > 0 && (
                <button 
                    onClick={generateAllCharacterImages}
                    className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-lg shadow-accent/20"
                    title="Generate images for all characters without one"
                >
                    <Wand2 className="w-3 h-3" />
                    Generate ({missingImagesCount})
                </button>
            )}
            <button 
                onClick={handleAnalyze}
                disabled={state.isLoading}
                className="flex items-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1.5 rounded-lg text-xs font-medium transition"
            >
                {state.isLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
                {characters.length > 0 ? 'Re-Analyze' : 'Analyze Script'}
            </button>
        </div>
      </div>

      <div className="p-6">
        {characters.length === 0 ? (
           <div className="text-center py-20 text-muted">
             <div className="bg-background rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                 <Users className="w-8 h-8 opacity-20" />
             </div>
             <p className="font-medium">No characters found</p>
             <p className="text-xs mt-2 max-w-xs mx-auto">Analyze your script to automatically detect characters and generate visual profiles.</p>
             <button
               onClick={handleAnalyze}
               disabled={state.isLoading}
               className="mt-6 bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-full font-medium shadow-lg transition text-sm flex items-center gap-2 mx-auto"
             >
               <Sparkles className="w-4 h-4" /> Analyze Characters
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {characters.map((char) => (
              <div key={char.id} className="bg-background rounded-xl border border-border overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-shadow group">
                {/* Visual Section - Increased width for prominence */}
                <div className="w-full md:w-2/5 lg:w-72 aspect-[3/4] bg-black/40 relative border-r border-border group/image flex-shrink-0">
                    {char.imageUrl ? (
                        <>
                            <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              Concept Art
                            </div>

                            {/* Regenerate Button (Visible on Hover) */}
                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                                <button 
                                    onClick={() => generateCharacterImage(char.id)}
                                    disabled={char.status === 'generating'}
                                    className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-md transition shadow-lg border border-white/20"
                                    title="Regenerate Portrait"
                                >
                                    <RefreshCw className={`w-4 h-4 ${char.status === 'generating' ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted p-6 text-center bg-zinc-900/50 hover:bg-zinc-900 transition-colors relative overflow-hidden">
                            {/* Abstract Pattern Background */}
                            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                            
                            {char.status === 'generating' ? (
                                <div className="flex flex-col items-center gap-4 animate-pulse relative z-10">
                                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center ring-4 ring-accent/10">
                                         <Loader2 className="w-8 h-8 text-accent animate-spin" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-text">Painting Portrait...</p>
                                        <p className="text-xs text-muted mt-1">Applying {state.project.settings.visualStyle} style</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-5 border border-white/5 shadow-inner group-hover:scale-105 transition-transform duration-500 relative z-10">
                                      <User className="w-10 h-10 text-muted opacity-50" />
                                    </div>
                                    <button 
                                        onClick={() => generateCharacterImage(char.id)}
                                        disabled={!char.visualPrompt}
                                        className="w-full max-w-[200px] bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20 px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 relative z-10"
                                    >
                                        <Wand2 className="w-3.5 h-3.5 group-hover/btn:animate-pulse" />
                                        Generate Portrait
                                    </button>
                                    <p className="text-[10px] text-muted mt-3 opacity-60 px-2 leading-tight relative z-10">
                                      AI-generated concept art based on character description
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="flex-1 p-5 flex flex-col min-w-0">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-white tracking-tight">{char.name}</h3>
                                {!char.imageUrl && char.status !== 'generating' && (
                                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                        <ImageIcon className="w-3 h-3" />
                                        Missing Image
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                                <input
                                    type="text"
                                    list={`role-options-${char.id}`}
                                    value={char.role}
                                    onChange={(e) => dispatch({ 
                                        type: 'UPDATE_CHARACTER', 
                                        payload: { charId: char.id, updates: { role: e.target.value } } 
                                    })}
                                    className="bg-white/5 border border-white/10 text-gray-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded focus:outline-none focus:border-accent focus:bg-black/20 transition-colors w-full max-w-[150px] placeholder-gray-600"
                                    placeholder="Role (e.g. Protagonist)"
                                />
                                <datalist id={`role-options-${char.id}`}>
                                  <option value="Protagonist" />
                                  <option value="Antagonist" />
                                  <option value="Supporting" />
                                  <option value="Minor" />
                                  <option value="Extra" />
                                </datalist>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 mt-4 flex-1">
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <User className="w-3 h-3" /> Personality
                            </h4>
                            <p className="text-sm text-gray-300 leading-relaxed font-light">
                                {char.description}
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" /> Visual Prompt
                            </h4>
                            <div className="bg-black/30 p-3 rounded-lg border border-white/5 relative group-hover:border-white/10 transition-colors flex items-start gap-3">
                                <p className="text-xs text-gray-400 font-mono italic leading-relaxed flex-1">
                                    "{char.visualPrompt}"
                                </p>
                                <button 
                                  onClick={() => refineCharacter(char.id)}
                                  disabled={char.isRefining}
                                  className="shrink-0 flex items-center gap-1.5 text-[10px] bg-accent/10 hover:bg-accent hover:text-white text-accent px-2 py-1.5 rounded transition disabled:opacity-50 font-medium border border-accent/20"
                                  title="Refine details based on script"
                                >
                                  {char.isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                  {char.isRefining ? 'Refining' : 'Refine'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterList;
