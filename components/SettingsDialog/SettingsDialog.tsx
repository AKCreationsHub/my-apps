
import React, { useState, useEffect } from 'react';
import { X, Settings, Check, Monitor, Film, Video, Palette, Square, Smartphone, Youtube, Tv, Instagram } from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { ProjectSettings, VisualStyle } from '../../types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const VISUAL_STYLES: { id: VisualStyle; name: string; description: string; icon: React.ElementType }[] = [
  { id: 'Cinematic', name: 'Cinematic', description: 'High contrast, dramatic lighting, movie-like quality', icon: Film },
  { id: 'Documentary', name: 'Documentary', description: 'Realistic, natural lighting, handheld feel', icon: Video },
  { id: 'Animation', name: 'Animation', description: 'Stylized, colorful, illustrative aesthetics', icon: Palette },
  { id: 'Minimalist', name: 'Minimalist', description: 'Clean lines, simple compositions, neutral tones', icon: Square },
];

const ASPECT_RATIOS = [
  { id: '16:9', name: 'Landscape', description: 'YouTube, TV, Cinema', icon: Youtube },
  { id: '9:16', name: 'Portrait', description: 'TikTok, Reels, Shorts', icon: Smartphone },
  { id: '1:1', name: 'Square', description: 'Instagram Feed', icon: Instagram },
  { id: '4:3', name: 'Standard', description: 'Classic TV', icon: Monitor },
];

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const { state, updateSettings } = useProject();
  const [localSettings, setLocalSettings] = useState<ProjectSettings>(state.project.settings);
  const [activeTab, setActiveTab] = useState<'style' | 'output'>('style');

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(state.project.settings);
    }
  }, [isOpen, state.project.settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  const handleChange = (key: keyof ProjectSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-black/20 shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent" /> 
            Project Settings
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition rounded-full p-1 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-full md:w-48 bg-black/20 border-r border-border p-3 space-y-1 shrink-0">
            <button 
                onClick={() => setActiveTab('style')}
                className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition
                    ${activeTab === 'style' ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
            >
              <Palette className="w-4 h-4" /> Visual Style
            </button>
            <button 
                onClick={() => setActiveTab('output')}
                className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition
                    ${activeTab === 'output' ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
            >
              <Monitor className="w-4 h-4" /> Output
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            
            {/* Visual Style Section */}
            {activeTab === 'style' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Visual Style Presets</h4>
                    <div className="grid grid-cols-1 gap-3">
                    {VISUAL_STYLES.map((style) => (
                        <div 
                        key={style.id}
                        onClick={() => handleChange('visualStyle', style.id)}
                        className={`
                            relative p-4 rounded-lg border cursor-pointer transition-all group flex items-start gap-4
                            ${localSettings.visualStyle === style.id 
                            ? 'bg-accent/10 border-accent' 
                            : 'bg-background border-border hover:border-gray-600 hover:bg-white/5'}
                        `}
                        >
                            <div className={`p-3 rounded-lg shrink-0 ${localSettings.visualStyle === style.id ? 'bg-accent text-white' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
                                <style.icon className="w-6 h-6" />
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold ${localSettings.visualStyle === style.id ? 'text-white' : 'text-gray-300'}`}>
                                        {style.name}
                                    </span>
                                    {localSettings.visualStyle === style.id && (
                                        <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted leading-relaxed">{style.description}</p>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            )}

            {/* Output Section */}
            {activeTab === 'output' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Aspect Ratio</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {ASPECT_RATIOS.map((ratio) => (
                                <div 
                                key={ratio.id}
                                onClick={() => handleChange('aspectRatio', ratio.id)}
                                className={`
                                    relative p-3 rounded-lg border cursor-pointer transition-all group flex flex-col items-center text-center gap-2
                                    ${localSettings.aspectRatio === ratio.id
                                    ? 'bg-accent/10 border-accent' 
                                    : 'bg-background border-border hover:border-gray-600 hover:bg-white/5'}
                                `}
                                >
                                    <div className={`p-2 rounded-full ${localSettings.aspectRatio === ratio.id ? 'bg-accent text-white' : 'bg-white/5 text-gray-400'}`}>
                                        <ratio.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className={`font-bold text-sm block ${localSettings.aspectRatio === ratio.id ? 'text-white' : 'text-gray-300'}`}>
                                            {ratio.id}
                                        </span>
                                        <span className="text-[10px] text-muted block uppercase tracking-wide">{ratio.name}</span>
                                    </div>
                                    {localSettings.aspectRatio === ratio.id && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Resolution</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['720p', '1080p', '4K', '8K'].map((res) => (
                                    <button
                                        key={res}
                                        onClick={() => handleChange('resolution', res)}
                                        className={`px-2 py-2 rounded text-xs font-bold border transition
                                            ${localSettings.resolution === res
                                            ? 'bg-accent text-white border-accent'
                                            : 'bg-black/20 text-gray-400 border-border hover:border-gray-500 hover:text-white'}
                                        `}
                                    >
                                        {res}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Frame Rate</label>
                            <select 
                                value={localSettings.frameRate}
                                onChange={(e) => handleChange('frameRate', parseInt(e.target.value))}
                                className="w-full bg-black/20 border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-accent outline-none appearance-none cursor-pointer hover:border-gray-500 transition-colors"
                            >
                                <option value="24">24 fps (Cinematic)</option>
                                <option value="30">30 fps (Television)</option>
                                <option value="60">60 fps (High Frame Rate)</option>
                                <option value="120">120 fps (Slow Motion Source)</option>
                                <option value="240">240 fps (Ultra Slow Motion)</option>
                            </select>
                            <p className="text-[10px] text-muted">
                                Higher frame rates are smoother but result in larger file sizes. 24fps is standard for movies.
                            </p>
                        </div>
                    </div>
                </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-black/20 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition shadow-lg shadow-accent/20"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
