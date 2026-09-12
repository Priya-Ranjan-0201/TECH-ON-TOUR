import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, MapPin, Menu, X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

export default function OnboardingSpotlight() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem('has_seen_onboarding');
      if (!hasSeen) {
        // Small delay for smooth entry after initial render
        const timer = setTimeout(() => setIsOpen(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage fallback
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem('has_seen_onboarding', 'true');
    } catch {
      // safe fallback
    }
    setIsOpen(false);
  };

  const steps = [
    {
      title: "Plan Your Journey & Search",
      badge: "Step 1 of 3",
      icon: Sparkles,
      iconColor: "text-accent-600 dark:text-accent-400",
      highlightTarget: "Hero Search & AI Planner",
      description: "Start by searching any Indian heritage site or clicking 'Plan My Trip' to generate a verified, crowd-diverted multi-day itinerary grounded in 12,293 destinations."
    },
    {
      title: "Curated Recommendation Rails",
      badge: "Step 2 of 3",
      icon: Compass,
      iconColor: "text-primary-800 dark:text-accent-400",
      highlightTarget: "Personalized Discovery",
      description: "Scroll down to browse intelligent destination rows tailored to your active interests, GPS proximity, current monsoon season, and off-beat hidden gems."
    },
    {
      title: "Navigation & Instant Bookings",
      badge: "Step 3 of 3",
      icon: MapPin,
      iconColor: "text-secondary-800 dark:text-secondary-400",
      highlightTarget: "Top Nav & More Menu",
      description: "Use the top navigation to check your bookings, launch live trip mode, explore PM-JUGA homestays with 0% OTA commission, or access safety services."
    }
  ];

  if (!isOpen) return null;

  const current = steps[currentStep];
  const StepIcon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none">
      <div 
        className="w-full max-w-md bg-white dark:bg-darkmode-surface rounded-2xl border border-neutral-200 dark:border-darkmode-border shadow-2xl overflow-hidden animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Step indicator */}
        <div className="bg-primary-800 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-accent-600/30 border border-accent-400/40 text-[11px] font-bold text-accent-200">
              {current.badge}
            </span>
            <span className="text-xs font-semibold text-primary-100">Welcome to TravelSathi</span>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Skip Walkthrough"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-darkmode-elevated flex items-center justify-center shrink-0 border border-primary-200/60 dark:border-darkmode-border">
              <StepIcon className={`w-6 h-6 ${current.iconColor}`} />
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-accent-700 dark:text-accent-400">
                {current.highlightTarget}
              </div>
              <h3 className="text-lg font-display font-bold text-neutral-900 dark:text-darkmode-text-primary mt-0.5">
                {current.title}
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-darkmode-text-secondary leading-relaxed pl-1">
            {current.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep 
                    ? 'w-6 bg-primary-800 dark:bg-accent-400' 
                    : 'w-2 bg-neutral-200 dark:bg-neutral-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-darkmode-elevated/40 border-t border-neutral-200 dark:border-darkmode-border flex items-center justify-between">
          <button
            onClick={handleDismiss}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
          >
            Skip guide
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-darkmode-border text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-1.5 rounded-lg bg-primary-800 hover:bg-primary-900 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="px-4 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Got it! Start Exploring</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
