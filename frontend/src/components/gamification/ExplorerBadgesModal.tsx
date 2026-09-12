import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Leaf, 
  ShieldCheck, 
  Heart, 
  X, 
  Share2, 
  Gift, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const INITIAL_BADGES = [
  {
    id: 'badge-hidden-gem',
    title: 'Hidden Gem Pioneer',
    icon: '🧭',
    tier: 'Gold',
    description: 'Visited or generated an itinerary for an anti-overtourism secondary circuit (e.g. Tirthan Valley & Jibhi).',
    ecoTokens: 450,
    unlocked: true,
    unlockedAt: 'Verified by Gatekeeper',
    reward: '₹200 Off Bastar Dhokra Bell-Metal Artifact'
  },
  {
    id: 'badge-eco-sathi',
    title: 'Eco-Sathi',
    icon: '🌿',
    tier: 'Emerald',
    description: 'Reduced travel emissions by >35% using local shared transit and verified eco-stays.',
    ecoTokens: 500,
    unlocked: true,
    unlockedAt: 'Calculated by EcoFootprint',
    reward: 'Free Organic Herbal Tea Pack at Tirthan Homestay'
  },
  {
    id: 'badge-dpi-ambassador',
    title: 'DPI Ambassador',
    icon: '⚡',
    tier: 'Platinum',
    description: 'Completed a 0% commission direct Split-UPI checkout, ensuring 97% reaches the local host.',
    ecoTokens: 300,
    unlocked: true,
    unlockedAt: 'Verified on UPI Nodal Rails',
    reward: 'Verified Traveler Digital Trust Credential'
  },
  {
    id: 'badge-tribal-patron',
    title: 'Tribal Culture Patron',
    icon: '🏡',
    tier: 'Ruby',
    description: 'Stayed with a certified PM-JUGA indigenous family in Bastar or Northeast India.',
    ecoTokens: 200,
    unlocked: false,
    unlockedAt: 'Requires 1 PM-JUGA Homestay Booking',
    reward: 'Hands-on Lost-Wax Metal Casting Workshop Pass'
  },
  {
    id: 'badge-verified-reviewer',
    title: 'Heritage Truth Guardian',
    icon: '🛡️',
    tier: 'Sapphire',
    description: 'Authored an authenticated review gated by a confirmed booking ID with DistilBERT NLP verification.',
    ecoTokens: 250,
    unlocked: true,
    unlockedAt: 'Verified against Booking ID #TS-UPI-8841',
    reward: 'Priority Community Host Booking Access'
  }
];

export default function ExplorerBadgesModal({ isOpen, onClose }) {
  const [badges, setBadges] = useState(() => {
    const saved = localStorage.getItem('travelsathi_badges');
    return saved ? JSON.parse(saved) : INITIAL_BADGES;
  });
  const [selectedBadge, setSelectedBadge] = useState(badges[0]);
  const [redeemedRewardToast, setRedeemedRewardToast] = useState<string | boolean>(false);

  useEffect(() => {
    localStorage.setItem('travelsathi_badges', JSON.stringify(badges));
  }, [badges]);

  if (!isOpen) return null;

  const totalTokens = badges.reduce((sum, b) => b.unlocked ? sum + b.ecoTokens : sum, 0);
  const unlockedCount = badges.filter(b => b.unlocked).length;

  const handleRedeem = (badge) => {
    setRedeemedRewardToast(`Coupon code generated: TS-ECO-${badge.title.replace(/\s+/g, '').toUpperCase()}`);
    setTimeout(() => setRedeemedRewardToast(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#FDFBF7] dark:bg-[#1A1816] rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#712B13] via-[#8C3618] to-[#4A1B0C] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-200 shadow-inner">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-display font-bold">Digital Explorer Badges</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E5A93C] text-neutral-950 uppercase tracking-wider">
                  Phase 10 Gamification
                </span>
              </div>
              <p className="text-xs text-amber-100/80 mt-0.5">
                Earn verified credentials by discovering hidden gems & supporting zero-commission rural tourism.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Eco-Token Balance Bar */}
        <div className="px-6 py-3 bg-[#E5A93C]/15 dark:bg-[#E5A93C]/10 border-b border-[#E5A93C]/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E5A93C]" />
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Total Eco-Tokens Earned:</span>
            <strong className="text-sm font-extrabold text-[#712B13] dark:text-[#E5A93C]">
              {totalTokens.toLocaleString()} Eco-Tokens
            </strong>
          </div>
          <span className="font-bold text-neutral-500">
            {unlockedCount} of {badges.length} Badges Unlocked
          </span>
        </div>

        {/* Toast */}
        {redeemedRewardToast && (
          <div className="mx-6 mt-3 p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{redeemedRewardToast} — Applied to direct artisan checkout!</span>
          </div>
        )}

        {/* Main Content: Badges Grid & Selected Detail */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Badge Chips Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map(badge => (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedBadge.id === badge.id
                    ? 'bg-amber-50/80 dark:bg-amber-950/20 border-[#E5A93C] shadow-sm'
                    : badge.unlocked
                    ? 'bg-white dark:bg-[#221F1C] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    : 'bg-neutral-100/50 dark:bg-neutral-900/30 border-dashed border-neutral-300 dark:border-neutral-800 opacity-60'
                }`}
              >
                <div className="text-2xl p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 shrink-0">
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                      {badge.title}
                    </h4>
                    {badge.unlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-neutral-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-[#E5A93C] block mt-0.5">
                    +{badge.ecoTokens} Tokens • {badge.tier}
                  </span>
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Badge Inspector Card */}
          {selectedBadge && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#221F1C] border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedBadge.icon}</span>
                  <div>
                    <h4 className="font-bold text-base text-neutral-900 dark:text-white">
                      {selectedBadge.title}
                    </h4>
                    <span className="text-xs text-neutral-500">
                      {selectedBadge.unlocked ? `Unlocked: ${selectedBadge.unlockedAt}` : `Locked: ${selectedBadge.unlockedAt}`}
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E5A93C]/20 text-[#712B13] dark:text-[#E5A93C] border border-[#E5A93C]/40">
                  {selectedBadge.tier} Tier
                </span>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {selectedBadge.description}
              </p>

              {/* Reward Box */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-emerald-800 dark:text-emerald-400 block">
                      GI Artisan & Homestay Perk:
                    </span>
                    <span className="font-bold text-emerald-950 dark:text-emerald-200">
                      {selectedBadge.reward}
                    </span>
                  </div>
                </div>

                {selectedBadge.unlocked && (
                  <button
                    onClick={() => handleRedeem(selectedBadge)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 shadow-2xs cursor-pointer"
                  >
                    Claim Perk
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
          <span className="text-neutral-500">
            Backed by India Post & Tribal Cooperative Marketing Development Federation (TRIFED).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
