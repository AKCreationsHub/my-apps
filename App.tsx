
import React, { useState } from 'react';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
import ScriptInput from './components/ScriptInput/ScriptInput';
import SceneList from './components/StoryboardEditor/SceneList';
import CharacterList from './components/Characters/CharacterList';
import Timeline from './components/Timeline/Timeline';
import VideoPlayer from './components/Preview/VideoPlayer';
import ExportDialog from './components/ExportDialog/ExportDialog';
import SettingsDialog from './components/SettingsDialog/SettingsDialog';
import { Layout, FileText, Settings, Share, Users } from 'lucide-react';

const AppLayout = () => {
  const { state, dispatch } = useProject();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background text-text font-sans selection:bg-accent/30">
      <ExportDialog isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Header */}
      <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
             <Layout className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">AI Story Director</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-border text-muted">v1.0-beta</span>
        </div>

        <div className="flex bg-background rounded-lg p-1 border border-border">
          <button 
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'SCRIPT' })}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${
              state.activeView === 'SCRIPT' ? 'bg-surface shadow text-white' : 'text-muted hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Script
          </button>
          <button 
             onClick={() => dispatch({ type: 'SET_VIEW', payload: 'STORYBOARD' })}
             className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${
              state.activeView === 'STORYBOARD' ? 'bg-surface shadow text-white' : 'text-muted hover:text-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5" /> Storyboard
          </button>
          <button 
             onClick={() => dispatch({ type: 'SET_VIEW', payload: 'CHARACTERS' })}
             className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${
              state.activeView === 'CHARACTERS' ? 'bg-surface shadow text-white' : 'text-muted hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Characters
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="text-muted hover:text-white p-2 transition"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsExportOpen(true)}
            className="bg-white text-black hover:bg-gray-200 px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition"
          >
            <Share className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Script, Storyboard, or Characters */}
        <div className="w-[450px] flex-shrink-0 flex flex-col z-10 shadow-2xl shadow-black/50">
           {state.activeView === 'SCRIPT' && <ScriptInput />}
           {state.activeView === 'STORYBOARD' && <SceneList />}
           {state.activeView === 'CHARACTERS' && <CharacterList />}
        </div>

        {/* Center/Right Panel: Preview & Details */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative">
            <VideoPlayer />
          </div>
        </div>
      </div>

      {/* Bottom Panel: Timeline */}
      <div className="flex-shrink-0 z-20">
        <Timeline />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ProjectProvider>
      <AppLayout />
    </ProjectProvider>
  );
};

export default App;
