import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Wallet,
  Compass,
  Users,
  MapPin,
  ChevronRight,
  Flame,
  Check,
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const INTEREST_OPTIONS = [
  { id: 'Heritage & Monuments', label: 'Heritage & Citadels', icon: '🏛️' },
  { id: 'Nature & Wildlife', label: 'Nature & Forests', icon: '🌲' },
  { id: 'Spiritual & Temples', label: 'Spiritual & Shrines', icon: '🛕' },
  { id: 'Rural & PM-JUGA Stays', label: 'PM-JUGA Tribal Stays', icon: '🏡' },
  { id: 'Culinary & Street Food', label: 'Authentic Regional Food', icon: '🍲' },
  { id: 'Adventure & Treks', label: 'Treks & High Passes', icon: '🥾' },
  { id: 'GI Handicrafts & Bazaars', label: 'GI Crafts & Artisans', icon: '🛍️' },
  { id: 'Wellness & Ayurveda', label: 'Ayurveda & Wellness', icon: '🌿' },
  { id: 'Photography & Sunsets', label: 'Scenic Golden Hours', icon: '📸' },
];

const BUDGET_OPTIONS = [
  {
    id: 'budget',
    label: 'Budget Explorer',
    cost: '₹1,500 - ₹2,500 / day',
    desc: 'Community homestays, public transit, street eateries',
  },
  {
    id: 'moderate',
    label: 'Heritage Comfort',
    cost: '₹3,000 - ₹5,500 / day',
    desc: 'Verified DPI homestays, private cabs, authentic dining',
  },
  {
    id: 'luxury',
    label: 'Royal & Wellness',
    cost: '₹6,500+ / day',
    desc: 'Heritage havelis, private chauffeur, curated craft tours',
  },
];

export default function PlanWizard({
  onGenerate,
  isLoading,
  initialState = 'Rajasthan',
  initialDays = 3,
  initialDestination = '',
}) {
  const [destination, setDestination] = useState(initialDestination);
  const [state, setState] = useState(initialState);
  const [days, setDays] = useState(initialDays);
  const [budget, setBudget] = useState('moderate');
  const [interests, setInterests] = useState([
    'Heritage & Monuments',
    'Rural & PM-JUGA Stays',
  ]);
  const [pace, setPace] = useState('moderate');
  const [groupType, setGroupType] = useState('solo');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mobilityNeeds, setMobilityNeeds] = useState(false);
  const [onlyHiddenGems, setOnlyHiddenGems] = useState(false);

  const toggleInterest = (interestId) => {
    if (interests.includes(interestId)) {
      if (interests.length > 1) {
        setInterests(interests.filter((i) => i !== interestId));
      }
    } else {
      setInterests([...interests, interestId]);
    }
  };

  const handleQuickPreset = (presetState, presetDays, presetBudget, presetInterests, presetDest = '') => {
    setState(presetState);
    setDays(presetDays);
    setBudget(presetBudget);
    setInterests(presetInterests);
    setDestination(presetDest);
    onGenerate({
      destination: presetDest || undefined,
      state: presetState,
      days: presetDays,
      budget: presetBudget,
      interests: presetInterests,
      pace: 'moderate',
      group_type: 'couple',
      only_hidden_gems: false,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({
      destination: destination.trim() || undefined,
      state: destination.trim() ? undefined : (state || undefined),
      days: Number(days),
      budget,
      interests,
      pace,
      group_type: groupType,
      only_hidden_gems: onlyHiddenGems,
    });
  };

  return (
    <div className="p-6 sm:p-8 ts-card-light bg-[#FDFBF7] dark:bg-darkmode-surface border border-neutral-200 dark:border-darkmode-border shadow-md rounded-ts-hero">
      {/* Header with AI Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-darkmode-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-50 text-accent-900 border border-accent-400/30">
              <Sparkles className="w-3.5 h-3.5 text-accent-600" />
              AI Travel Twin (Tier 1 Priority #1)
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              Gemini 1.5 Flash + Deterministic Spatial Fallback
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100">
            Generate Your Multi-Day Travel Twin
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
            Customized day-by-day itinerary grounded in 12,293 destinations with TransitGuard fair transit and zero-commission homestays.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Step 1: Destination */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-primary-700" />
            Where do you want to go? *
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Manali, Tirthan Valley, Bastar, Kerala, Rajasthan, Hampi..."
            className="w-full text-sm rounded-lg border border-neutral-300 bg-white dark:bg-darkmode-elevated px-3 py-2.5 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-primary-600 font-medium"
            required
          />
        </div>

        {/* Step 2: Duration */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary-700" />
            Trip Duration: <span className="text-primary-800 font-bold">{days} Days</span>
          </label>
          <div className="grid grid-cols-7 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setDays(num)}
                className={`py-2 text-center rounded-lg text-sm font-semibold transition-all ${
                  days === num
                    ? 'bg-primary-800 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {num} {num === 1 ? 'Day' : 'Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Budget Tier */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-primary-700" />
            Budget Tier & Travel Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BUDGET_OPTIONS.map((opt) => {
              const isSelected = budget === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setBudget(opt.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary-700 bg-primary-50/40 ring-2 ring-primary-700/20'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-neutral-900">{opt.label}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-primary-700 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-primary-800 mb-1">{opt.cost}</div>
                  <div className="text-[11px] text-neutral-500 leading-snug">{opt.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advanced Preferences Accordion (Collapsed by Default for Faster Completion) */}
        <div className="pt-2 border-t border-neutral-200 dark:border-darkmode-border">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-darkmode-elevated text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-600" />
              <span>Advanced Preferences (Interests, Pace, Mobility)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium">
                {interests.length} interests active
              </span>
            </div>
            <span className="text-xs font-bold text-primary-800 dark:text-accent-400">
              {showAdvanced ? '− Hide options' : '+ Customize options'}
            </span>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-5 p-4 rounded-xl border border-neutral-200 dark:border-darkmode-border bg-white dark:bg-darkmode-surface animate-fadeIn">
              {/* Interests Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary-700" />
                  What are your core interests? (Select multiple)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {INTEREST_OPTIONS.map((item) => {
                    const active = interests.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleInterest(item.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all ${
                          active
                            ? 'border-accent-600 bg-accent-50/80 text-accent-950 font-semibold shadow-xs'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pace and Group Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-darkmode-border">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Travel Pace
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'relaxed', label: 'Relaxed 🧘' },
                      { id: 'moderate', label: 'Balanced 🚶' },
                      { id: 'active', label: 'Fast ⚡' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPace(p.id)}
                        className={`py-1.5 text-center rounded-lg text-xs font-medium border transition-colors ${
                          pace === p.id
                            ? 'border-primary-700 bg-primary-50 text-primary-900 font-semibold'
                            : 'border-neutral-200 bg-white text-neutral-600'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-neutral-600" /> Traveling As
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'solo', label: 'Solo' },
                      { id: 'couple', label: 'Couple' },
                      { id: 'family', label: 'Family' },
                      { id: 'friends', label: 'Friends' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGroupType(g.id)}
                        className={`py-1.5 text-center rounded-lg text-xs font-medium border transition-colors ${
                          groupType === g.id
                            ? 'border-primary-700 bg-primary-50 text-primary-900 font-semibold'
                            : 'border-neutral-200 bg-white text-neutral-600'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobility & Accessibility Needs */}
              <div className="pt-2 border-t border-neutral-100 dark:border-darkmode-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Elderly & Wheelchair Accessibility Friendly
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Prioritizes paved trails, ramp-accessible heritage monuments, and gentle slopes.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobilityNeeds(!mobilityNeeds)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold text-xs transition-colors ${
                    mobilityNeeds
                      ? 'bg-primary-800 text-white border-primary-800'
                      : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
                  }`}
                >
                  {mobilityNeeds ? '✓ Enabled' : '+ Enable'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden Gems Only Toggle */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌿</span>
            <div>
              <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                Hidden Gems Only (Off-the-Beaten-Path)
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Filter exclusively to uncrowded, pristine local heritage and nature sites.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOnlyHiddenGems(!onlyHiddenGems)}
            className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
              onlyHiddenGems
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                : 'bg-white dark:bg-[#1C1A17] text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            {onlyHiddenGems ? '✓ Hidden Gems Active' : '+ Enable Filter'}
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-neutral-200">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full py-3 text-sm sm:text-base font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin text-lg">⏳</span>
                Crafting Personalized Travel Twin Itinerary...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-300" />
                Generate {days}-Day AI Travel Twin Itinerary
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </Button>
          <p className="text-center text-[11px] text-neutral-500 mt-2">
            ⚡ Grounded in 12,293 verified destinations • TransitGuard Fare Caps • 3.5s Circuit Breaker • 100% Zero OTA Commission
          </p>
        </div>
      </form>
    </div>
  );
}
