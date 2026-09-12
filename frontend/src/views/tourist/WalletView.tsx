import React, { useState } from 'react';
import { 
  Briefcase, 
  QrCode, 
  Download, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Check, 
  Plus, 
  Lock, 
  FileText, 
  PhoneCall, 
  MapPin, 
  Sun, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function WalletView() {
  const { bookings, offlineReady, toggleOfflineReady, activeTrip } = useApp();
  const [activeTab, setActiveTab] = useState('passes'); // 'passes' | 'packing' | 'checklist'

  // Smart Packing Assistant List (Section 54)
  const [packingItems, setPackingItems] = useState([
    { id: 1, label: 'Thermal Innerwear & Fleece (Evening temperatures drop to 6°C)', checked: true, category: 'Clothing' },
    { id: 2, label: 'Sturdy Waterproof Hiking Shoes for rocky riverbeds', checked: true, category: 'Footwear' },
    { id: 3, label: 'Modest Temple Attire (Shoulder & knee coverage)', checked: false, category: 'Cultural' },
    { id: 4, label: 'Water Filtration Bottle (Eco-friendly, plastic-free)', checked: true, category: 'Sustainability' },
    { id: 5, label: 'Power Bank (20,000 mAh for high altitude battery life)', checked: false, category: 'Electronics' },
    { id: 6, label: 'Personal First Aid Kit (Bandages, ORS, altitude tablets)', checked: true, category: 'Medical' }
  ]);

  // Travel Document Checklist (Section 55)
  const [checklist, setChecklist] = useState([
    { id: 101, label: 'Government Photo ID (Aadhaar / Passport for Homestay eKYC)', completed: true },
    { id: 102, label: 'Confirmed Homestay Voucher & QR Pass', completed: true },
    { id: 103, label: 'Train / Volvo Bus Booking Barcode', completed: true },
    { id: 104, label: 'Emergency Medical Insurance Card', completed: false }
  ]);

  const togglePacking = (id) => {
    setPackingItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const toggleChecklist = (id) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div>
          <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Digital Public Infrastructure Pass</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            Unified Trip Wallet & Offline Hub
          </h1>
          <p className="text-xs sm:text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
            All your reservations, QR gate passes, offline emergency profiles, and smart packing lists in one unified place.
          </p>
        </div>

        {/* Section 30: Offline Ready Status & Toggle */}
        <div className="flex items-center gap-3 bg-neutral-card dark:bg-darkmode-surface border border-neutral-border dark:border-darkmode-border rounded-ts-hero p-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 px-2 text-xs">
            {offlineReady ? (
              <span className="flex items-center gap-1.5 text-nature font-bold">
                <Wifi className="w-4 h-4 text-nature" />
                <span>Offline Ready (Cached)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-neutral-muted font-bold">
                <WifiOff className="w-4 h-4" />
                <span>Online Only</span>
              </span>
            )}
          </div>

          <button
            onClick={toggleOfflineReady}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              offlineReady
                ? 'bg-nature text-white'
                : 'bg-neutral-bg text-neutral-text-sec hover:bg-neutral-border'
            }`}
          >
            {offlineReady ? 'Sync Enabled' : 'Enable Offline Cache'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-border dark:border-darkmode-border gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('passes')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'passes'
              ? 'border-brand text-brand'
              : 'border-transparent text-neutral-muted hover:text-neutral-text-primary'
          }`}
        >
          Tickets & QR Passes ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('packing')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'packing'
              ? 'border-brand text-brand'
              : 'border-transparent text-neutral-muted hover:text-neutral-text-primary'
          }`}
        >
          Smart Packing Assistant (AI Tailored)
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'checklist'
              ? 'border-brand text-brand'
              : 'border-transparent text-neutral-muted hover:text-neutral-text-primary'
          }`}
        >
          Travel Document Checklist
        </button>
      </div>

      {/* Tab Content 1: Passes & QR Vouchers */}
      {activeTab === 'passes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="ts-card overflow-hidden border-2 border-brand/20 flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
                    <span className="badge-brand">
                      {b.type === 'Stay' ? '🏡 Verified Homestay Pass' : '🎨 Verified Experience Pass'}
                    </span>
                    <span className="font-mono text-xs font-bold text-nature bg-nature-light px-2.5 py-0.5 rounded">
                      {b.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                      {b.title}
                    </h3>
                    <p className="text-xs text-neutral-muted">
                      Host: {b.host} • 📍 {b.location}
                    </p>
                    <p className="text-xs font-semibold text-neutral-text-sec mt-1">
                      Schedule: {b.dates}
                    </p>
                  </div>

                  {/* QR Code Simulation */}
                  <div className="p-4 rounded-ts-md bg-white border border-neutral-border flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-mono text-neutral-muted">DPI VERIFIED QR</p>
                      <p className="text-xs font-mono font-bold text-neutral-900">{b.qrCode}</p>
                      <p className="text-[10px] text-nature font-semibold">Offline Scannable at Homestay</p>
                    </div>

                    <div className="w-16 h-16 bg-neutral-900 text-white rounded p-1.5 flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 bg-neutral-bg-secondary dark:bg-darkmode-elevated border-t border-neutral-border flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                    Total Paid: ₹{b.price} (Zero Commission)
                  </span>
                  <span className="text-brand font-bold">Valid Offline ID</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 2: Smart Packing Assistant (Section 54) */}
      {activeTab === 'packing' && (
        <div className="ts-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-border">
            <div>
              <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                Smart Packing Assistant for {activeTrip ? activeTrip.destination : 'Your Trip'}
              </h3>
              <p className="text-xs text-neutral-muted">
                Synthesized from high-altitude autumn weather (6°C), riverbed hikes, and sacred village dress codes.
              </p>
            </div>
            <span className="text-xs font-bold text-brand bg-brand-50 px-3 py-1 rounded-full">
              {packingItems.filter(i => i.checked).length} / {packingItems.length} Packed
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {packingItems.map((item) => (
              <div
                key={item.id}
                onClick={() => togglePacking(item.id)}
                className={`p-3.5 rounded-ts-md border cursor-pointer transition-colors flex items-center justify-between ${
                  item.checked
                    ? 'bg-neutral-bg-secondary/60 border-neutral-border line-through text-neutral-muted'
                    : 'bg-neutral-card border-brand/30 text-neutral-text-primary dark:text-darkmode-text-primary font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    item.checked ? 'bg-nature text-white border-nature' : 'border-neutral-border'
                  }`}>
                    {item.checked && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                  </div>
                  <span>{item.label}</span>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-bg text-neutral-muted">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 3: Travel Document Checklist (Section 55) */}
      {activeTab === 'checklist' && (
        <div className="ts-card p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-neutral-border">
            <h3 className="text-lg font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
              Essential Travel Document Checklist
            </h3>
            <p className="text-xs text-neutral-muted">
              Ensure you carry the necessary physical and digital verification documents.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            {checklist.map((doc) => (
              <div
                key={doc.id}
                onClick={() => toggleChecklist(doc.id)}
                className={`p-3.5 rounded-ts-md border cursor-pointer flex items-center justify-between ${
                  doc.completed
                    ? 'bg-nature-light/40 border-nature/30 text-nature font-bold'
                    : 'bg-neutral-card border-neutral-border text-neutral-text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    doc.completed ? 'bg-nature text-white border-nature' : 'border-neutral-border'
                  }`}>
                    {doc.completed && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                  </div>
                  <span>{doc.label}</span>
                </div>

                <span className="text-[11px] font-mono">
                  {doc.completed ? 'Ready in Wallet' : 'Action Required'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
