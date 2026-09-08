import React from 'react';
import { BarChart3, AlertTriangle, Users, MapPin } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function DMOView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="card-ts p-8 bg-gradient-to-r from-ivory to-primary-50/40 border-l-4 border-l-primary-800 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="alert">Phase 9 Target (B2G Pillar)</Badge>
          <span className="text-xs text-neutral-500 font-mono">Tourism Authority Command Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-900 mb-2">
          DMO Command Center & Anti-Overtourism Analytics
        </h1>
        <p className="text-sm text-neutral-600 max-w-2xl">
          Real-time visitor density monitoring, overtourism saturation indexes, and dynamic eco-permit throttling for state tourism boards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="glass" className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-alert-50 text-alert-800 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-primary-900 text-sm mb-1">Overtourism Saturation Alert</h3>
          <p className="text-xs text-neutral-600">
            Real-time alert engine warning authorities when Shimla or Manali footfall exceeds carrying capacity.
          </p>
        </Card>

        <Card variant="glass" className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-secondary-50 text-secondary-800 flex items-center justify-center mx-auto mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-primary-900 text-sm mb-1">Permit Gatekeeper Switch</h3>
          <p className="text-xs text-neutral-600">
            Administrative toggle diverting new itinerary queries to secondary cultural circuits (e.g. Jibhi, Tirthan).
          </p>
        </Card>

        <Card variant="glass" className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-accent-50 text-accent-800 flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-primary-900 text-sm mb-1">Regional Sentiment Radar</h3>
          <p className="text-xs text-neutral-600">
            NLP sentiment analytics aggregating tourist feedback across district heritage clusters.
          </p>
        </Card>
      </div>
    </div>
  );
}
