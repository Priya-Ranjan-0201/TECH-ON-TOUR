import React, { useState } from 'react';
import {
  Wallet,
  ShieldCheck,
  Share2,
  Printer,
  Sparkles,
  CheckCircle2,
  HeartHandshake,
  TrendingDown,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function ItinerarySummaryCard({ itinerary, onOpenBooking }) {
  const [copied, setCopied] = useState(false);

  if (!itinerary || !itinerary.budget_breakdown) return null;

  const b = itinerary.budget_breakdown;

  const handleShare = () => {
    const url = `${window.location.origin}/plan?id=${itinerary.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card variant="default" className="p-6 bg-surface border border-neutral-200/80 shadow-md space-y-6">
      {/* Title & Engine Source */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Itinerary Financial & DPI Summary
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-900 font-mono">
            {itinerary.generation_source === 'gemini-1.5-flash' ? '✨ Gemini AI' : '⚡ Spatial Graph'}
          </span>
        </div>
        <h3 className="text-xl font-display font-bold text-primary-950">
          Estimated Trip Investment
        </h3>
      </div>

      {/* Cost Breakdown Grid */}
      <div className="space-y-3 pb-4 border-b border-neutral-200 text-xs">
        <div className="flex items-center justify-between text-neutral-700">
          <span>Verified Homestays / Stays ({itinerary.days} Nights)</span>
          <span className="font-bold text-neutral-900">
            ₹{b.accommodation_inr.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex items-center justify-between text-neutral-700">
          <span>Monuments & Activity Entry Fees</span>
          <span className="font-bold text-neutral-900">
            ₹{b.activities_inr.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex items-center justify-between text-neutral-700">
          <span>Authentic Regional Food & Dining</span>
          <span className="font-bold text-neutral-900">
            ₹{b.food_inr.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex items-center justify-between text-neutral-700">
          <span>Local Transit & Station Transfers</span>
          <span className="font-bold text-neutral-900">
            ₹{b.transit_inr.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Total Cost Row */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-dashed border-neutral-200 font-bold text-primary-950">
          <span>Total Estimated Investment</span>
          <span className="text-base text-primary-900">
            ₹{b.total_inr.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Zero Commission DPI Impact Callout */}
      <div className="p-4 rounded-xl bg-forest-50 border border-forest-200 space-y-2">
        <div className="flex items-center gap-2 text-forest-900 font-bold text-xs">
          <TrendingDown className="w-4 h-4 text-forest-700" />
          <span>Zero-Commission DPI Dividend</span>
        </div>
        <div className="text-lg font-bold text-forest-900">
          ₹{b.ota_commission_saved_inr.toLocaleString('en-IN')}{' '}
          <span className="text-xs font-normal text-forest-700">saved vs. Commercial OTAs</span>
        </div>
        <p className="text-[11px] text-forest-800 leading-relaxed">
          Traditional travel platforms siphon 15% to 30% commission. Under TravelSathi DPI, 97% of your funds flow straight to community homestay hosts and certified local guides via direct UPI settlement.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <Button
          type="button"
          variant="primary"
          onClick={() =>
            onOpenBooking({
              destination_name: itinerary.destination || itinerary.state,
              state: itinerary.state,
            })
          }
          className="w-full py-2.5 text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
        >
          <HeartHandshake className="w-4 h-4" />
          Direct Book Homestays on Itinerary (0% Fee)
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleShare}
            className="py-2 text-xs font-semibold flex items-center justify-center gap-1"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                Share UUID
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handlePrint}
            className="py-2 text-xs font-semibold flex items-center justify-center gap-1 text-neutral-700 border border-neutral-200"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </Button>
        </div>
      </div>
    </Card>
  );
}
