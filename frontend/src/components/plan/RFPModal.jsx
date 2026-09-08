import React, { useState } from 'react';
import axios from 'axios';
import {
  X,
  Send,
  CheckCircle2,
  ShieldCheck,
  Users,
  IndianRupee,
  HeartHandshake,
  AlertCircle,
} from 'lucide-react';
import Button from '../ui/Button';

export default function RFPModal({ isOpen, onClose, itinerary }) {
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [isLoading, setIsLoading] = useState(false);
  const [rfpReceipt, setRfpReceipt] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !itinerary) return null;

  const totalBudget = itinerary.budget_breakdown?.total_inr || 10000;
  const hostShare = Math.round(totalBudget * 0.70);
  const guideShare = Math.round(totalBudget * 0.20);
  const transitShare = totalBudget - hostShare - guideShare;

  const handleBroadcastRFP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.post(`/api/itinerary/${itinerary.id}/rfp`, {
        target_budget_inr: totalBudget,
        traveler_notes: notes,
        contact_phone: phone,
      });
      setRfpReceipt(res.data);
    } catch (err) {
      console.error('Failed to broadcast RFP:', err);
      setError(err.response?.data?.detail || 'Failed to broadcast itinerary RFP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 bg-gradient-to-r from-forest-50 to-sand-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-forest-800 uppercase tracking-wider mb-1">
              <HeartHandshake className="w-3.5 h-3.5 text-forest-600" />
              Reverse Marketplace (Phase 6 Bridge)
            </div>
            <h3 className="text-lg font-display font-bold text-neutral-900">
              Broadcast Itinerary to Local Hosts
            </h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              Publish your schedule as a verified RFP. Verified community homestays and certified guides submit direct bids.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {rfpReceipt ? (
            <div className="py-6 text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 mx-auto rounded-full bg-forest-100 border-2 border-forest-300 flex items-center justify-center text-forest-700 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-forest-100 text-forest-900 border border-forest-300">
                  {rfpReceipt.rfp_id}
                </span>
                <h4 className="text-lg font-bold text-neutral-900 mt-3">
                  Itinerary Broadcast Active!
                </h4>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto mt-1 leading-relaxed">
                  Your {itinerary.days}-day itinerary has been transmitted to{' '}
                  <strong className="text-forest-800 font-bold">{rfpReceipt.eligible_hosts_alerted} verified homestays</strong> and{' '}
                  <strong className="text-forest-800 font-bold">{rfpReceipt.eligible_guides_alerted} certified guides</strong> in {itinerary.state}.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 text-left text-xs space-y-1.5 max-w-sm mx-auto font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Target Budget:</span>
                  <span className="font-bold text-neutral-900">₹{rfpReceipt.target_budget_inr.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Direct Host Share (70%):</span>
                  <span className="font-bold text-forest-700">₹{rfpReceipt.estimated_host_payout_inr.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Platform Commission:</span>
                  <span className="font-bold text-forest-700">₹0 (Zero Fee DPI)</span>
                </div>
              </div>

              <Button type="button" variant="primary" size="sm" onClick={onClose} className="px-6 py-2 text-xs">
                Done & Return to Itinerary
              </Button>
            </div>
          ) : (
            <form onSubmit={handleBroadcastRFP} className="space-y-4">
              {/* Split-Escrow Explainer */}
              <div className="p-3.5 rounded-xl bg-forest-50/70 border border-forest-200 text-xs space-y-2">
                <div className="font-bold text-forest-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-forest-700" />
                  <span>Fair Split-Payout Guarantee</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1 border-t border-forest-200/60">
                  <div className="bg-white/90 p-1.5 rounded-md border border-forest-100">
                    <span className="text-neutral-500 block text-[10px]">Host (70%)</span>
                    <span className="font-bold text-forest-900">₹{hostShare.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-white/90 p-1.5 rounded-md border border-forest-100">
                    <span className="text-neutral-500 block text-[10px]">Guide (20%)</span>
                    <span className="font-bold text-forest-900">₹{guideShare.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-white/90 p-1.5 rounded-md border border-forest-100">
                    <span className="text-neutral-500 block text-[10px]">Mobility (10%)</span>
                    <span className="font-bold text-forest-900">₹{transitShare.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Special Instructions or Cultural Preferences (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Prefer organic vegetarian home-cooked meals, quiet village atmosphere, female local guide for temple visits."
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Traveler Contact Mobile / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-forest-500 font-mono"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  className="w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 bg-forest-800 hover:bg-forest-900 text-white shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isLoading ? 'Broadcasting to District Registry...' : 'Broadcast RFP & Request Direct Bids'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
