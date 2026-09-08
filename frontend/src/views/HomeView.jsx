import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Landmark, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Hotel, 
  Bot, 
  TrendingUp, 
  Compass, 
  Leaf, 
  Eye, 
  Calendar,
  Layers,
  PhoneCall,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import HeroFallback2D from '../components/home/HeroFallback2D';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function HomeView() {
  const navigate = useNavigate();
  const [homestays, setHomestays] = useState([]);
  const [circuits, setCircuits] = useState([]);

  useEffect(() => {
    // Fetch PM-JUGA tribal homestays
    const fetchHomestays = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/homestays?tribal_only=true&limit=4', { timeout: 3000 });
        if (res.data && res.data.results) {
          setHomestays(res.data.results);
        }
      } catch (err) {
        console.warn('Homestays API unavailable, using offline cache');
      }
    };

    // Fetch anti-overtourism circuits
    const fetchCircuits = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/anti-overtourism/alternatives', { timeout: 3000 });
        if (res.data && res.data.circuits) {
          setCircuits(res.data.circuits.slice(0, 4));
        }
      } catch (err) {
        console.warn('Circuits API unavailable');
      }
    };

    fetchHomestays();
    fetchCircuits();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 2D Heritage Hero Fallback */}
      <HeroFallback2D />

      {/* 🏛️ Strategic DPI Policy Alignment Strip */}
      <div className="bg-ivory border-b border-neutral-200 py-3 px-4 shadow-sm overflow-x-auto text-xs text-neutral-700">
        <div className="max-w-7xl mx-auto flex items-center space-x-6 whitespace-nowrap">
          <span className="font-bold text-primary-900 flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-primary-800" /> Strategic DPI Alignment:
          </span>
          <span className="badge-verified-ts inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary-800" /> Swadesh Darshan 2.0
          </span>
          <span className="badge-verified-ts inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary-800" /> PM-JUGA Tribal Homestays
          </span>
          <span className="badge-pricing-ts inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-800" /> PM-Vikas Handicraft GI
          </span>
          <span className="badge-verified-ts inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary-800" /> Bhashini Speech APIs
          </span>
          <span className="badge-verified-ts inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary-800" /> ONDC & Split-UPI Checkout
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14 w-full">
        
        {/* 🔀 Section: Anti-Overtourism Alternate Circuits */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge-gem-ts">Eco-Tourism Solution</span>
                <span className="text-xs text-neutral-500 font-medium">Mitigating the 80/20 Tourism Congestion Paradox</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-primary-900">
                Anti-Overtourism Hidden Gem Alternatives
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/explore')}
              icon={ArrowRight}
            >
              Browse All 12k POIs
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(circuits.length > 0 ? circuits : [
              { popular_name: "Manali", alternative_name: "Tirthan Valley", crowd_reduction_pct: 65, alternative_state: "Himachal Pradesh", reason: "Trout rivers, pine homestays, zero traffic." },
              { popular_name: "Shimla", alternative_name: "Chail", crowd_reduction_pct: 70, alternative_state: "Himachal Pradesh", reason: "Deodar walks, historic palace, 70% fewer tourists." },
              { popular_name: "Ooty", alternative_name: "Valparai", crowd_reduction_pct: 75, alternative_state: "Tamil Nadu", reason: "Pristine Anamalai tea estates, zero plastic." },
              { popular_name: "Agra", alternative_name: "Orchha", crowd_reduction_pct: 80, alternative_state: "Madhya Pradesh", reason: "16th-century Bundela cenotaphs along Betwa river." }
            ]).map((c, idx) => (
              <Card key={idx} variant="glass" hover className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-neutral-500 line-through">
                      {c.popular_name}
                    </span>
                    <span className="badge-gem-ts text-[11px] font-bold">
                      -{c.crowd_reduction_pct}% Crowd
                    </span>
                  </div>

                  <h3 className="text-base font-display font-bold text-primary-900 mb-1">
                    {c.alternative_name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-primary-800 font-medium mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{c.alternative_state}</span>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
                    {c.reason}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200/60 flex items-center justify-between text-xs">
                  <span className="text-secondary-800 font-bold">Eco-Verified</span>
                  <button 
                    onClick={() => navigate(`/explore?search=${encodeURIComponent(c.alternative_name)}`)}
                    className="text-primary-800 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    Explore <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 🏡 Section: PM-JUGA Certified Tribal Homestays */}
        <section className="bg-primary-50/40 rounded-ts p-6 sm:p-8 border border-primary-800/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge-verified-ts">PM-JUGA Scheme</span>
                <span className="text-xs text-neutral-600 font-medium">100% Commission-Free Direct Bookings</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-primary-900">
                Verified Tribal Homestays (PM-JUGA)
              </h2>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/host')}
              icon={ShieldCheck}
            >
              Host Registration Portal
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(homestays.length > 0 ? homestays : [
              {
                homestay_id: "demo-1",
                title: "Bastar Dhokra Craft & Forest Homestay",
                district: "Bastar",
                state: "Chhattisgarh",
                base_price_inr: 1250,
                sanitation_trust_score: 94,
                amenities: "Solar Powered, Private Washroom, Bastar Thali",
                image_url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&auto=format&fit=crop"
              },
              {
                homestay_id: "demo-2",
                title: "Anegundi Kishkindha Rural Heritage Stay",
                district: "Koppal",
                state: "Karnataka",
                base_price_inr: 1600,
                sanitation_trust_score: 95,
                amenities: "Bicycle Rental, Traditional Courtyard, Mango Grove",
                image_url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop"
              },
              {
                homestay_id: "demo-3",
                title: "Spiti Valley High Altitude Mud Retreat",
                district: "Lahaul and Spiti",
                state: "Himachal Pradesh",
                base_price_inr: 1800,
                sanitation_trust_score: 89,
                amenities: "Heated Bukhari, Tibetan Kitchen, Stargazing",
                image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop"
              }
            ]).map((h) => (
              <Card key={h.homestay_id} variant="default" hover className="overflow-hidden flex flex-col">
                <div className="h-44 relative overflow-hidden bg-neutral-200">
                  <img 
                    src={h.image_url} 
                    alt={h.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="badge-verified-ts text-[10px] shadow-sm">
                      {h.sanitation_trust_score}% Clean Score
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-primary-900/80 text-ivory text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
                      PM-JUGA Tribal Host
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-primary-900 line-clamp-1 mb-1">
                      {h.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mb-2">
                      {h.district}, {h.state}
                    </p>
                    <p className="text-xs text-neutral-600 line-clamp-2 mb-3">
                      {h.amenities}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-primary-800">₹{h.base_price_inr}</span>
                      <span className="text-[10px] text-neutral-500"> / night</span>
                    </div>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => navigate('/explore?category=homestay')}
                    >
                      Book Direct
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 🎯 Section: 3-Tier Hackathon Execution Matrix */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge-pricing-ts font-mono">SIH 2026 Core Delivery</span>
                <span className="text-xs text-neutral-500">Time-boxed engineering priority</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-primary-900">
                Hackathon Execution Matrix (What & How)
              </h2>
            </div>
            <span className="text-xs bg-accent-50 text-accent-900 px-3 py-1 rounded-full font-bold border border-accent-400/30">
              Golden Rule: Working Tier 1 Beats Broken Tier 1+2+3
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TIER 1 */}
            <Card variant="primary" className="p-5 border-t-4 border-t-primary-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-800 bg-primary-100/60 px-2 py-0.5 rounded">
                  Tier 1: Must Build
                </span>
                <span className="text-xs font-bold text-primary-900">15–18h (70% Time)</span>
              </div>
              <h3 className="text-base font-bold text-primary-900 mb-2">Core Live Demo Loop</h3>
              <p className="text-xs text-neutral-600 mb-4">
                The entire 270s live jury pitch depends on these 5 features running seamlessly without latency.
              </p>
              <ul className="text-xs space-y-2 text-neutral-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-800 shrink-0" />
                  <span>1. AI Itinerary Generator (Travel Twin)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-800 shrink-0" />
                  <span>2. 12k Catalog Search & Direct Booking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-800 shrink-0" />
                  <span>3. AI Multilingual Concierge Chatbot</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-800 shrink-0" />
                  <span>4. Review Trust Layer (DistilBERT SST-2)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-800 shrink-0" />
                  <span>5. Host Hub & Pricing Co-Pilot</span>
                </li>
              </ul>
            </Card>

            {/* TIER 2 */}
            <Card variant="default" className="p-5 border-t-4 border-t-secondary-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary-800 bg-secondary-50 px-2 py-0.5 rounded">
                  Tier 2: Should Build
                </span>
                <span className="text-xs font-bold text-secondary-900">10–14 Hours</span>
              </div>
              <h3 className="text-base font-bold text-primary-900 mb-2">High-Impact Wow Factor</h3>
              <p className="text-xs text-neutral-600 mb-4">
                Built strictly in sequential order (6 → 10) once Tier 1 core loop is verified and stable.
              </p>
              <ul className="text-xs space-y-2 text-neutral-700">
                <li className="flex items-center gap-2">
                  <Leaf className="w-3.5 h-3.5 text-secondary-800 shrink-0" />
                  <span>6. Anti-Overtourism Hidden Gems</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-secondary-800 shrink-0" />
                  <span>7. Safety Score Map Layer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-secondary-800 shrink-0" />
                  <span>8. Weather-Adaptive Itinerary Adjustment</span>
                </li>
                <li className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-secondary-800 shrink-0" />
                  <span>9. AR Heritage Lens (Info-Card + TTS)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-secondary-800 shrink-0" />
                  <span>10. Explorer Badges & Eco-Tokens</span>
                </li>
              </ul>
            </Card>

            {/* TIER 3 */}
            <Card variant="default" className="p-5 border-t-4 border-t-accent-600">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-accent-800 bg-accent-50 px-2 py-0.5 rounded">
                  Tier 3: Roadmap
                </span>
                <span className="text-xs font-bold text-accent-900">Pitch Slides</span>
              </div>
              <h3 className="text-base font-bold text-primary-900 mb-2">Architected Future Scope</h3>
              <p className="text-xs text-neutral-600 mb-4">
                Fully designed and architected in the master blueprint, presented on slides to protect build time.
              </p>
              <ul className="text-xs space-y-2 text-neutral-700">
                <li className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-accent-800 shrink-0" />
                  <span>11. IndicVoice IVR (Telephony + Whisper)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-accent-800 shrink-0" />
                  <span>12. Govt Analytics Dashboard (Chart.js)</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent-800 shrink-0" />
                  <span>13. DigiLocker eKYC Sandbox Integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-accent-800 shrink-0" />
                  <span>14. Group Trip Split & Shared Voting</span>
                </li>
                <li className="flex items-center gap-2">
                  <Landmark className="w-3.5 h-3.5 text-accent-800 shrink-0" />
                  <span>15. Blockchain Ledger & ONDC Protocol</span>
                </li>
              </ul>
            </Card>
          </div>
        </section>

      </main>
    </div>
  );
}
