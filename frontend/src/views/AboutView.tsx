import React from 'react';
import { Compass, ShieldCheck, HeartHandshake, Globe, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutView() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="badge-brand">
          🏛️ National Digital Public Infrastructure (DPI)
        </span>
        <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
          About TravelSathi
        </h1>
        <p className="text-base text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
          TravelSathi is engineered as a public-benefit tourism revival platform designed to eliminate exploitative OTA commissions, counter destructive overtourism, and bridge the digital literacy divide for India’s rural and tribal communities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        
        <div className="ts-card p-6 space-y-3">
          <div className="w-10 h-10 rounded-full bg-brand-50 text-brand flex items-center justify-center font-bold text-lg">
            1
          </div>
          <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
            Zero-Commission Architecture
          </h3>
          <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
            Dominant commercial OTAs extract 15% to 30% commissions from small homestay operators. TravelSathi operates as an open digital rail with 0% platform take-rate, routing 100% of traveler payments directly to hosts via instant UPI split checkout.
          </p>
        </div>

        <div className="ts-card p-6 space-y-3">
          <div className="w-10 h-10 rounded-full bg-nature-light text-nature flex items-center justify-center font-bold text-lg">
            2
          </div>
          <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
            PM-JUGA Tribal Integration
          </h3>
          <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
            Aligned with the Pradhan Mantri Janjatiya Unnat Gram Abhiyan (PM-JUGA), we bring tribal homestay clusters in Bastar, Lower Subansiri, and Araku directly into the national discovery engine with DigiLocker-verified host accreditation.
          </p>
        </div>

        <div className="ts-card p-6 space-y-3">
          <div className="w-10 h-10 rounded-full bg-trust-light text-trust flex items-center justify-center font-bold text-lg">
            3
          </div>
          <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
            Anti-Overtourism & Carrying Capacity
          </h3>
          <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
            Over 80% of domestic tourists concentrate in just 20 commercial hotspots. Our spatial AI algorithms actively detect high visitor density and recommend pristine, lower-crowd alternatives like Tirthan Valley and Marayoor.
          </p>
        </div>

        <div className="ts-card p-6 space-y-3">
          <div className="w-10 h-10 rounded-full bg-action-light text-action flex items-center justify-center font-bold text-lg">
            4
          </div>
          <h3 className="text-xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
            Vernacular Bhashini Speech Rail
          </h3>
          <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary leading-relaxed">
            Tourism must not be restricted by the English language. Powered by Government of India’s open Bhashini initiative, tourists and rural hosts can interact seamlessly in Hindi, Bengali, Tamil, Telugu, and Marathi.
          </p>
        </div>

      </div>

      <div className="p-8 rounded-ts-hero bg-neutral-bg-secondary dark:bg-darkmode-elevated border border-neutral-border dark:border-darkmode-border text-center space-y-4">
        <h3 className="text-2xl font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
          Strategic Policy Alignment
        </h3>
        <p className="text-xs text-neutral-text-sec dark:text-darkmode-text-secondary max-w-2xl mx-auto leading-relaxed">
          Formally aligned with Swadesh Darshan 2.0, PM-Vikas Artisan Certification, National Digital Tourism Mission (NDTM), and ONDC decentralized commerce.
        </p>
        <div className="pt-2">
          <Link to="/explore" className="btn-brand px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2">
            <span>Explore 12k Verified POIs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
