import React, { useState } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { FileText, Wand2, Upload, Play, Loader2 } from 'lucide-react';

const SAMPLE_SCRIPT = `INT. SPACESHIP COCKPIT - NIGHT

The dashboard flickers with alarming RED LIGHTS. COMMANDER ZARA (30s) grips the controls.

ZARA
Hold on! We're entering the atmosphere!

EXT. ALIEN PLANET - CONTINUOUS

The ship streaks across the purple sky like a comet, debris trailing behind it.`;

const ScriptInput: React.FC = () => {
  const { state, dispatch, runAnalysis } = useProject();
  const [localScript, setLocalScript] = useState(state.project.script || SAMPLE_SCRIPT);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalScript(e.target.value);
    dispatch({ type: 'SET_SCRIPT', payload: e.target.value });
  };

  const handleAnalyze = () => {
    if (!state.project.script) {
        dispatch({ type: 'SET_SCRIPT', payload: localScript });
    }
    runAnalysis();
  };

  return (
    <div className="h-full flex flex-col bg-surface border-r border-border">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-text">Script Editor</h2>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/5 rounded text-muted hover:text-text transition">
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <textarea
          value={localScript}
          onChange={handleTextChange}
          className="w-full h-full bg-background p-6 text-text font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-accent/20"
          placeholder="Write or paste your script here..."
          spellCheck={false}
        />
        <div className="absolute bottom-6 right-6">
          <button
            onClick={handleAnalyze}
            disabled={state.isLoading}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-full font-medium shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Analyze Script
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptInput;
