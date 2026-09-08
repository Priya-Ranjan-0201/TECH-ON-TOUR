import React from 'react';
import { MapPin, Search, Sparkles } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function ExploreView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="card-ts p-8 bg-gradient-to-r from-ivory to-primary-50/40 border-l-4 border-l-primary-800 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="verified">Phase 4 Target</Badge>
          <span className="text-xs text-neutral-500 font-mono">12,293 Grounded POIs Ready</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-900 mb-2">
          Explore 12k Verified Indian Destinations
        </h1>
        <p className="text-sm text-neutral-600 max-w-2xl">
          Search, filter, and discover authentic heritage sites, monuments, PM-JUGA tribal homestays, and regional nature wonders across all 36 States & Union Territories.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="glass" className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-primary-900 text-sm mb-1">State & Category Filter</h3>
          <p className="text-xs text-neutral-600">
            Interactive multi-faceted filter across 36 States/UTs and categories (Attractions, Hotels, Homestays).
          </p>
        </Card>

        <Card variant="glass" className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-secondary-50 text-secondary-800 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-primary-900 text-sm mb-1">Leaflet.js Spatial Map</h3>
          <p className="text-xs text-neutral-600">
            Interactive OpenStreetMap canvas pinning verified POIs with high-speed radius queries.
          </p>
        </Card>

        <Card variant="glass" className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-accent-50 text-accent-800 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-primary-900 text-sm mb-1">Direct Zero-Fee Booking</h3>
          <p className="text-xs text-neutral-600">
            Razorpay sandbox integration with multi-vendor UPI split intent URLs.
          </p>
        </Card>
      </div>
    </div>
  );
}
