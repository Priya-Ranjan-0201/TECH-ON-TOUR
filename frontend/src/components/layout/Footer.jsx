import React from 'react';
import { Compass, Landmark, ShieldCheck, PhoneCall, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ivory border-t border-neutral-200 mt-auto pt-10 pb-8 text-neutral-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-2">
              <Compass className="w-5 h-5 text-primary-800" />
              <span className="text-base font-display font-bold text-primary-900">
                Travel<span className="text-accent-600">Sathi</span>
              </span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              India's unified Digital Public Infrastructure (DPI) for tourism revival, commission elimination, and vernacular empowerment.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary-50 text-secondary-900 border border-secondary-800/30 rounded-full font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary-800" /> 0% Platform Commission
            </div>
          </div>

          {/* Strategic National Alignment */}
          <div>
            <h4 className="font-display font-bold text-primary-900 text-sm mb-3 uppercase tracking-wider">
              National DPI Policy
            </h4>
            <ul className="space-y-1.5">
              <li className="hover:text-primary-800 transition-colors cursor-pointer">• Swadesh Darshan 2.0</li>
              <li className="hover:text-primary-800 transition-colors cursor-pointer">• PM-JUGA Tribal Homestays</li>
              <li className="hover:text-primary-800 transition-colors cursor-pointer">• PM-Vikas Handicraft GI Tag</li>
              <li className="hover:text-primary-800 transition-colors cursor-pointer">• Bhashini Speech & Translation</li>
              <li className="hover:text-primary-800 transition-colors cursor-pointer">• ONDC Hospitality Federation</li>
            </ul>
          </div>

          {/* Emergency Helplines & Safety */}
          <div>
            <h4 className="font-display font-bold text-primary-900 text-sm mb-3 uppercase tracking-wider">
              Tourist Helplines
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-alert-600" />
                <span>National Emergency: <strong className="text-neutral-900">112</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-primary-800" />
                <span>Incredible India Helpline: <strong className="text-neutral-900">1363</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-secondary-800" />
                <span>Women Helpline: <strong className="text-neutral-900">1091</strong></span>
              </li>
            </ul>
          </div>

          {/* Architecture Guardrails */}
          <div>
            <h4 className="font-display font-bold text-primary-900 text-sm mb-3 uppercase tracking-wider">
              System Engineering
            </h4>
            <p className="text-[11px] leading-relaxed text-neutral-600 mb-2">
              FastAPI + PostgreSQL PostGIS + Google Gemini 1.5 Flash + React 19 + Theme 1: Heritage Earth visual design system.
            </p>
            <div className="text-[11px] font-mono bg-neutral-100 p-2 rounded border border-neutral-200 text-neutral-700">
              12,293 Destinations Grounded<br />
              36 States & UTs Covered
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-500">
          <p>© 2026 TravelSathi DPI Initiative — Smart India Hackathon (SIH) National Grand Finale.</p>
          <p className="flex items-center gap-1">
            <span>Engineered with pride for India</span>
            <Heart className="w-3 h-3 text-alert-600 fill-alert-600" />
          </p>
        </div>
      </div>
    </footer>
  );
}
