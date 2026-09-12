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
  Calendar,
  Leaf,
  MessageCircle,
  Send,
  Download,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useTranslation } from 'react-i18next';

export default function ItinerarySummaryCard({ itinerary, onOpenBooking, onOpenRFP }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!itinerary || !itinerary.budget_breakdown) return null;

  const b = itinerary.budget_breakdown;
  const eco = itinerary.eco_footprint;

  const handleShare = () => {
    const url = `${window.location.origin}/plan?id=${itinerary.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleWhatsAppShare = () => {
    const url = `${window.location.origin}/plan?id=${itinerary.id}`;
    const text = encodeURIComponent(
      `🗺️ Check out my ${itinerary.days}-Day TravelSathi Itinerary for ${itinerary.state}!\n` +
      `✨ Total Est.: ₹${b.total_inr.toLocaleString('en-IN')} (Saved ₹${b.ota_commission_saved_inr.toLocaleString('en-IN')} via Zero-Commission DPI)\n` +
      `🌱 Eco-Score: ${eco ? `${eco.carbon_saved_pct}% lower emissions` : 'Eco-Verified'}\n` +
      `👉 View full schedule: ${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleDownloadICS = () => {
    window.open(`/api/itinerary/${itinerary.id}/export/ics`, '_blank');
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
            {t('plan.financialSummary', 'Itinerary Financial & DPI Summary')}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-900 font-mono font-bold">
            {itinerary.generation_source === 'gemini-1.5-flash' ? '✨ Gemini AI' : '⚡ Spatial Graph'}
          </span>
        </div>
        <h3 className="text-xl font-display font-bold text-primary-950">
          {t('plan.financialSummary', 'Trip Investment & DPI Savings')}
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
          <span>TransitGuard Commute & Station Transfers</span>
          <span className="font-bold text-neutral-900">
            ₹{b.transit_inr.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Total Cost Row */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-dashed border-neutral-200 font-bold text-primary-950">
          <span>{t('plan.totalBudget', 'Total Estimated Investment')}</span>
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
          <span className="text-xs font-normal text-forest-700">{t('plan.otaSaved', 'saved vs. Commercial OTAs')}</span>
        </div>
        <p className="text-[11px] text-forest-800 leading-relaxed">
          Traditional platforms take 15% to 30% commission. Under TravelSathi DPI, 97% of payments flow straight to community homestay hosts and certified local guides via direct UPI settlement.
        </p>
      </div>

      {/* EcoFootprint & Sustainability Meter (Feature 11) */}
      {eco && (
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>EcoFootprint & Carbon Savings</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold">
              -{eco.carbon_saved_pct}% Carbon
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
              <span className="text-[10px] text-neutral-500 block">TravelSathi Footprint</span>
              <span className="font-bold text-emerald-900 text-sm">{eco.carbon_kg} kg CO₂e</span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
              <span className="text-[10px] text-neutral-500 block">Commercial Tour Avg</span>
              <span className="font-bold text-neutral-700 text-sm line-through decoration-red-400">
                {eco.commercial_tour_carbon_kg} kg CO₂e
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-1 border-t border-emerald-100">
            <span>🏅 Earned Eco-Tokens:</span>
            <span className="font-bold text-emerald-950">
              +{eco.eco_tokens_awarded} Tokens (GI Craft Discount)
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-1">
        {/* Direct Booking Button */}
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
          {t('plan.bookCircuit', 'Direct Book Homestays on Itinerary (0% Fee)')}
        </Button>

        {/* Broadcast as RFP to Local Hosts (Phase 6 Bridge) */}
        {onOpenRFP && (
          <Button
            type="button"
            variant="secondary"
            onClick={onOpenRFP}
            className="w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5 border border-forest-300 text-forest-900 bg-forest-50 hover:bg-forest-100"
          >
            <Send className="w-3.5 h-3.5 text-forest-700" />
            Broadcast Itinerary to Local Hosts (Get Direct Bids)
          </Button>
        )}

        {/* Secondary Utility Actions */}
        <div className="grid grid-cols-3 gap-2">
          {/* Calendar Export */}
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadICS}
            className="py-2 text-[11px] font-semibold flex items-center justify-center gap-1 text-neutral-800 hover:bg-neutral-50"
            title="Download iCal file for Google & Apple Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-primary-800" />
            Add to Cal
          </Button>

          {/* WhatsApp Share */}
          <Button
            type="button"
            variant="outline"
            onClick={handleWhatsAppShare}
            className="py-2 text-[11px] font-semibold flex items-center justify-center gap-1 text-neutral-800 hover:bg-neutral-50"
            title="Share via WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-forest-600" />
            WhatsApp
          </Button>

          {/* Share UUID / Print */}
          <Button
            type="button"
            variant="ghost"
            onClick={handleShare}
            className="py-2 text-[11px] font-semibold flex items-center justify-center gap-1 border border-neutral-200 text-neutral-700"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
                Copied
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
