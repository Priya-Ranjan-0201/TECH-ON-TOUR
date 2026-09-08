import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  Hotel, 
  Bot, 
  TrendingUp, 
  Leaf, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Landmark,
  Layers,
  PhoneCall
} from 'lucide-react';
import axios from 'axios';

export default function App() {
  const [backendStatus, setBackendStatus] = useState({ checking: true, online: false, data: null });

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/health', { timeout: 3000 });
        setBackendStatus({ checking: false, online: true, data: response.data });
      } catch (err) {
        setBackendStatus({ checking: false, online: false, data: null });
      }
    };
    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* 🏛️ Top Header Bar — Theme 1 Terracotta Core */}
      <header className="bg-primary-800 text-ivory border-b border-primary-900/30 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-ts bg-accent-400/20 flex items-center justify-center border border-accent-400/40">
              <Compass className="w-6 h-6 text-accent-400 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xl font-display font-bold tracking-tight text-ivory">
                Travel<span className="text-accent-400">Sathi</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs bg-accent-400/20 text-accent-50 px-2 py-0.5 rounded-full border border-accent-400/30">
                National DPI Platform
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Backend Health Status Pill */}
            <div className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full border ${
              backendStatus.online 
                ? 'bg-secondary-50 text-secondary-900 border-secondary-800/30' 
                : 'bg-alert-50 text-alert-800 border-alert-600/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${backendStatus.online ? 'bg-secondary-800 animate-pulse' : 'bg-alert-600'}`} />
              <span>
                {backendStatus.checking ? 'Connecting Backend...' : backendStatus.online ? 'FastAPI Gateway Active' : 'Backend Offline (:8000)'}
              </span>
            </div>

            <button className="bg-accent-400 hover:bg-accent-600 text-neutral-900 font-semibold text-xs sm:text-sm px-4 py-2 rounded-ts transition-colors shadow-sm">
              SIH 2026 Jury Mode
            </button>
          </div>
        </div>
      </header>

      {/* 🌟 Policy & DPI Alignment Strip */}
      <div className="bg-ivory border-b border-neutral-200 py-2.5 px-4 overflow-x-auto text-xs text-neutral-600">
        <div className="max-w-7xl mx-auto flex items-center space-x-6 whitespace-nowrap">
          <span className="font-semibold text-primary-900 flex items-center gap-1">
            <Landmark className="w-3.5 h-3.5 text-primary-800" /> Strategic DPI Alignment:
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-50 text-secondary-800 border border-secondary-800/20 font-medium">
            <CheckCircle2 className="w-3 h-3 text-secondary-800" /> Swadesh Darshan 2.0
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-50 text-secondary-800 border border-secondary-800/20 font-medium">
            <CheckCircle2 className="w-3 h-3 text-secondary-800" /> PM-JUGA Tribal Homestays
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-50 text-accent-900 border border-accent-800/20 font-medium">
            <CheckCircle2 className="w-3 h-3 text-accent-800" /> PM-Vikas Handicraft GI
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-800 border border-primary-800/20 font-medium">
            <CheckCircle2 className="w-3 h-3 text-primary-800" /> Bhashini Speech APIs
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-800 border border-primary-800/20 font-medium">
            <CheckCircle2 className="w-3 h-3 text-primary-800" /> ONDC & Split-UPI
          </span>
        </div>
      </div>

      {/* 🚀 Hero Section / Phase 0 Scaffolding Verification */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Phase 0 Confirmation Banner */}
        <div className="card-ts p-6 mb-8 border-l-4 border-l-primary-800 bg-gradient-to-r from-ivory to-primary-50/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge-verified-ts">Phase 0 Complete</span>
                <span className="text-xs font-mono text-neutral-600">Theme 1: Heritage Earth Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-900">
                AI-Powered Unified Tourism Revival Platform & DPI Ecosystem
              </h1>
              <p className="text-sm text-neutral-600 mt-1 max-w-3xl">
                Scaffolding verified: React 19 + Vite frontend coupled with FastAPI backend, PostGIS spatial models, and 12,293 pre-grounded Indian destinations from Tech-On-Tour.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href="http://localhost:8000/docs" 
                target="_blank" 
                rel="noreferrer"
                className="btn-primary-ts text-sm inline-flex items-center gap-2"
              >
                Swagger /docs <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* 🎯 3-Tier Hackathon Execution Blueprint Cards */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-display font-bold text-primary-900">
                Hackathon Execution Matrix (What & How)
              </h2>
              <p className="text-xs text-neutral-600">
                Prioritized 3-tier roadmap with 15-18h core loop focus and zero-risk offline fallbacks.
              </p>
            </div>
            <span className="text-xs bg-accent-50 text-accent-900 px-3 py-1 rounded-full font-semibold border border-accent-400/30">
              Golden Rule: Working Tier 1 Beats Broken Tier 1+2+3
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TIER 1 CARD */}
            <div className="card-ts p-5 border-t-4 border-t-primary-800 relative flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-800 bg-primary-50 px-2.5 py-1 rounded">
                  Tier 1: Must Build
                </span>
                <span className="text-xs font-semibold text-neutral-600">~70% Time (15-18h)</span>
              </div>
              <h3 className="text-base font-bold text-primary-900 mb-2">Core Live Demo Loop</h3>
              <p className="text-xs text-neutral-600 mb-4">
                The entire 270-second live jury pitch depends on these 5 features running seamlessly without latency.
              </p>
              <ul className="text-xs space-y-2.5 text-neutral-700 flex-1">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary-800 shrink-0 mt-0.5" />
                  <span><strong>AI Itinerary Generator:</strong> Gemini 1.5 Flash structured JSON + multi-day timeline UI.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Hotel className="w-4 h-4 text-primary-800 shrink-0 mt-0.5" />
                  <span><strong>Direct Booking Engine:</strong> 12k destinations search + Razorpay test checkout.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Bot className="w-4 h-4 text-primary-800 shrink-0 mt-0.5" />
                  <span><strong>Concierge Chatbot:</strong> Native Hindi/English conversational travel assistant.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary-800 shrink-0 mt-0.5" />
                  <span><strong>Review Trust Layer:</strong> Offline pre-computed DistilBERT sentiment (0ms lag on stage).</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-800 shrink-0 mt-0.5" />
                  <span><strong>Host Hub & Pricing:</strong> Calendarific festival/weekend +15% rule-based co-pilot.</span>
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-neutral-200 flex justify-between items-center text-xs font-semibold text-primary-800">
                <span>Phase 1-8 Implementation</span>
                <span className="badge-verified-ts">Priority #1</span>
              </div>
            </div>

            {/* TIER 2 CARD */}
            <div className="card-ts p-5 border-t-4 border-t-secondary-800 relative flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary-800 bg-secondary-50 px-2.5 py-1 rounded">
                  Tier 2: Should Build
                </span>
                <span className="text-xs font-semibold text-neutral-600">~10-14 Hours</span>
              </div>
              <h3 className="text-base font-bold text-primary-900 mb-2">High-Impact Wow Factor</h3>
              <p className="text-xs text-neutral-600 mb-4">
                Built strictly in sequential order (6 → 10) once Tier 1 core loop is verified and stable.
              </p>
              <ul className="text-xs space-y-2.5 text-neutral-700 flex-1">
                <li className="flex items-start gap-2">
                  <Compass className="w-4 h-4 text-secondary-800 shrink-0 mt-0.5" />
                  <span><strong>Anti-Overtourism Gems:</strong> "Instead of X, try Y (60% less crowded)" cards.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-secondary-800 shrink-0 mt-0.5" />
                  <span><strong>Safety Score Map:</strong> Normalized 0-100 NCRB/OpenCity risk rating badges.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-secondary-800 shrink-0 mt-0.5" />
                  <span><strong>Weather Itinerary:</strong> Live OpenWeatherMap injection into itinerary planner.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-secondary-800 shrink-0 mt-0.5" />
                  <span><strong>AR Heritage Lens:</strong> Camera scan → bottom-sheet historical narration + TTS.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Leaf className="w-4 h-4 text-secondary-800 shrink-0 mt-0.5" />
                  <span><strong>Explorer Badges:</strong> Gamified eco-tokens for offbeat and homestay stays.</span>
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-neutral-200 flex justify-between items-center text-xs font-semibold text-secondary-800">
                <span>Phase 9-10 Implementation</span>
                <span className="badge-gem-ts">Sequence Guard</span>
              </div>
            </div>

            {/* TIER 3 CARD */}
            <div className="card-ts p-5 border-t-4 border-t-accent-600 relative flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-accent-800 bg-accent-50 px-2.5 py-1 rounded">
                  Tier 3: Roadmap Only
                </span>
                <span className="text-xs font-semibold text-neutral-600">Pitch Deck Slides</span>
              </div>
              <h3 className="text-base font-bold text-primary-900 mb-2">Architected Future Scope</h3>
              <p className="text-xs text-neutral-600 mb-4">
                Fully designed and architected in the master blueprint, presented on slides to protect build time.
              </p>
              <ul className="text-xs space-y-2.5 text-neutral-700 flex-1">
                <li className="flex items-start gap-2">
                  <PhoneCall className="w-4 h-4 text-accent-800 shrink-0 mt-0.5" />
                  <span><strong>IndicVoice IVR:</strong> Twilio + Whisper + Bhashini acoustic transfer architecture.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Layers className="w-4 h-4 text-accent-800 shrink-0 mt-0.5" />
                  <span><strong>Govt Analytics:</strong> Static single-page with 2-3 pre-rendered Chart.js charts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent-800 shrink-0 mt-0.5" />
                  <span><strong>DigiLocker eKYC:</strong> Sandbox-ready architecture & verified badge mockups.</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-accent-800 shrink-0 mt-0.5" />
                  <span><strong>Group Trip Split:</strong> Multi-traveler shared itinerary voting.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Landmark className="w-4 h-4 text-accent-800 shrink-0 mt-0.5" />
                  <span><strong>ONDC Protocol:</strong> Beckn-enabled nationwide hospitality federation.</span>
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-neutral-200 flex justify-between items-center text-xs font-semibold text-accent-800">
                <span>Track B Roadmap (Phases 12-14)</span>
                <span className="badge-pricing-ts">Pitch Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 Dataset & System Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="card-ts p-4 text-center">
            <div className="text-2xl font-display font-bold text-primary-800">12,293</div>
            <div className="text-xs text-neutral-600 mt-1">Verified Destinations</div>
            <div className="text-[10px] text-secondary-800 mt-0.5 font-semibold">Tech-On-Tour Grounded</div>
          </div>
          <div className="card-ts p-4 text-center">
            <div className="text-2xl font-display font-bold text-primary-800">36 / 36</div>
            <div className="text-xs text-neutral-600 mt-1">States & UTs Covered</div>
            <div className="text-[10px] text-secondary-800 mt-0.5 font-semibold">100% Geographic Reach</div>
          </div>
          <div className="card-ts p-4 text-center">
            <div className="text-2xl font-display font-bold text-primary-800">0%</div>
            <div className="text-xs text-neutral-600 mt-1">Platform Commission</div>
            <div className="text-[10px] text-accent-800 mt-0.5 font-semibold">vs. 15-30% on OTAs</div>
          </div>
          <div className="card-ts p-4 text-center">
            <div className="text-2xl font-display font-bold text-primary-800">4.0s</div>
            <div className="text-xs text-neutral-600 mt-1">Circuit Breaker Guard</div>
            <div className="text-[10px] text-secondary-800 mt-0.5 font-semibold">Zero-Fail Live Demos</div>
          </div>
        </div>

        {/* 🎨 Theme 1 Visual Token Ramp Inspection */}
        <div className="card-ts p-6">
          <h3 className="text-sm font-bold text-primary-900 uppercase tracking-wider mb-3">
            Theme 1: Heritage Earth Visual Design System Token Verification
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
            <div className="p-3 rounded-ts bg-primary-800 text-ivory text-center font-medium">
              Terracotta<br/><span className="text-[10px] opacity-80">#712B13</span>
            </div>
            <div className="p-3 rounded-ts bg-secondary-800 text-ivory text-center font-medium">
              Forest Green<br/><span className="text-[10px] opacity-80">#27500A</span>
            </div>
            <div className="p-3 rounded-ts bg-accent-400 text-neutral-900 text-center font-medium">
              Temple Gold<br/><span className="text-[10px] opacity-80">#E5A93C</span>
            </div>
            <div className="p-3 rounded-ts bg-saffron text-ivory text-center font-medium">
              Deep Saffron<br/><span className="text-[10px] opacity-80">#FF6F00</span>
            </div>
            <div className="p-3 rounded-ts bg-neutral-50 text-neutral-900 border border-neutral-200 text-center font-medium">
              Warm Ivory<br/><span className="text-[10px] opacity-80">#FDFBF7</span>
            </div>
            <div className="p-3 rounded-ts bg-neutral-900 text-ivory text-center font-medium">
              Charcoal Slate<br/><span className="text-[10px] opacity-80">#2C2C2A</span>
            </div>
          </div>
        </div>
      </main>

      {/* 🦶 Footer */}
      <footer className="bg-ivory border-t border-neutral-200 py-6 mt-12 text-center text-xs text-neutral-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 TravelSathi Team — Smart India Hackathon Grand Finale Prototype.</p>
          <p className="flex items-center gap-2">
            <span>Built strictly under</span>
            <code className="bg-neutral-200 text-neutral-900 px-1.5 py-0.5 rounded text-[11px]">Rules.md</code>
            <span>and</span>
            <code className="bg-neutral-200 text-neutral-900 px-1.5 py-0.5 rounded text-[11px]">Design.md</code>
          </p>
        </div>
      </footer>
    </div>
  );
}
