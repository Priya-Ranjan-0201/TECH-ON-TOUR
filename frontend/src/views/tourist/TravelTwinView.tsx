import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  RotateCcw, 
  Lock, 
  Trash2, 
  Download, 
  Eye, 
  EyeOff, 
  Check, 
  Heart, 
  MapPin, 
  Coffee, 
  Compass,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TravelTwinView() {
  const { travelTwin, updateTravelTwin, resetTravelTwin, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('twin'); // 'twin' | 'privacy'
  const [saveToast, setSaveToast] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form local state
  const [style, setStyle] = useState(travelTwin.travelStyle);
  const [budget, setBudget] = useState(travelTwin.budgetTier);
  const [stay, setStay] = useState(travelTwin.preferredStay);
  const [food, setFood] = useState(travelTwin.foodPreference);
  const [pace, setPace] = useState(travelTwin.pace);
  const [accessibility, setAccessibility] = useState(travelTwin.accessibilityRequirements);
  const [personalization, setPersonalization] = useState(travelTwin.personalizationActive);

  // Load preferences from SQLite on mount
  useEffect(() => {
    const userId = currentUser?.id || 'usr-901';
    axios.get(`/api/user/preferences?user_id=${encodeURIComponent(userId)}`)
      .then(res => {
        if (res.data && res.data.preferences) {
          const p = res.data.preferences;
          if (p.travel_style) setStyle(p.travel_style);
          if (p.budget_tier) setBudget(p.budget_tier);
          if (p.preferred_stay) setStay(p.preferred_stay);
          if (p.food_preference) setFood(p.food_preference);
          const paceVal = p.preferred_pace || p.pace;
          if (paceVal) setPace(paceVal);
          if (p.accessibility_requirements) setAccessibility(p.accessibility_requirements);
          if (typeof p.personalization_active === 'boolean') setPersonalization(p.personalization_active);
          
          updateTravelTwin({
            travelStyle: p.travel_style || travelTwin.travelStyle,
            budgetTier: p.budget_tier || travelTwin.budgetTier,
            preferredStay: p.preferred_stay || travelTwin.preferredStay,
            foodPreference: p.food_preference || travelTwin.foodPreference,
            pace: paceVal || travelTwin.pace,
            accessibilityRequirements: p.accessibility_requirements || travelTwin.accessibilityRequirements,
            personalizationActive: p.personalization_active ?? travelTwin.personalizationActive
          });
        }
      })
      .catch(err => {
        console.warn('Could not load backend preferences:', err.message);
      });
  }, [currentUser?.id]);

  const handlePreferenceChange = async (field: string, value: any) => {
    // 1. Update local state
    if (field === 'style') setStyle(value);
    else if (field === 'budget') setBudget(value);
    else if (field === 'stay') setStay(value);
    else if (field === 'food') setFood(value);
    else if (field === 'pace') setPace(value);
    else if (field === 'accessibility') setAccessibility(value);
    else if (field === 'personalization') setPersonalization(value);

    // 2. Immediate React Context synchronization for same-session re-renders
    const updatedTwin = {
      travelStyle: field === 'style' ? value : style,
      budgetTier: field === 'budget' ? value : budget,
      preferredStay: field === 'stay' ? value : stay,
      foodPreference: field === 'food' ? value : food,
      pace: field === 'pace' ? value : pace,
      accessibilityRequirements: field === 'accessibility' ? value : accessibility,
      personalizationActive: field === 'personalization' ? value : personalization
    };
    updateTravelTwin(updatedTwin);

    // 3. Persist immediately to database via PATCH /api/users/{id}/preferences
    const userId = currentUser?.id || 'usr-901';
    try {
      await axios.patch(`/api/users/${encodeURIComponent(userId)}/preferences`, {
        user_id: userId,
        travel_style: updatedTwin.travelStyle,
        budget_tier: updatedTwin.budgetTier,
        budget: updatedTwin.budgetTier,
        preferred_stay: updatedTwin.preferredStay,
        accommodation: updatedTwin.preferredStay,
        food_preference: updatedTwin.foodPreference,
        pace: updatedTwin.pace,
        preferred_pace: updatedTwin.pace,
        accessibility_requirements: updatedTwin.accessibilityRequirements,
        personalization_active: updatedTwin.personalizationActive
      });
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } catch (err) {
      try {
        await axios.patch('/api/user/preferences', {
          user_id: userId,
          travel_style: updatedTwin.travelStyle,
          budget_tier: updatedTwin.budgetTier,
          budget: updatedTwin.budgetTier,
          preferred_stay: updatedTwin.preferredStay,
          accommodation: updatedTwin.preferredStay,
          food_preference: updatedTwin.foodPreference,
          pace: updatedTwin.pace,
          preferred_pace: updatedTwin.pace,
          accessibility_requirements: updatedTwin.accessibilityRequirements,
          personalization_active: updatedTwin.personalizationActive
        });
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 3000);
      } catch (fallbackErr) {
        console.warn('Preferences PATCH notice:', fallbackErr);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const userId = currentUser?.id || 'usr-901';
    
    // 1. Update React context immediately
    updateTravelTwin({
      travelStyle: style,
      budgetTier: budget,
      preferredStay: stay,
      foodPreference: food,
      pace,
      accessibilityRequirements: accessibility,
      personalizationActive: personalization
    });

    // Immediate optimistic user feedback toast
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 5000);

    // 2. Persist directly to SQLite database
    try {
      await axios.patch(`/api/users/${encodeURIComponent(userId)}/preferences`, {
        user_id: userId,
        travel_style: style,
        budget_tier: budget,
        preferred_stay: stay,
        accommodation: stay,
        food_preference: food,
        pace: pace,
        preferred_pace: pace,
        accessibility_requirements: accessibility,
        personalization_active: personalization
      });
    } catch (err) {
      try {
        await axios.post('/api/user/preferences', {
          user_id: userId,
          travel_style: style,
          budget_tier: budget,
          preferred_stay: stay,
          food_preference: food,
          pace: pace,
          accessibility_requirements: accessibility,
          personalization_active: personalization
        });
      } catch (e2) {
        console.warn('Backend preferences sync notice:', e2);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(travelTwin, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "travelsathi_travel_twin_profile.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div>
          <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-brand" />
            <span>Autonomous Personalization Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            My AI Travel Twin
          </h1>
          <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
            Your personal digital travel surrogate that learns your pace, comfort, accessibility, and local support values.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-neutral-card dark:bg-darkmode-surface border border-neutral-border dark:border-darkmode-border rounded-ts-sm p-1">
          <button
            onClick={() => setActiveTab('twin')}
            className={`px-4 py-2 rounded text-xs font-bold transition-colors ${
              activeTab === 'twin'
                ? 'bg-brand text-white shadow-sm'
                : 'text-neutral-text-sec dark:text-darkmode-text-secondary hover:text-brand'
            }`}
          >
            Preferences & Twin
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-brand text-white shadow-sm'
                : 'text-neutral-text-sec dark:text-darkmode-text-secondary hover:text-brand'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Transparency & Privacy</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-nature-light text-nature border border-nature/30 rounded-ts-md text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>Travel Twin preferences successfully saved and calibrated.</span>
        </div>
      )}

      {activeTab === 'twin' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form: Preferences Config */}
          <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handleSave} className="ts-card p-6 sm:p-8 space-y-6">
              
              <div className="border-b border-neutral-border dark:border-darkmode-border pb-4">
                <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  Calibrate Your Travel Twin
                </h3>
                <p className="text-xs text-neutral-muted">
                  These settings shape every AI itinerary generation, hotel alternative, and route recommendation.
                </p>
              </div>

              {/* Travel Style */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  Primary Travel Style
                </label>
                <select
                  value={style}
                  onChange={(e) => handlePreferenceChange('style', e.target.value)}
                  className="w-full p-3 rounded-ts-sm bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border font-semibold text-neutral-text-primary dark:text-darkmode-text-primary outline-none"
                >
                  <option value="Nature & Slow Travel">Nature & Slow Travel (Rivers, Valleys, Mindful Walks)</option>
                  <option value="Living Heritage & Arts">Living Heritage & Arts (Monuments, Crafts, Architecture)</option>
                  <option value="Tribal & Rural Immersion">Tribal & Rural Immersion (PM-JUGA Homestays, Farm Stays)</option>
                  <option value="Spiritual & Wellness">Spiritual & Wellness (Ayurveda, Yoga, Sacred Ghats)</option>
                  <option value="Himalayan Adventure">Himalayan Adventure (High Altitudes, Treks, Mountain Passes)</option>
                </select>
              </div>

              {/* Budget Tier */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  Preferred Budget Tier
                </label>
                <select
                  value={budget}
                  onChange={(e) => handlePreferenceChange('budget', e.target.value)}
                  className="w-full p-3 rounded-ts-sm bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border font-semibold text-neutral-text-primary dark:text-darkmode-text-primary outline-none"
                >
                  <option value="Budget (₹1,500 - ₹2,500/day)">Budget (₹1,500 - ₹2,500/day)</option>
                  <option value="Moderate (₹2,500 - ₹4,000/day)">Moderate (₹2,500 - ₹4,000/day)</option>
                  <option value="Premium (₹5,000+/day)">Premium (₹5,000+/day)</option>
                </select>
              </div>

              {/* Preferred Accommodation */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  Preferred Accommodation
                </label>
                <select
                  value={stay}
                  onChange={(e) => handlePreferenceChange('stay', e.target.value)}
                  className="w-full p-3 rounded-ts-sm bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border font-semibold text-neutral-text-primary dark:text-darkmode-text-primary outline-none"
                >
                  <option value="Verified Eco-Homestays & Heritage Havelis">Verified Eco-Homestays & Heritage Havelis</option>
                  <option value="PM-JUGA Tribal Homestays (Direct Community Revenue)">PM-JUGA Tribal Homestays (Direct Community Revenue)</option>
                  <option value="Organic Spice Farm Cottages">Organic Spice Farm Cottages</option>
                  <option value="Standard Verified Hotels">Standard Verified Hotels</option>
                </select>
              </div>

              {/* Food & Pace */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                    Food Preferences
                  </label>
                  <select
                    value={food}
                    onChange={(e) => handlePreferenceChange('food', e.target.value)}
                    className="w-full p-3 rounded-ts-sm bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-semibold"
                  >
                    <option value="Vegetarian Friendly & Regional Organic">Vegetarian Friendly & Regional Organic</option>
                    <option value="Pure Vegetarian (Jain Friendly Available)">Pure Vegetarian (Jain Friendly Available)</option>
                    <option value="Regional Non-Vegetarian & Seafood">Regional Non-Vegetarian & Seafood</option>
                    <option value="No Restrictions / Omnivore">No Restrictions / Omnivore</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                    Preferred Daily Pace
                  </label>
                  <select
                    value={pace}
                    onChange={(e) => handlePreferenceChange('pace', e.target.value)}
                    className="w-full p-3 rounded-ts-sm bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-semibold"
                  >
                    <option value="Unrushed / Mindful">Unrushed / Mindful (Max 2 key stops per day)</option>
                    <option value="Balanced Explorer">Balanced Explorer (3 - 4 stops per day)</option>
                    <option value="Intensive Sightseeing">Intensive Sightseeing (Maximum POIs)</option>
                  </select>
                </div>
              </div>

              {/* Accessibility */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                  Accessibility & Mobility Requirements
                </label>
                <input
                  type="text"
                  value={accessibility}
                  onChange={(e) => handlePreferenceChange('accessibility', e.target.value)}
                  placeholder="e.g. Wheelchair ramp, ground floor room, no steep stairs"
                  className="w-full p-3 rounded-ts-sm bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-semibold text-neutral-text-primary dark:text-darkmode-text-primary outline-none"
                />
              </div>

              {/* Save CTA */}
              <div className="pt-2 flex justify-end">
                <button type="submit" className="btn-brand px-6 py-3 text-xs font-bold">
                  Save & Calibrate Travel Twin
                </button>
              </div>

            </form>
          </div>

          {/* Right 4 Cols: "What Does TravelSathi Know About Me?" */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="ai-surface p-6 space-y-4 border-2 border-brand/30 shadow-md">
              <div className="flex items-center gap-2 text-brand font-bold text-sm">
                <Sparkles className="w-4 h-4 text-brand" />
                <span>What Does TravelSathi Know About Me?</span>
              </div>

              <p className="text-xs text-ai-text dark:text-darkmode-text-secondary leading-relaxed">
                We practice transparent, privacy-first AI. Here are the active inferences shaping your travel recommendations:
              </p>

              <div className="space-y-2.5 text-xs text-ai-text dark:text-darkmode-text-primary">
                <div className="p-2.5 rounded bg-white/70 dark:bg-darkmode-elevated border border-brand/20">
                  <span className="font-bold block text-neutral-muted text-[10px]">ACTIVE TRAVEL STYLE</span>
                  <span>{style.includes('Heritage') ? 'Prioritizes historic monuments, living crafts & architectural marvels.' : style.includes('Tribal') ? 'Focuses on indigenous culture, PM-JUGA tribal homestays, and community immersion.' : style.includes('Spiritual') ? 'Focuses on sacred shrines, tranquil ghats, and wellness circuits.' : style.includes('Adventure') ? 'High-altitude trails, mountain passes, and active expeditions.' : 'Prefers uncrowded nature, mindful river walks, and low-density landscapes.'}</span>
                </div>

                <div className="p-2.5 rounded bg-white/70 dark:bg-darkmode-elevated border border-brand/20">
                  <span className="font-bold block text-neutral-muted text-[10px]">LODGING & IMPACT</span>
                  <span>{stay || 'Verified Eco-Homestays & Heritage Havelis'} • {budget}</span>
                </div>

                <div className="p-2.5 rounded bg-white/70 dark:bg-darkmode-elevated border border-brand/20">
                  <span className="font-bold block text-neutral-muted text-[10px]">PACE & DIETARY FOCUS</span>
                  <span>{pace} • {food}</span>
                </div>

                <div className="p-2.5 rounded bg-white/70 dark:bg-darkmode-elevated border border-brand/20">
                  <span className="font-bold block text-neutral-muted text-[10px]">MOBILITY & ACCESSIBILITY</span>
                  <span>{accessibility && accessibility.trim() ? accessibility : 'Standard trail access and comfortable mobility profile.'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('privacy')}
                  className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
                >
                  <span>Manage Privacy & Data Retention</span>
                  <span>→</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* Privacy & Transparency Controls Tab (Section 15 & 60) */
        <div className="max-w-3xl mx-auto ts-card p-6 sm:p-8 space-y-6">
          <div className="border-b border-neutral-border dark:border-darkmode-border pb-4">
            <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand" />
              <span>Transparent Privacy & Data Ownership</span>
            </h3>
            <p className="text-xs text-neutral-muted mt-1">
              Your travel preferences belong to you. We never sell your personal data to third-party ad networks or commercial brokers.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Toggle Personalization */}
            <div className="p-4 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">
                  Personalized AI Recommendations
                </p>
                <p className="text-neutral-muted">
                  Allow Travel Twin to tailor itineraries based on past trips and saved places.
                </p>
              </div>
              <button
                onClick={() => setPersonalization(!personalization)}
                className={`px-4 py-2 rounded-ts-sm text-xs font-bold transition-colors ${
                  personalization
                    ? 'bg-nature text-white'
                    : 'bg-neutral-disabled text-white'
                }`}
              >
                {personalization ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Download Data */}
            <div className="p-4 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">
                  Download My Travel Twin Data
                </p>
                <p className="text-neutral-muted">
                  Export all your learned preferences, booking history, and saved circuits in JSON format.
                </p>
              </div>
              <button
                onClick={handleDownloadData}
                className="btn-secondary !text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Reset Travel Twin */}
            <div className="p-4 rounded-ts-md bg-semantic-error/10 border border-semantic-error/30 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-semantic-sos">
                  Reset Travel Twin History
                </p>
                <p className="text-neutral-muted">
                  Permanently wipe all learned preferences, taste inferences, and personalization history.
                </p>
              </div>
              <button
                onClick={resetTravelTwin}
                className="btn-sos !bg-semantic-sos !text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset All History</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
