import React, { useState } from 'react';
import { 
  Layers, 
  QrCode, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  MessageSquarePlus, 
  ShieldCheck, 
  Percent,
  Receipt,
  XCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function BookingsView() {
  const { bookings, setBookings, openReviewModal } = useApp();
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'Confirmed' | 'Completed' | 'Cancelled'

  const handleCancelBooking = (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
  };

  const filtered = bookings.filter(b => {
    if (activeFilter === 'All') return true;
    return (b.status || 'Confirmed').toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div>
          <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Unified Booking Management</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            My Bookings & Receipts
          </h1>
          <p className="text-xs sm:text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
            Zero hidden fees. Itemized Split-UPI settlements with verified review credentials.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 text-xs">
          {['All', 'Confirmed', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveFilter(st)}
              className={`px-3 py-1.5 rounded-full font-bold transition-colors ${
                activeFilter === st
                  ? 'bg-brand text-primary-50 shadow-sm'
                  : 'bg-white dark:bg-darkmode-surface border border-neutral-border text-neutral-text-sec hover:border-brand'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="ts-card p-12 text-center space-y-3">
            <Receipt className="w-10 h-10 text-neutral-muted mx-auto" />
            <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
              No bookings found in this category
            </h3>
            <p className="text-xs text-neutral-muted">
              Book a homestay or local experience using the instant Split-UPI checkout to view receipts here.
            </p>
          </div>
        ) : (
          filtered.map((b) => {
            const price = b.price || b.totalPaid || 2800;
            const hostPayout = b.hostNetPayout || Math.round(price * 0.97);

            return (
              <div
                key={b.id}
                className="ts-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      (b.status || 'Confirmed') === 'Confirmed' ? 'badge-nature' :
                      b.status === 'Cancelled' ? 'bg-sos-light text-sos border border-sos/20' :
                      'bg-neutral-bg text-neutral-muted'
                    }`}>
                      ✓ {b.status || 'Confirmed'}
                    </span>
                    <span className="font-mono text-xs text-brand font-bold bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                      ID: {b.id}
                    </span>
                    {b.bankRrn && (
                      <span className="text-[11px] font-mono text-neutral-muted">
                        Bank RRN: {b.bankRrn}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                    {b.title || b.placeName}
                  </h3>

                  <p className="text-xs text-neutral-muted flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-brand" />
                    <span>{b.location || b.destination || b.state || 'Himachal Pradesh'} • Host: <strong className="text-neutral-text-primary dark:text-darkmode-text-primary">{b.host || b.hostName || 'Verified Host'}</strong></span>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-text-sec pt-1">
                    <span>Dates: {b.dates || `${b.checkIn || '2026-10-15'} to ${b.checkOut || '2026-10-18'}`}</span>
                    <span className="text-secondary-800">Host Direct Payout: ₹{hostPayout.toLocaleString('en-IN')} (97%)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2.5 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-neutral-border">
                  <div className="sm:text-right">
                    <span className="text-2xl font-extrabold text-brand">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-secondary-800 font-bold block">
                      ✓ Split-UPI Settled
                    </span>
                  </div>

                  <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto">
                    {/* Write Verified Review Trigger */}
                    <button
                      onClick={() => openReviewModal({ name: b.title || b.placeName, state: b.state }, b.id)}
                      className="btn-secondary !py-1.5 !px-3 !text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5 text-brand" />
                      <span>Write Verified Review</span>
                    </button>

                    {b.status === 'Confirmed' && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="text-[11px] text-neutral-muted hover:text-sos font-semibold text-center sm:text-right transition-colors"
                      >
                        Cancel Reservation
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
