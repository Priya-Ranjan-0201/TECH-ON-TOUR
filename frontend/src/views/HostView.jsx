import React from 'react';
import { ShieldCheck, TrendingUp, DollarSign } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function HostView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="card-ts p-8 bg-gradient-to-r from-ivory to-secondary-50/40 border-l-4 border-l-secondary-800 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="verified">Phase 6 Target</Badge>
          <span className="text-xs text-neutral-500 font-mono">PM-JUGA Tribal Empowerment Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-900 mb-2">
          Host Hub & PM-JUGA Reverse Marketplace
        </h1>
        <p className="text-sm text-neutral-600 max-w-2xl">
          Zero-commission listing and direct booking management for rural homestay hosts, local guides, and community operators.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="glass" className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-secondary-50 text-secondary-800 flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-primary-900 text-sm mb-1">0% Commission Payouts</h3>
          <p className="text-xs text-neutral-600">
            Hosts retain 97%–100% of room tariffs instead of surrendering 15%–30% to commercial OTAs.
          </p>
        </Card>

        <Card variant="glass" className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-accent-50 text-accent-800 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-primary-900 text-sm mb-1">AI Dynamic Pricing Co-Pilot</h3>
          <p className="text-xs text-neutral-600">
            Calendarific festival & weekend rule-based pricing alerts suggest +15% revenue opportunities.
          </p>
        </Card>

        <Card variant="glass" className="p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-primary-900 text-sm mb-1">Vision Sanitation Verification</h3>
          <p className="text-xs text-neutral-600">
            Automated room video inspection generates verified cleanliness badges for homestays.
          </p>
        </Card>
      </div>
    </div>
  );
}
