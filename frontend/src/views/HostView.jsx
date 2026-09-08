import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Sparkles, 
  Calendar, 
  Send, 
  CheckCircle2, 
  Users, 
  Clock, 
  MapPin, 
  ArrowRight,
  ChevronRight,
  Filter,
  Check,
  Building,
  HeartHandshake
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function HostView() {
  const [dashboardData, setDashboardData] = useState(null);
  const [rfps, setRfps] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('All');
  
  // Dynamic Pricing State
  const [pricingState, setPricingState] = useState('Chhattisgarh');
  const [pricingData, setPricingData] = useState(null);
  const [isApplyingPricing, setIsApplyingPricing] = useState(false);
  const [pricingAppliedMsg, setPricingAppliedMsg] = useState('');

  // Bid Modal State
  const [activeRfpForBid, setActiveRfpForBid] = useState(null);
  const [bidAmount, setBidAmount] = useState(3800);
  const [bidInclusions, setBidInclusions] = useState('3 Nights Homestay + Chulha Cooked Organic Breakfast + Guided Village Walk');
  const [bidMessage, setBidMessage] = useState('Warm greetings! We would be delighted to host you in our traditional tribal cottage.');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [bidSuccessNotice, setBidSuccessNotice] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    fetchDashboard();
    fetchPricing('Chhattisgarh');
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/host/dashboard?host_id=host-bastar-01&state=Chhattisgarh');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
        setRfps(data.open_rfps_in_district || []);
        setMyBids(data.my_active_bids || []);
      }
    } catch (err) {
      console.error('Error fetching host dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricing = async (state) => {
    try {
      const res = await fetch(`/api/host/pricing-recommendation?state=${encodeURIComponent(state)}&base_tariff=1650`);
      if (res.ok) {
        const data = await res.json();
        setPricingData(data);
      }
    } catch (err) {
      console.error('Error fetching pricing:', err);
    }
  };

  const handleStatePricingChange = (e) => {
    const newState = e.target.value;
    setPricingState(newState);
    fetchPricing(newState);
  };

  const handleApplyPricing = async () => {
    if (!pricingData) return;
    setIsApplyingPricing(true);
    setPricingAppliedMsg('');
    try {
      const res = await fetch('/api/host/pricing/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_id: 'host-bastar-01',
          state: pricingState,
          new_tariff_inr: pricingData.recommended_tariff_inr
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPricingAppliedMsg(data.message);
        setTimeout(() => setPricingAppliedMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsApplyingPricing(false);
    }
  };

  const handleOpenBidModal = (rfp) => {
    setActiveRfpForBid(rfp);
    setBidAmount(Math.round(rfp.target_budget_inr * 0.9)); // Suggest competitive quote
    setBidInclusions(`${rfp.days} Nights Stay + Chulha Cooked Organic Meals + Traditional Craft Workshop`);
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    if (!activeRfpForBid) return;
    setIsSubmittingBid(true);

    try {
      const res = await fetch('/api/marketplace/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfp_id: activeRfpForBid.id,
          host_id: 'host-bastar-01',
          host_name: 'Mangal Mandavi',
          homestay_name: 'Bastar Dhokra Craft & Forest Homestay',
          bid_amount_inr: Number(bidAmount),
          inclusions: bidInclusions,
          message: bidMessage
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBidSuccessNotice(`Bid of ₹${bidAmount} submitted! 97% host direct payout guaranteed.`);
        // Add to local bids list
        setMyBids((prev) => [
          {
            id: data.bid_id,
            rfp_id: activeRfpForBid.id,
            bid_amount_inr: Number(bidAmount),
            inclusions: bidInclusions,
            status: 'submitted',
            created_at: new Date().toISOString()
          },
          ...prev
        ]);
        setActiveRfpForBid(null);
        setTimeout(() => setBidSuccessNotice(''), 5000);
      }
    } catch (err) {
      console.error('Failed to submit bid:', err);
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleSimulateAcceptance = async (bidId) => {
    try {
      const res = await fetch(`/api/marketplace/bid/${bidId}/accept`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setMyBids((prev) =>
          prev.map((b) => (b.id === bidId ? { ...b, status: 'accepted' } : b))
        );
        setBidSuccessNotice(`🎉 Bid accepted by traveler! Booking reference: ${data.booking_ref}. ₹${data.platform_commission_saved_inr} saved in OTA commission!`);
        setTimeout(() => setBidSuccessNotice(''), 6000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRfps = selectedState === 'All' 
    ? rfps 
    : rfps.filter(r => r.state.toLowerCase().includes(selectedState.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="card-ts p-6 sm:p-8 bg-gradient-to-r from-ivory via-secondary-50/40 to-ivory border-l-4 border-l-secondary-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="verified">PM-JUGA Tribal Certified</Badge>
              <span className="text-xs text-secondary-800 font-bold bg-secondary-50 px-2 py-0.5 rounded border border-secondary-800/20">
                0% OTA Commission DPI
              </span>
              <span className="text-xs text-neutral-500 font-mono">Host ID: host-bastar-01</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-900 leading-tight">
              Host Hub & Reverse Marketplace
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl mt-1">
              Direct booking management, instant tourist lead bidding, and AI dynamic tariff optimization for rural & indigenous homestay operators.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-ivory/80 backdrop-blur p-3 rounded-ts border border-neutral-200 shadow-sm shrink-0">
            <div className="w-10 h-10 rounded-full bg-secondary-100 text-secondary-800 flex items-center justify-center font-bold">
              MM
            </div>
            <div className="text-xs">
              <div className="font-bold text-primary-900">Mangal Mandavi</div>
              <div className="text-neutral-500">Bastar, Chhattisgarh</div>
              <div className="text-[10px] text-secondary-800 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-secondary-800" /> 96% Vision Audited Cleanliness
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Success Notice */}
      {bidSuccessNotice && (
        <div className="p-4 bg-secondary-50 border border-secondary-800/30 rounded-ts text-xs font-bold text-secondary-900 flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-secondary-800 shrink-0" />
          <span>{bidSuccessNotice}</span>
        </div>
      )}

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card variant="glass" className="p-5 border-l-4 border-l-primary-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Gross Revenue</span>
            <div className="p-2 rounded-full bg-primary-50 text-primary-800">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-primary-900">
            ₹{dashboardData?.financial_metrics?.gross_revenue_inr?.toLocaleString() || '48,600'}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            24 completed authentic stays
          </div>
        </Card>

        <Card variant="glass" className="p-5 border-l-4 border-l-secondary-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-secondary-800 uppercase tracking-wider">0% OTA Commission Saved</span>
            <div className="p-2 rounded-full bg-secondary-50 text-secondary-800">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-secondary-800">
            +₹{dashboardData?.financial_metrics?.ota_commission_saved_inr?.toLocaleString() || '10,692'}
          </div>
          <div className="text-[11px] text-secondary-800 font-semibold mt-1">
            Retained 100% in family bank account
          </div>
        </Card>

        <Card variant="glass" className="p-5 border-l-4 border-l-accent-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active Bookings</span>
            <div className="p-2 rounded-full bg-accent-50 text-accent-800">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-accent-900">
            {dashboardData?.financial_metrics?.active_bookings_count || 6} Stays
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            All confirmed via Split-UPI
          </div>
        </Card>

        <Card variant="glass" className="p-5 border-l-4 border-l-secondary-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Sanitation Trust Score</span>
            <div className="p-2 rounded-full bg-secondary-50 text-secondary-800">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-primary-900">
            {dashboardData?.host_profile?.sanitation_trust_score || 96}/100
          </div>
          <div className="text-[11px] text-secondary-800 font-semibold mt-1">
            Vision Audited Cleanliness
          </div>
        </Card>

      </div>

      {/* AI Dynamic Pricing Co-Pilot Card */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-850 to-primary-900 text-ivory rounded-ts p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 rounded-full bg-accent-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent-400" />
              <h3 className="font-display font-bold text-lg text-ivory">
                AI Dynamic Pricing Co-Pilot
              </h3>
              <span className="badge-gold-ts text-[10px] py-0.5">
                Indian Festival Calendar Heuristic
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-ivory/70">Analyze State Demand:</span>
              <select
                value={pricingState}
                onChange={handleStatePricingChange}
                className="bg-primary-950 text-ivory border border-primary-700 rounded-ts px-2 py-1 text-xs focus:outline-none"
              >
                <option value="Chhattisgarh">Chhattisgarh (Bastar Dussehra)</option>
                <option value="Rajasthan">Rajasthan (Pushkar / Diwali)</option>
                <option value="Himachal Pradesh">Himachal Pradesh (Spring / Dussehra)</option>
                <option value="Gujarat">Gujarat (Rann Utsav)</option>
                <option value="Nagaland">Nagaland (Hornbill Festival)</option>
              </select>
            </div>
          </div>

          {pricingData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              
              <div className="lg:col-span-2 space-y-3">
                <div className="p-3.5 bg-primary-950/60 rounded-ts border border-primary-800 text-xs space-y-1.5">
                  <div className="text-accent-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-accent-400" />
                    Demand Catalyst Detected:
                  </div>
                  <p className="text-ivory/90 leading-relaxed">
                    {pricingData.demand_driver}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 bg-primary-950/40 rounded-ts border border-primary-800/80">
                    <div className="text-ivory/60 text-[11px]">Current Base Tariff</div>
                    <div className="text-base font-bold text-ivory mt-0.5">₹{pricingData.current_base_tariff_inr}/night</div>
                  </div>
                  <div className="p-3 bg-secondary-900/60 rounded-ts border border-secondary-700/80">
                    <div className="text-secondary-300 text-[11px]">Recommended Tariff</div>
                    <div className="text-base font-bold text-secondary-300 mt-0.5">
                      ₹{pricingData.recommended_tariff_inr}/night (+{pricingData.surge_percentage}%)
                    </div>
                  </div>
                  <div className="p-3 bg-accent-950/50 rounded-ts border border-accent-800/60">
                    <div className="text-accent-300 text-[11px]">Est. Monthly Gain</div>
                    <div className="text-base font-bold text-accent-300 mt-0.5">
                      +₹{pricingData.estimated_monthly_upside_inr?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between p-4 bg-primary-950/70 rounded-ts border border-primary-700/60 space-y-3">
                <div className="text-xs space-y-2">
                  <div className="font-bold text-ivory flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-secondary-400" />
                    Zero-Commission Advantage:
                  </div>
                  <p className="text-[11px] text-ivory/80 leading-relaxed">
                    Unlike commercial OTAs that consume 25% of any price increase, <strong>100% of this dynamic surge</strong> reaches your bank account directly via UPI.
                  </p>
                </div>

                <div>
                  {pricingAppliedMsg && (
                    <div className="text-[11px] font-bold text-secondary-300 mb-2 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> {pricingAppliedMsg}
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleApplyPricing}
                    disabled={isApplyingPricing}
                    className="w-full font-bold shadow-lg"
                    icon={TrendingUp}
                  >
                    {isApplyingPricing ? 'Updating Network...' : `Apply Recommended Tariff (₹${pricingData.recommended_tariff_inr})`}
                  </Button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Reverse Marketplace Section */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary-900" />
              <h2 className="text-xl font-display font-bold text-primary-900">
                Reverse Marketplace: Live Tourist RFPs
              </h2>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              Tourists have generated multi-day itineraries and broadcast requests for local homestay & guide bids.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-neutral-600 font-semibold">Filter by State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 rounded-ts px-2 py-1 text-xs text-neutral-800 focus:outline-none"
            >
              <option value="All">All Circuits ({rfps.length})</option>
              <option value="Chhattisgarh">Chhattisgarh</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Himachal Pradesh">Himachal Pradesh</option>
            </select>
          </div>
        </div>

        {filteredRfps.length === 0 ? (
          <div className="p-8 text-center bg-neutral-50 rounded-ts border border-neutral-200 text-neutral-500 text-xs">
            No open RFPs currently match the selected circuit filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRfps.map((rfp) => (
              <Card key={rfp.id} variant="default" className="p-5 flex flex-col justify-between border border-neutral-200 hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="badge-terracotta-ts text-[10px] py-0.5 font-bold uppercase">
                        {rfp.days} Days Itinerary
                      </span>
                      <h3 className="text-base font-bold text-primary-900 mt-1">
                        {rfp.destination} Circuit
                      </h3>
                      <div className="text-xs text-neutral-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary-800" /> {rfp.state}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-neutral-500">Traveler Budget</div>
                      <div className="text-base font-bold text-secondary-800">
                        ₹{rfp.target_budget_inr?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-ts border border-neutral-200 text-xs text-neutral-700">
                    <span className="font-semibold text-primary-900 block mb-1">
                      Traveler: {rfp.traveler_name}
                    </span>
                    <p className="text-[11px] text-neutral-600 line-clamp-2">
                      "{rfp.notes}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Status: <strong>{rfp.status}</strong>
                    </span>
                    <span>{rfp.bids_count} bids placed</span>
                  </div>

                </div>

                <div className="pt-4 mt-2 border-t border-neutral-100">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenBidModal(rfp)}
                    className="w-full font-bold shadow-sm"
                    icon={Send}
                  >
                    Submit Competitive Bid
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>

      {/* My Active Bids Section */}
      <div className="card-ts p-6 bg-ivory border border-neutral-200 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-secondary-800" />
            <h3 className="font-display font-bold text-base text-primary-900">
              My Submitted Bids & Contracts ({myBids.length})
            </h3>
          </div>
          <span className="text-xs text-neutral-500">Instant direct settlement via UPI</span>
        </div>

        {myBids.length === 0 ? (
          <div className="text-center py-6 text-xs text-neutral-500">
            You have not submitted any bids yet. Choose an open RFP above to submit a competitive proposal.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {myBids.map((bid) => (
              <div key={bid.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary-900">{bid.id}</span>
                    <span className="text-neutral-400">•</span>
                    <span className="text-neutral-600">RFP Ref: {bid.rfp_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      bid.status === 'accepted'
                        ? 'bg-secondary-100 text-secondary-900 border border-secondary-800/30'
                        : 'bg-accent-50 text-accent-900 border border-accent-800/20'
                    }`}>
                      {bid.status === 'accepted' ? 'Accepted & Confirmed' : 'Under Review'}
                    </span>
                  </div>
                  <p className="text-neutral-600 text-[11px]">
                    Inclusions: <strong>{bid.inclusions}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="font-bold text-sm text-primary-900">₹{bid.bid_amount_inr?.toLocaleString()}</div>
                    <div className="text-[10px] text-secondary-800 font-semibold">
                      97% Payout: ₹{Math.round(bid.bid_amount_inr * 0.97)}
                    </div>
                  </div>

                  {bid.status !== 'accepted' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSimulateAcceptance(bid.id)}
                      className="text-xs py-1 px-2.5 font-semibold text-secondary-900 border-secondary-700 hover:bg-secondary-50"
                    >
                      Simulate Acceptance
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bid Submission Modal */}
      {activeRfpForBid && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-ivory rounded-ts shadow-2xl border border-neutral-300 w-full max-w-lg overflow-hidden relative">
            
            <div className="bg-primary-900 text-ivory px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-accent-400" />
                <h3 className="font-display font-bold text-base text-ivory">
                  Submit Bid: {activeRfpForBid.destination} Circuit
                </h3>
              </div>
              <button
                onClick={() => setActiveRfpForBid(null)}
                className="text-ivory/80 hover:text-ivory"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="p-6 space-y-4 text-xs">
              
              <div className="p-3 bg-neutral-50 rounded-ts border border-neutral-200">
                <div className="text-[10px] uppercase font-bold text-primary-800">
                  Traveler Request Details
                </div>
                <div className="font-bold text-neutral-800 mt-0.5">
                  {activeRfpForBid.traveler_name} ({activeRfpForBid.days} Days)
                </div>
                <div className="text-neutral-500 text-[11px] mt-0.5">
                  Target Budget: ₹{activeRfpForBid.target_budget_inr} • Notes: "{activeRfpForBid.notes}"
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Your Total Quote (INR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={500}
                    max={50000}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-ts font-bold text-sm text-primary-900 focus:ring-1 focus:ring-primary-800 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-secondary-800 font-bold">
                    Direct Host Payout: ₹{Math.round(bidAmount * 0.97)} (97%)
                  </span>
                </div>
                <p className="text-[10px] text-secondary-800 mt-1">
                  TravelSathi DPI guarantees 0% commission deductions.
                </p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Inclusions (Stay, Organic Meals, Guiding) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bidInclusions}
                  onChange={(e) => setBidInclusions(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-ts text-neutral-800 focus:ring-1 focus:ring-primary-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Personal Host Welcome Message
                </label>
                <textarea
                  rows={2}
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-ts text-neutral-800 focus:ring-1 focus:ring-primary-800 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setActiveRfpForBid(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmittingBid}
                  className="font-bold shadow-md"
                  icon={Send}
                >
                  {isSubmittingBid ? 'Transmitting...' : `Submit Bid (₹${bidAmount})`}
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
