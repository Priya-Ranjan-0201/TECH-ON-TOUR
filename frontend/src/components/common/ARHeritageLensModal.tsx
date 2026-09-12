import React, { useState } from 'react';
import { Camera, Eye, Volume2, X, Sparkles, Layers, Info, History } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ARHeritageLensModal() {
  const { arHeritageItem, setArHeritageItem } = useApp();
  const [activeLayer, setActiveLayer] = useState('architecture'); // 'architecture' | 'history' | 'reconstruction'
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!arHeritageItem) return null;

  const handleToggleAudio = () => {
    setIsPlayingAudio(prev => !prev);
    if (!isPlayingAudio && 'speechSynthesis' in window) {
      const text = `${arHeritageItem.name}. Built in the 16th century, this monument demonstrates classic stone interlocking without mortar.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleClose = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
    setArHeritageItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-neutral-card dark:bg-darkmode-surface border border-neutral-border dark:border-darkmode-border rounded-ts-hero shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-border dark:border-darkmode-border flex items-center justify-between bg-neutral-card dark:bg-darkmode-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary flex items-center gap-2">
                <span>AR Heritage Lens</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand border border-brand/20">
                  Spatial Intelligence
                </span>
              </h3>
              <p className="text-xs text-neutral-muted">
                {arHeritageItem.name || 'Historic Monument Visualization'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1 rounded-full text-neutral-muted hover:text-neutral-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulated Camera Viewfinder */}
        <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
          <img
            src={arHeritageItem.image || "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80"}
            alt="AR Monument View"
            className="w-full h-full object-cover opacity-85"
          />

          {/* AR Target Reticle Overlay */}
          <div className="absolute inset-0 border-2 border-brand/40 m-6 rounded-ts-md pointer-events-none flex flex-col justify-between p-4">
            <div className="flex justify-between text-[11px] font-mono text-brand font-bold bg-black/50 px-2 py-1 rounded w-fit">
              <span>● AR CAMERA LOCK: 98.4% CONFIDENCE</span>
            </div>

            {/* Spatial Annotations */}
            <div className="space-y-2">
              <div className="bg-brand-deep/90 text-white border border-brand/40 px-3 py-1.5 rounded text-xs backdrop-blur-sm w-fit animate-pulse">
                <span className="font-bold text-action">📍 Point 1: </span>
                Interlocking Kathkuni Deodar Wooden Beams (Earthquake-Proof Joint)
              </div>
              <div className="bg-brand-deep/90 text-white border border-brand/40 px-3 py-1.5 rounded text-xs backdrop-blur-sm w-fit">
                <span className="font-bold text-action">📍 Point 2: </span>
                Hand-Chiseled River Slate Plinth (Circa 1640 AD)
              </div>
            </div>
          </div>

          {/* Audio Narration Floating Pill */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleToggleAudio}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
                isPlayingAudio
                  ? 'bg-action text-white animate-pulse'
                  : 'bg-neutral-card/90 text-neutral-text-primary hover:bg-neutral-card'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingAudio ? 'Audio Playing...' : 'Listen to Narration'}</span>
            </button>
          </div>
        </div>

        {/* AR Layer Selector & Content Drawer */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="flex border-b border-neutral-border dark:border-darkmode-border pb-2 gap-2">
            <button
              onClick={() => setActiveLayer('architecture')}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                activeLayer === 'architecture'
                  ? 'bg-brand text-white'
                  : 'bg-neutral-secondary text-neutral-text-sec hover:bg-neutral-border'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Architecture Breakdown</span>
            </button>

            <button
              onClick={() => setActiveLayer('history')}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                activeLayer === 'history'
                  ? 'bg-brand text-white'
                  : 'bg-neutral-secondary text-neutral-text-sec hover:bg-neutral-border'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historical Timeline</span>
            </button>

            <button
              onClick={() => setActiveLayer('reconstruction')}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                activeLayer === 'reconstruction'
                  ? 'bg-brand text-white'
                  : 'bg-neutral-secondary text-neutral-text-sec hover:bg-neutral-border'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ancient Reconstruction</span>
            </button>
          </div>

          {/* Layer Details */}
          {activeLayer === 'architecture' && (
            <div className="space-y-2 text-xs text-neutral-text-sec dark:text-darkmode-text-secondary">
              <p className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">
                Earthquake Resistance via Indigenous Engineering
              </p>
              <p className="leading-relaxed">
                Kath-Kuni literally translates to "wood corner". Alternating horizontal courses of squared cedar logs (deodar) and hand-dressed river metamorphic stones are laid without mortar. The flexibility of wood dissipates seismic energy, allowing buildings to stand undamaged for over 400 years in Zone V earthquake terrain.
              </p>
            </div>
          )}

          {activeLayer === 'history' && (
            <div className="space-y-2 text-xs text-neutral-text-sec dark:text-darkmode-text-secondary">
              <p className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">
                Historical Chronology & Lineage
              </p>
              <div className="space-y-1.5 border-l-2 border-brand/30 pl-3">
                <div>
                  <span className="font-bold text-brand">1580 AD: </span>
                  Erected as defensive watchtower granary by Raja Bahadur Singh of Kullu kingdom.
                </div>
                <div>
                  <span className="font-bold text-brand">1905 AD: </span>
                  Withstood the catastrophic Kangra earthquake (7.8 magnitude) with zero structural damage.
                </div>
                <div>
                  <span className="font-bold text-brand">2026: </span>
                  Recognized under Swadesh Darshan 2.0 Community Living Heritage initiative.
                </div>
              </div>
            </div>
          )}

          {activeLayer === 'reconstruction' && (
            <div className="space-y-2 text-xs text-neutral-text-sec dark:text-darkmode-text-secondary">
              <p className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">
                Original 17th Century Visual State
              </p>
              <p className="leading-relaxed">
                In the 17th century, the upper cantilevered balcony was draped in hand-woven Himalayan sheep-wool tapestries dyed with wild madder and walnut bark. Granary chambers held sufficient millet and barley to sustain the entire valley settlement through 6 months of winter snow.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
