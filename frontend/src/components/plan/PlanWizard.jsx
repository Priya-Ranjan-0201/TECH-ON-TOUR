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
}) {
  const [destination, setDestination] = useState('');
  const [state, setState] = useState(initialState);
  const [days, setDays] = useState(initialDays);
  const [budget, setBudget] = useState('moderate');
  const [interests, setInterests] = useState([
    'Heritage & Monuments',
    'Rural & PM-JUGA Stays',
  ]);
  const [pace, setPace] = useState('moderate');
  const [groupType, setGroupType] = useState('solo');

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
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({
      destination: destination.trim() || undefined,
      state: state || 'Rajasthan',
      days: parseInt(days, 10),
      budget,
      interests,
      pace,
      group_type: groupType,
    });
  };

  return (
    <Card variant="default" className="p-6 sm:p-8 bg-surface border border-neutral-200/80 shadow-md">
      {/* Header with AI Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-100 text-accent-900">
              <Sparkles className="w-3.5 h-3.5 text-accent-700" />
              AI Travel Twin (Tier 1 Priority #1)
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              Gemini 1.5 Flash + Deterministic Spatial Fallback
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-primary-900">
            Generate Your Multi-Day Travel Twin
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600">
            Customized day-by-day itinerary grounded in 12,293 destinations with TransitGuard fair transit and zero-commission homestays.
          </p>
        </div>

        {/* Quick Demo Showcase Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-accent-600" /> Quick Presets:
          </span>
          <button
            type="button"
            onClick={() =>
              handleQuickPreset(
                'Rajasthan',
                3,
                'moderate',
                ['Heritage & Monuments', 'Culinary & Street Food', 'Rural & PM-JUGA Stays'],
                'Jaipur & Amer'
              )
            }
            className="text-xs px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 font-medium transition-colors"
          >
            🏰 Rajasthan (3D)
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickPreset(
                'Himachal Pradesh',
                4,
                'budget',
                ['Nature & Wildlife', 'Rural & PM-JUGA Stays', 'Adventure & Treks'],
                'Tirthan Valley'
              )
            }
            className="text-xs px-2.5 py-1 rounded-md bg-forest-50 text-forest-900 border border-forest-200 hover:bg-forest-100 font-medium transition-colors"
          >
            🌲 Himachal (4D)
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickPreset(
                'Kerala',
                3,
                'luxury',
                ['Spiritual & Temples', 'Culinary & Street Food', 'Wellness & Ayurveda'],
                'Alleppey & Fort Kochi'
              )
            }
            className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 font-medium transition-colors"
          >
            🌴 Kerala (3D)
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickPreset(
                'Uttar Pradesh',
                2,
                'moderate',
                ['Spiritual & Temples', 'Culinary & Street Food', 'Heritage & Monuments'],
                'Varanasi'
              )
            }
            className="text-xs px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100 font-medium transition-colors"
          >
            🛕 Varanasi (2D)
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickPreset(
                'Goa',
                3,
                'moderate',
                ['Nature & Wildlife', 'Culinary & Street Food', 'Heritage & Monuments'],
                'Old Goa & Panaji'
              )
            }
            className="text-xs px-2.5 py-1 rounded-md bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100 font-medium transition-colors"
          >
            🏖️ Goa (3D)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Step 1: Destination and State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary-700" />
              State / Union Territory *
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full text-sm rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-primary-600"
              required
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-primary-700" />
              Specific City, Valley or Landmark (Optional)
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Manali, Jaipur, Hampi, Fort Kochi, Bastar..."
              className="w-full text-sm rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-primary-600"
            />
          </div>
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

        {/* Step 4: Interests Multi-Select */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
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

        {/* Step 5: Pace and Group Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
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
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1">
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
    </Card>
  );
}
