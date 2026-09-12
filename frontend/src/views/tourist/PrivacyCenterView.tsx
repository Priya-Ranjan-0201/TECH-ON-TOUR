import React from 'react';
import { Lock, Download, Trash2, ShieldCheck, EyeOff, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PrivacyCenterView() {
  const { travelTwin, resetTravelTwin } = useApp();

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(travelTwin, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "travelsathi_privacy_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-wider mb-1">
          <Lock className="w-4 h-4" />
          <span>User Data Rights & Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
          Privacy Center
        </h1>
        <p className="text-xs sm:text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
          Complete control over your location permissions, personalization inferences, and stored booking data.
        </p>
      </div>

      <div className="ts-card p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
          Active Data Permissions & Controls
        </h3>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">
                Precise GPS Location Access
              </p>
              <p className="text-neutral-muted">
                Used strictly during Live Trip Mode and SOS emergency dispatch. Never tracked in background.
              </p>
            </div>
            <span className="text-xs font-bold text-nature bg-nature-light px-3 py-1 rounded-full">
              Session Only
            </span>
          </div>

          <div className="p-4 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">
                AI Travel Twin Personalization Inferences
              </p>
              <p className="text-neutral-muted">
                Stores your preferred pacing, budget tier, and accessibility requirements to improve suggestions.
              </p>
            </div>
            <span className="text-xs font-bold text-brand bg-brand-50 px-3 py-1 rounded-full">
              Active
            </span>
          </div>

          <div className="p-4 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">
                Export All My Personal Data
              </p>
              <p className="text-neutral-muted">
                Download full data dump of all itineraries, saved places, and Travel Twin profile in standard JSON.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="btn-secondary !text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download My Data</span>
            </button>
          </div>

          <div className="p-4 rounded-ts-md bg-semantic-error/10 border border-semantic-error/30 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-semantic-sos">
                Permanently Delete All My Data
              </p>
              <p className="text-neutral-muted">
                Erase Travel Twin profile, reset all personalization, and delete search history.
              </p>
            </div>
            <button
              onClick={resetTravelTwin}
              className="btn-sos !text-xs font-bold flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All Data</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
