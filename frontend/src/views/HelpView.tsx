import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, PhoneCall, ShieldCheck, Mail } from 'lucide-react';

export default function HelpView() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "How does TravelSathi guarantee zero-commission booking for local homestays?",
      a: "TravelSathi is engineered as a Digital Public Infrastructure (DPI) rather than a commercial online travel agency. Payments are settled directly between tourist and host bank accounts using instant UPI rails. No middleman deductions or listing fees are taken."
    },
    {
      q: "What is a 'Hidden Gem' in TravelSathi, and how is it calculated?",
      a: "We never randomly apply labels. A destination qualifies as an anti-overtourism Hidden Gem only if it has a proven visitor density below 40% of ecological carrying capacity, is situated within accessible distance from a congested cluster (e.g. Tirthan Valley vs. Manali), possesses high verified review authenticity, and directly empowers local community cooperatives."
    },
    {
      q: "How does Smart Delay Handling work when I'm running late during my trip?",
      a: "When you tap 'I'm running late' (e.g. 60 or 90 minutes), TravelSathi recalculates your remaining schedule based on monument closing times, dining reservations, and mountain driving hours to preserve the core experience without rushing."
    },
    {
      q: "Can I use TravelSathi in remote areas with zero cell phone connectivity?",
      a: "Yes. By turning on 'Offline Ready' in your Trip Wallet, your entire day itinerary, essential maps, booking QR codes, emergency medical profile, and basic phrasebook are cached locally in your browser storage."
    },
    {
      q: "How does Emergency SOS differ from ordinary helpline numbers?",
      a: "Emergency SOS provides a 2-step confirmation gate to avoid false triggers, immediate 1-tap dialing to the 112 Unified Emergency Service and 1363 Tourist Police, and automatic generation of your exact GPS coordinates ready to paste into emergency SMS or WhatsApp messages."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      
      <div className="text-center space-y-3">
        <span className="badge-trust">
          Help & Support Center
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-neutral-text-sec dark:text-darkmode-text-secondary">
          Find answers to common questions about intelligent planning, zero-commission booking, and safety.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="ts-card p-5 cursor-pointer"
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
          >
            <div className="flex items-center justify-between font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">
              <span>{faq.q}</span>
              {openIndex === idx ? <ChevronUp className="w-4 h-4 text-brand shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-muted shrink-0" />}
            </div>

            {openIndex === idx && (
              <p className="mt-3 text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed border-t border-neutral-border dark:border-darkmode-border pt-3">
                {faq.a}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Contact card */}
      <div className="p-6 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="space-y-1 text-center sm:text-left">
          <p className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
            Need additional assistance or host onboarding help?
          </p>
          <p className="text-neutral-muted">
            Our multi-lingual DPI support team is available 24 hours a day.
          </p>
        </div>

        <div className="flex gap-2">
          <a href="tel:1363" className="btn-brand !text-xs font-bold flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 1363 (Toll Free)</span>
          </a>
        </div>
      </div>

    </div>
  );
}
