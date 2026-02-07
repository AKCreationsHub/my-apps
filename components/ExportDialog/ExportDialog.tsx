
import React, { useState, useEffect, useRef } from 'react';
import { X, Download, CheckCircle, FileVideo, AlertCircle, Loader2, Layers, Film, Mic } from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose }) => {
  const { state } = useProject();
  const [format, setFormat] = useState('MP4');
  const [resolution, setResolution] = useState(state.project.settings.resolution);
  const [frameRate, setFrameRate] = useState(state.project.settings.frameRate.toString());
  const [quality, setQuality] = useState('High');
  
  const [status, setStatus] = useState<'idle' | 'exporting' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [exportStep, setExportStep] = useState('');
  
  // Project Stats Analysis
  const allShots = state.project.scenes.flatMap(s => s.subScenes.flatMap(sub => sub.shots));
  const bRollCount = allShots.filter(s => !!s.bRollUrl).length;
  const totalDuration = allShots.reduce((acc, s) => acc + s.duration, 0);
  const voiceOverCount = allShots.filter(s => !!s.voiceOverUrl).length;
  
  // Format duration helper
  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Use a ref to track if the dialog is open to prevent state updates after close
  const isOpenRef = useRef(isOpen);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setProgress(0);
      setResolution(state.project.settings.resolution);
      setFrameRate(state.project.settings.frameRate.toString());
      setExportStep('');
    }
  }, [isOpen, state.project.settings]);

  if (!isOpen) return null;

  const handleExport = () => {
    setStatus('exporting');
    setProgress(0);
    setExportStep('Initializing export engine...');
    
    let currentProgress = 0;
    
    const simulateProgress = () => {
      if (!isOpenRef.current) return;

      let increment = 0;
      let delay = 0;
      let nextStepText = '';

      // Simulation Logic with B-Roll Awareness
      if (currentProgress < 10) {
        // Stage 1: Initialization
        increment = Math.random() * 3 + 1; 
        delay = Math.random() * 150 + 50;
        nextStepText = 'Initializing project assets...';
      } else if (currentProgress < 30) {
        // Stage 2: Base footage
        increment = Math.random() * 2 + 0.5;
        delay = Math.random() * 200 + 50;
        nextStepText = `Processing ${allShots.length} primary video clips...`;
      } else if (currentProgress < 50) {
        // Stage 3: B-Roll & Layers (Conditional)
        if (bRollCount > 0) {
             increment = Math.random() * 1.5 + 0.5;
             delay = Math.random() * 250 + 50;
             // Updated text to clearly indicate timeline composition
             nextStepText = `Compositing ${bRollCount} B-roll clips according to timeline placement...`;
        } else {
             // Skip fast if no B-roll
             increment = 10;
             delay = 50;
             nextStepText = 'No B-roll layers detected, skipping composite...';
        }
      } else if (currentProgress < 70) {
        // Stage 4: Effects & Grading
        increment = Math.random() * 1.0 + 0.2;
        delay = Math.random() * 300 + 100;
        nextStepText = `Applying ${state.project.settings.visualStyle} color grading...`;
      } else if (currentProgress < 85) {
        // Stage 5: Encoding
        increment = Math.random() * 1.5 + 0.5;
        delay = Math.random() * 200 + 50;
        nextStepText = `Encoding video stream (${format} / ${resolution})...`;
      } else if (currentProgress < 95) {
        // Stage 6: Audio
        increment = Math.random() * 2 + 1;
        delay = Math.random() * 150 + 50;
        nextStepText = voiceOverCount > 0 ? `Mixing ${voiceOverCount} voice-over tracks & spatial audio...` : 'Mixing audio tracks...';
      } else {
        // Stage 7: Finalizing
        increment = Math.random() * 1 + 0.1;
        delay = Math.random() * 500 + 100;
        nextStepText = 'Finalizing container and metadata...';
      }

      // Update State
      setExportStep(nextStepText);
      currentProgress += increment;

      if (currentProgress >= 100) {
        setProgress(100);
        setStatus('completed');
      } else {
        setProgress(Math.min(currentProgress, 99.5)); // Cap at 99.5 until done
        setTimeout(simulateProgress, delay);
      }
    };

    // Start simulation
    setTimeout(simulateProgress, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-black/20">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-accent" /> 
            Export Project
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition rounded-full p-1 hover:bg-white/10"
            disabled={status === 'exporting'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {status === 'completed' ? (
            <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Export Complete!</h4>
              <p className="text-gray-400 mb-6 text-sm">
                Your video has been successfully rendered and saved to your downloads.
              </p>
              <div className="flex flex-col gap-3">
                <button className="w-full bg-accent hover:bg-accent-hover text-white py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Download File
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Settings Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Format</label>
                  <select 
                    disabled={status === 'exporting'}
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                  >
                    <option value="MP4">MP4 (H.264)</option>
                    <option value="MOV">MOV (ProRes)</option>
                    <option value="WEBM">WebM</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Resolution</label>
                  <select 
                    disabled={status === 'exporting'}
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                  >
                    <option value="720p">720p HD</option>
                    <option value="1080p">1080p Full HD</option>
                    <option value="4K">4K Ultra HD</option>
                    <option value="8K">8K Ultra HD</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Frame Rate</label>
                  <select 
                    disabled={status === 'exporting'}
                    value={frameRate}
                    onChange={(e) => setFrameRate(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                  >
                    <option value="24">24 fps</option>
                    <option value="30">30 fps</option>
                    <option value="60">60 fps</option>
                    <option value="120">120 fps</option>
                    <option value="240">240 fps</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Quality</label>
                  <select 
                    disabled={status === 'exporting'}
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-accent outline-none"
                  >
                    <option value="High">High (Bitrate)</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Composition Info Box */}
              <div className="bg-black/40 border border-white/5 rounded-lg p-4 space-y-3">
                 <div className="flex items-center justify-between text-xs text-gray-400 border-b border-white/5 pb-2">
                     <span>Estimated Size:</span>
                     <span className="font-mono text-white font-bold">
                        {quality === 'High' ? '125 MB' : quality === 'Medium' ? '85 MB' : '45 MB'}
                     </span>
                 </div>
                 <div className="flex items-center justify-between text-xs text-gray-400">
                     <span>Total Duration:</span>
                     <span className="font-mono text-white">{formatDuration(totalDuration)}</span>
                 </div>
                 
                 {/* Track Breakdown */}
                 <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="bg-white/5 rounded p-2 text-center" title="Primary Video Tracks">
                        <Film className="w-3.5 h-3.5 mx-auto mb-1 text-blue-400" />
                        <span className="text-[10px] text-gray-300 block">{allShots.length} Clips</span>
                    </div>
                    <div className={`bg-white/5 rounded p-2 text-center transition-colors ${bRollCount > 0 ? 'bg-purple-500/10' : ''}`} title="B-Roll Overlay Tracks">
                        <Layers className={`w-3.5 h-3.5 mx-auto mb-1 ${bRollCount > 0 ? 'text-purple-400' : 'text-gray-600'}`} />
                        <span className={`text-[10px] block ${bRollCount > 0 ? 'text-purple-200' : 'text-gray-500'}`}>{bRollCount} B-Roll</span>
                    </div>
                    <div className={`bg-white/5 rounded p-2 text-center transition-colors ${voiceOverCount > 0 ? 'bg-amber-500/10' : ''}`} title="Audio/Voice Tracks">
                        <Mic className={`w-3.5 h-3.5 mx-auto mb-1 ${voiceOverCount > 0 ? 'text-amber-400' : 'text-gray-600'}`} />
                        <span className={`text-[10px] block ${voiceOverCount > 0 ? 'text-amber-200' : 'text-gray-500'}`}>{voiceOverCount} VO</span>
                    </div>
                 </div>
              </div>

              {/* Progress Bar (Visible during export) */}
              {status === 'exporting' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                   <div className="flex justify-between items-end text-xs text-gray-400">
                     <span className="font-medium text-accent animate-pulse flex items-center gap-2">
                       <Loader2 className="w-3 h-3 animate-spin" />
                       {exportStep}
                     </span>
                     <span className="font-mono">{Math.round(progress)}%</span>
                   </div>
                   <div className="h-2 bg-surface border border-border rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-accent transition-all duration-300 ease-out"
                       style={{ width: `${progress}%` }}
                     />
                   </div>
                </div>
              )}

              {/* Action Button */}
              {status === 'idle' && (
                <button 
                  onClick={handleExport}
                  className="w-full bg-white text-black hover:bg-gray-200 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                >
                  <FileVideo className="w-4 h-4" />
                  Start Export
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
