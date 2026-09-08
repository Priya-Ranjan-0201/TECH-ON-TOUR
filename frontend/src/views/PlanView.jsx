import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Sparkles,
  Calendar,
  Compass,
  ArrowLeft,
  Share2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  Navigation,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PlanWizard from '../components/plan/PlanWizard';
import ItineraryTimeline from '../components/plan/ItineraryTimeline';
import ItineraryMap from '../components/plan/ItineraryMap';
import ItinerarySummaryCard from '../components/plan/ItinerarySummaryCard';
import BookingModal from '../components/explore/BookingModal';
import SwapStopModal from '../components/plan/SwapStopModal';
import RFPModal from '../components/plan/RFPModal';

export default function PlanView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [itinerary, setItinerary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [showWizard, setShowWizard] = useState(true);

  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingDestination, setBookingDestination] = useState(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapModalData, setSwapModalData] = useState({ dayNumber: 1, stopIndex: 0, currentStopName: '' });
  const [rfpModalOpen, setRfpModalOpen] = useState(false);

  const initialDestination = searchParams.get('destination') || '';
  const initialState = searchParams.get('state') || 'Rajasthan';
  const initialDays = parseInt(searchParams.get('days') || '3', 10);
  const itineraryIdParam = searchParams.get('id');

  // Load existing itinerary if URL has ?id=...
  useEffect(() => {
    if (itineraryIdParam) {
      loadSavedItinerary(itineraryIdParam);
    }
  }, [itineraryIdParam]);

  const loadSavedItinerary = async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/itinerary/${id}`);
      setItinerary(res.data);
      setShowWizard(false);
      setSelectedDay(1);
    } catch (err) {
      console.error('Failed to load saved itinerary:', err);
      setError('Could not locate saved itinerary. Try generating a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (params) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/itinerary/generate', params);
      setItinerary(res.data);
      setSelectedDay(1);
      setShowWizard(false);
      setSearchParams({ id: res.data.id });
    } catch (err) {
      console.error('Error generating itinerary:', err);
      setError(
        err.response?.data?.detail ||
          'Failed to generate itinerary. Please try again with different parameters.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenBooking = (item) => {
    setBookingDestination({
      name: item.destination_name || item.name,
      state: item.state || itinerary?.state,
      price_range: 'moderate',
    });
    setBookingModalOpen(true);
  };

  const handleOpenSwapModal = (dayNumber, stopIndex, currentStopName) => {
    setSwapModalData({ dayNumber, stopIndex, currentStopName });
    setSwapModalOpen(true);
  };

  const handleStopSwapped = (updatedItinerary) => {
    setItinerary(updatedItinerary);
    setSuccessToast('Activity successfully replaced! Routes, transit caps, and carbon savings updated.');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleReorderStops = async (dayNumber, newOrder) => {
    if (!itinerary) return;
    try {
      const res = await axios.post(`/api/itinerary/${itinerary.id}/reorder-stops`, {
        day_number: dayNumber,
        new_order: newOrder,
      });
      setItinerary(res.data);
      setSuccessToast(`Day ${dayNumber} stop sequence updated! Transit distances recalculated.`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error('Failed to reorder stops:', err);
      setError('Failed to reorder stops. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-sand-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Banner Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-100 text-accent-900">
                <Sparkles className="w-3.5 h-3.5 text-accent-700" />
                Travel Twin Engine (Tier 1 Priority #1)
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                12,293 Grounded POIs • TransitGuard Fare Caps • Zero OTA Commission
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-900">
              AI Travel Twin Itinerary Planner
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl mt-1">
              Personalized, weather-aware multi-day travel schedules grounded in real local attractions, community homestays, and certified guides across all 36 States/UTs.
            </p>
          </div>

          {itinerary && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={showWizard ? 'outline' : 'secondary'}
                size="sm"
                onClick={() => setShowWizard(!showWizard)}
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                {showWizard ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    Hide Parameters
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Modify Plan Parameters
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Success Toast Notification */}
        {successToast && (
          <div className="p-3.5 rounded-xl bg-forest-50 border border-forest-200 text-xs text-forest-900 flex items-center gap-2 animate-fadeIn shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Plan Generator Wizard */}
        {(showWizard || !itinerary) && (
          <PlanWizard
            onGenerate={handleGenerate}
            isLoading={isLoading}
            initialState={initialState}
            initialDays={initialDays}
          />
        )}

        {/* Loading Indicator */}
        {isLoading && !itinerary && (
          <div className="text-center py-16 space-y-4">
            <LoadingSpinner size="lg" message="Synthesizing personalized travel twin..." />
            <p className="text-xs text-neutral-500 font-mono">
              Clustering spatial coordinates across 12,293 destinations & auditing TransitGuard fare caps...
            </p>
          </div>
        )}

        {/* Generated Itinerary Presentation */}
        {itinerary && (
          <div className="space-y-8 animate-fadeIn">
            {/* Itinerary Header Summary Banner */}
            <Card
              variant="default"
              className="p-6 bg-gradient-to-r from-surface to-ivory border-l-4 border-l-accent-500 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-800 text-white">
                      {itinerary.state}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-100 text-accent-900 border border-accent-300">
                      {itinerary.days} Days Schedule
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-forest-100 text-forest-900 border border-forest-300 capitalize">
                      {itinerary.budget} Budget
                    </span>
                    {itinerary.eco_footprint && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        🌱 -{itinerary.eco_footprint.carbon_saved_pct}% Carbon
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-display font-bold text-primary-950">
                    {itinerary.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                    {itinerary.summary}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-neutral-500 font-medium">Estimated Total</div>
                  <div className="text-2xl font-bold text-primary-900">
                    ₹{itinerary.budget_breakdown?.total_inr.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-bold text-forest-700 mt-0.5">
                    Save ₹{itinerary.budget_breakdown?.ota_commission_saved_inr.toLocaleString('en-IN')} via DPI
                  </div>
                </div>
              </div>
            </Card>

            {/* Split Screen Layout: Timeline (Left 60%) + Map & Financials (Right 40%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Itinerary Timeline */}
              <div className="lg:col-span-7">
                <ItineraryTimeline
                  itinerary={itinerary}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  onOpenBooking={handleOpenBooking}
                  onOpenSwapModal={handleOpenSwapModal}
                  onReorderStops={handleReorderStops}
                />
              </div>

              {/* Right Column: Route Map & Budget Card */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                {/* Interactive Leaflet Route Map */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                    <span className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-primary-700" />
                      Day {selectedDay} Spatial Route Geometry
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">OpenStreetMap</span>
                  </div>
                  <ItineraryMap itinerary={itinerary} selectedDay={selectedDay} />
                </div>

                {/* Financial Summary & DPI Impact */}
                <ItinerarySummaryCard
                  itinerary={itinerary}
                  onOpenBooking={handleOpenBooking}
                  onOpenRFP={() => setRfpModalOpen(true)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Direct Booking Modal for Homestays */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        destination={bookingDestination}
      />

      {/* Stop Swapping Modal */}
      <SwapStopModal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        itineraryId={itinerary?.id}
        dayNumber={swapModalData.dayNumber}
        stopIndex={swapModalData.stopIndex}
        currentStopName={swapModalData.currentStopName}
        onStopSwapped={handleStopSwapped}
      />

      {/* Reverse Marketplace RFP Broadcast Modal (Phase 6 Bridge) */}
      <RFPModal
        isOpen={rfpModalOpen}
        onClose={() => setRfpModalOpen(false)}
        itinerary={itinerary}
      />
    </div>
  );
}
