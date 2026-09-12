import React from 'react';
import { BookOpen, Camera, Shirt, Heart, X, MessageSquareQuote, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function CulturalEtiquetteDrawer() {
  const { culturalEtiquetteItem, setCulturalEtiquetteItem } = useApp();

  if (!culturalEtiquetteItem) return null;

  const etiquette = culturalEtiquetteItem.etiquette || {
    dressCode: "Cover shoulders and knees when visiting sacred sites and rural villages.",
    photography: "Ask politely before photographing villagers or religious rituals.",
    customs: "Remove shoes and leather accessories outside temples and sanctums.",
    tipping: "5-10% in sit-down restaurants; directly buy handicrafts from artisans rather than cash tipping."
  };

  const usefulPhrases = culturalEtiquetteItem.phrases || [
    { phrase: "Namaste / Pranam", meaning: "Universal respectful greeting with folded hands", audio: "na-mas-tay" },
    { phrase: "Dhanyawad / Shukriya", meaning: "Heartfelt Thank You", audio: "dhan-ya-vaad" },
    { phrase: "Kitna hua?", meaning: "How much is this?", audio: "kit-na hu-aa" },
    { phrase: "Kripya madad karein", meaning: "Please help me (Emergency)", audio: "krip-ya ma-dad ka-rein" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full bg-neutral-card dark:bg-darkmode-surface border-l border-neutral-border dark:border-darkmode-border shadow-2xl p-6 overflow-y-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-border dark:border-darkmode-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-nature-light text-nature flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                Cultural Intelligence
              </h3>
              <p className="text-xs text-neutral-muted">
                {culturalEtiquetteItem.name} • Local Etiquette
              </p>
            </div>
          </div>
          <button
            onClick={() => setCulturalEtiquetteItem(null)}
            className="p-1 rounded-full text-neutral-muted hover:text-neutral-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Etiquette Pillars */}
        <div className="space-y-4 text-xs">
          
          {/* Dress Code */}
          <div className="p-3.5 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border space-y-1.5">
            <div className="flex items-center gap-2 text-brand font-bold text-sm">
              <Shirt className="w-4 h-4" />
              <span>Dress Code Expectations</span>
            </div>
            <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
              {etiquette.dressCode}
            </p>
          </div>

          {/* Photography Guidelines */}
          <div className="p-3.5 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border space-y-1.5">
            <div className="flex items-center gap-2 text-trust font-bold text-sm">
              <Camera className="w-4 h-4" />
              <span>Photography Guidelines</span>
            </div>
            <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
              {etiquette.photography}
            </p>
          </div>

          {/* Sacred Customs & Prohibitions */}
          <div className="p-3.5 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border space-y-1.5">
            <div className="flex items-center gap-2 text-nature font-bold text-sm">
              <Heart className="w-4 h-4" />
              <span>Religious & Community Customs</span>
            </div>
            <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
              {etiquette.customs}
            </p>
          </div>

          {/* Tipping Norms */}
          <div className="p-3.5 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border space-y-1.5">
            <div className="flex items-center gap-2 text-action font-bold text-sm">
              <Check className="w-4 h-4" />
              <span>Tipping Norms</span>
            </div>
            <p className="text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
              {etiquette.tipping}
            </p>
          </div>

        </div>

        {/* Useful Local Vernacular Phrases */}
        <div className="space-y-3 pt-2 border-t border-neutral-border dark:border-darkmode-border">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-muted flex items-center gap-1.5">
            <MessageSquareQuote className="w-3.5 h-3.5 text-brand" />
            <span>Essential Local Phrases</span>
          </h4>

          <div className="space-y-2">
            {usefulPhrases.map((p, idx) => (
              <div key={idx} className="p-2.5 rounded-ts-sm bg-neutral-bg-secondary/60 dark:bg-darkmode-elevated/40 border border-neutral-border/60 text-xs">
                <div className="flex justify-between items-center font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  <span>{p.phrase}</span>
                  <span className="text-[11px] font-mono text-neutral-muted">[{p.audio}]</span>
                </div>
                <p className="text-neutral-muted mt-0.5">{p.meaning}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setCulturalEtiquetteItem(null)}
            className="btn-brand w-full py-2.5 text-xs font-bold"
          >
            I Understand / Got It
          </button>
        </div>

      </div>
    </div>
  );
}
