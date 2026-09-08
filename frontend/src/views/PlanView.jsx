import React from 'react';
import { Calendar, Sparkles, CloudRain, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function PlanView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="card-ts p-8 bg-gradient-to-r from-ivory to-accent-50/40 border-l-4 border-l-accent-400 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="pricing">Phase 5 Target (Tier 1 Priority #1)</Badge>
          <span className="text-xs text-neutral-500 font-mono">Gemini 1.5 Flash + Weather RAG</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-900 mb-2">
          AI Travel Twin Itinerary Planner
        </h1>
        <p className="text-sm text-neutral-600 max-w-2xl">
          Enter your destination, budget, duration, and interests to generate a structured, weather-aware day-by-day travel plan rendered on an interactive timeline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="glass" className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-accent-50 text-accent-800 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-primary-900 text-sm mb-1">Structured JSON Generation</h3>
          <p className="text-xs text-neutral-600">
            Guaranteed valid JSON schema with time slots, stops, entry fees, and transit recommendations.
          </p>
        </Card>

        <Card variant="glass" className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-secondary-50 text-secondary-800 flex items-center justify-center mx-auto mb-3">
            <CloudRain className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-primary-900 text-sm mb-1">Weather-Aware Prompts</h3>
          <p className="text-xs text-neutral-600">
            Real-time OpenWeatherMap data dynamically shifts plans to indoor museums on rainy days.
          </p>
        </Card>

        <Card variant="glass" className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-primary-900 text-sm mb-1">3.5s Circuit Breaker</h3>
          <p className="text-xs text-neutral-600">
            Deterministic graph itinerary fallback guarantees instant response on venue WiFi.
          </p>
        </Card>
      </div>
    </div>
  );
}
