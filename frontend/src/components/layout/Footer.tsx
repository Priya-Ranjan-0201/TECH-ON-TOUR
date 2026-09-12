import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, HeartHandshake, Globe, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { switchRole } = useApp();
  const { t } = useTranslation();

  return (
    <footer className="bg-neutral-bg-secondary dark:bg-darkmode-bg border-t border-neutral-border dark:border-darkmode-border pt-16 pb-20 md:pb-12 text-neutral-text-sec dark:text-darkmode-text-secondary transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section: Brand & DPI Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 pb-12 border-b border-neutral-border dark:border-darkmode-border">
          
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-ts-md bg-brand text-white flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-2xl font-display font-extrabold tracking-tight text-neutral-text-primary dark:text-darkmode-text-primary">
                Travel<span className="text-brand dark:text-darkmode-brand">Sathi</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed max-w-md">
              {t('footer.tagline', "India's AI-Powered Intelligent Tourism, Discovery, Planning, Booking, Safety, and DPI Enablement Ecosystem.")}
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-nature-light text-nature border border-nature/20 dark:bg-darkmode-elevated dark:text-darkmode-green">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('footer.swadeshBadge', 'Swadesh Darshan 2.0 Aligned')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand border border-brand/20 dark:bg-darkmode-elevated dark:text-darkmode-brand">
                <HeartHandshake className="w-3.5 h-3.5" />
                {t('footer.tribalBadge', 'PM-JUGA Tribal Homestays')}
              </span>
            </div>
          </div>

          {/* Column 1: Explore & Plan */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-text-primary dark:text-darkmode-text-primary mb-4">
              {t('footer.explorePlan', 'Explore & Plan')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/explore" className="hover:text-brand dark:hover:text-darkmode-brand transition-colors">
                  {t('footer.exploreIndia', 'Explore India')}
                </Link>
              </li>
              <li>
                <Link to="/plan" className="hover:text-brand dark:hover:text-darkmode-brand transition-colors">
                  {t('footer.aiPlanner', 'AI Travel Planner')}
                </Link>
              </li>
              <li>
                <Link to="/travel-twin" className="hover:text-brand dark:hover:text-darkmode-brand transition-colors">
                  {t('footer.aiTravelTwin', 'AI Travel Twin')}
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-brand dark:hover:text-darkmode-brand transition-colors">
                  {t('footer.interactiveMap', 'Smart Interactive Map')}
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-brand dark:hover:text-darkmode-brand transition-colors">
                  {t('footer.festivals', 'Festivals & Cultural Events')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Experiences & Stays */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-text-primary dark:text-darkmode-text-primary mb-4">
              {t('footer.authenticLocal', 'Authentic Local')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/experiences" className="hover:text-brand dark:hover:text-darkmode-brand transition-colors">
                  {t('footer.experiences', 'Local Experiences Marketplace')}
                </Link>
              </li>
              <li>
                <Link to="/stays" className="hover:text-brand dark:hover:text-darkmode-brand transition-colors">
                  {t('footer.homestays', 'Verified Tribal & Eco Stays')}
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-brand dark:hover:text-darkmode-brand transition-colors">
                  {t('footer.safetyCenter', 'Safety Center & Live Alerts')}
                </Link>
              </li>
              <li>
                <Link to="/trips" className="hover:text-brand dark:hover:text-darkmode-brand transition-colors">
                  {t('footer.tripAssistant', 'Live Trip Assistant')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Portals & Governance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-text-primary dark:text-darkmode-text-primary mb-4">
              {t('footer.dpiGov', 'DPI & Governance')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => switchRole('host')}
                  className="text-left hover:text-nature dark:hover:text-darkmode-green transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('footer.hostPortal', 'Host Community Onboarding')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => switchRole('gov')}
                  className="text-left hover:text-trust transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('footer.dmoPortal', 'DMO Tourism Dashboard')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => switchRole('admin')}
                  className="text-left hover:text-semantic-error transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('footer.adminOps', 'National Tourism Ops')}</span>
                </button>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand dark:hover:text-darkmode-brand transition-colors">
                  {t('footer.openData', 'Open Tourism DPI Protocol')}
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright, Legal, Language */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span>© 2026 TravelSathi National Tourism Platform. {t('footer.rightsReserved', 'All rights reserved. Built for Bharat.')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <span className="text-neutral-muted text-[11px]">
              {t('footer.dpiDisclaimer', 'Operating as a non-profit Digital Public Good aligned with Ministry of Tourism initiatives.')}
            </span>
            <div className="flex items-center gap-1 text-neutral-muted">
              <Globe className="w-3.5 h-3.5" />
              <span>Multi-language DPI (Bhashini)</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
