import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Globe, 
  Moon, 
  Sun, 
  Bookmark, 
  AlertTriangle, 
  Sparkles, 
  Briefcase, 
  Layers, 
  Calendar,
  Lock,
  Menu,
  X,
  MapPin,
  ShieldCheck,
  Hotel,
  Compass as CompassIcon,
  ChevronDown,
  TrendingUp,
  CloudSun,
  Clock,
  Bell,
  Bot,
  Search,
  Navigation,
  LayoutDashboard,
  Users,
  Landmark
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import ProfileDropdown from '../common/ProfileDropdown';

export default function Navbar() {
  const { t } = useTranslation();
  const { 
    userRole, 
    switchRole, 
    currentUser, 
    darkMode, 
    toggleDarkMode, 
    language, 
    changeLanguage,
    savedPlaces,
    setIsSosModalOpen
  } = useApp();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreSubmenuOpen, setMoreSubmenuOpen] = useState(false);

  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  const isGovTabActive = (tab: string) => {
    if (!location.pathname.startsWith('/gov') && !location.pathname.startsWith('/government')) return false;
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab') || (location.hash ? location.hash.replace('#', '') : '');
    if (tab === 'overview') {
      return !currentTab || currentTab === 'overview';
    }
    return currentTab === tab;
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#141210]/95 backdrop-blur-md border-b border-neutral-200/90 dark:border-neutral-800/90 transition-colors duration-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8C3618] via-[#712B13] to-[#4A1B0C] text-amber-200 flex items-center justify-center shadow-xs border border-primary-400/30 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-display font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
                Travel<span className="text-[#8C3618] dark:text-[#E5A93C]">Sathi</span>
              </span>
              <span className="text-[9px] tracking-widest uppercase font-bold text-neutral-400 dark:text-neutral-500 leading-none">
                National DPI
              </span>
            </div>
          </Link>

          {/* PRIMARY NAVIGATION ITEMS: ROLE-SCOPED */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {userRole === 'host' ? (
              <>
                <Link
                  to="/host"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/host')
                      ? 'text-amber-800 dark:text-amber-400 font-bold bg-amber-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-amber-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  Host Hub
                </Link>
                <Link
                  to="/host/listings"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/host/listings')
                      ? 'text-amber-800 dark:text-amber-400 font-bold bg-amber-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-amber-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  My Listings
                </Link>
                <Link
                  to="/host/pricing"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/host/pricing')
                      ? 'text-amber-800 dark:text-amber-400 font-bold bg-amber-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-amber-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  Price Co-Pilot
                </Link>
              </>
            ) : userRole === 'dmo' ? (
              <>
                <Link
                  to="/dmo"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/dmo') && !isActive('/dmo/analytics') && !isActive('/dmo/circuits') && !isActive('/dmo/crowd') && !isActive('/dmo/flow')
                      ? 'text-blue-800 dark:text-blue-400 font-bold bg-blue-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-blue-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  Command Center
                </Link>
                <Link
                  to="/dmo/crowd"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/dmo/crowd')
                      ? 'text-blue-800 dark:text-blue-400 font-bold bg-blue-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-blue-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  Crowd & Festivals
                </Link>
                <Link
                  to="/dmo/flow"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/dmo/flow')
                      ? 'text-blue-800 dark:text-blue-400 font-bold bg-blue-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-blue-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  Flow Diversion
                </Link>
                <Link
                  to="/dmo/circuits"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/dmo/circuits')
                      ? 'text-blue-800 dark:text-blue-400 font-bold bg-blue-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-blue-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  Circuits
                </Link>
                <Link
                  to="/dmo/analytics"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/dmo/analytics')
                      ? 'text-blue-800 dark:text-blue-400 font-bold bg-blue-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-blue-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  Analytics
                </Link>
              </>
            ) : (userRole === 'gov' || userRole === 'government') ? (
              <>
                <Link
                  to="/gov/tourism-intelligence?tab=overview"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    isGovTabActive('overview')
                      ? 'text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  Tourism Investment Intelligence
                </Link>
                <Link
                  to="/gov/tourism-intelligence?tab=rankings"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isGovTabActive('rankings')
                      ? 'text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  508 Districts
                </Link>
                <Link
                  to="/gov/tourism-intelligence?tab=simulator"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isGovTabActive('simulator')
                      ? 'text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  Scenario Simulator
                </Link>
                <Link
                  to="/gov/tourism-intelligence?tab=compare"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isGovTabActive('compare')
                      ? 'text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  Compare
                </Link>
              </>
            ) : userRole === 'admin' ? (
              <>
                <Link
                  to="/admin"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin')
                      ? 'text-red-800 dark:text-red-400 font-bold bg-red-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-red-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  Admin Center
                </Link>
                <Link
                  to="/admin/moderation"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin/moderation')
                      ? 'text-red-800 dark:text-red-400 font-bold bg-red-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-red-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  Moderation
                </Link>
                <Link
                  to="/admin/health"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin/health')
                      ? 'text-red-800 dark:text-red-400 font-bold bg-red-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-red-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  System Health
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/')
                      ? 'text-primary-800 dark:text-accent-400 font-bold bg-primary-50/90 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-primary-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  {t('nav.home', 'Home')}
                </Link>
                <Link
                  to="/plan"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/plan')
                      ? 'text-primary-800 dark:text-accent-400 font-bold bg-primary-50/90 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-primary-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  {t('nav.planTrip', 'Plan Trip')}
                </Link>
                <Link
                  to="/trips"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/trips') || isActive('/bookings')
                      ? 'text-primary-800 dark:text-accent-400 font-bold bg-primary-50/90 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-primary-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  {t('nav.myTrips', 'My Trips')}
                </Link>
                <Link
                  to="/trips/group"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive('/trips/group')
                      ? 'text-amber-800 dark:text-amber-400 font-bold bg-amber-50 dark:bg-neutral-800'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-amber-800 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{t('nav.groupTravel', 'Group Travel')}</span>
                </Link>
              </>
            )}
          </nav>

          {/* Right Area: Discreet SOS Icon + Item 4: Profile / Menu Icon */}
          <div className="flex items-center gap-2">
            
            {/* Small persistent SOS icon only (not a full red labeled button) */}
            <button
              onClick={() => setIsSosModalOpen(true)}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-colors"
              title="Emergency SOS Assistance"
            >
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </button>

            {/* 4. Profile / Menu Icon (Everything else lives inside here) */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-primary-400/50 transition-all cursor-pointer"
                title="Profile and Navigation Menu"
              >
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={currentUser?.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700"
                />
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileDropdownOpen && (
                <ProfileDropdown 
                  role={userRole} 
                  onClose={() => setProfileDropdownOpen(false)} 
                  currentUser={currentUser} 
                />
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-600 dark:text-neutral-300 hover:text-primary-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141210] px-4 py-3 space-y-2 animate-fadeIn text-sm font-semibold">
          {(userRole === 'dmo' || userRole === 'gov' || userRole === 'government') ? (
            <>
              <Link to="/dmo" className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">Command Center</Link>
              <Link to="/dmo/investment" className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <span>Tourism Intelligence</span>
              </Link>
              <Link to="/dmo/crowd" className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">Crowd & Festivals</Link>
              <Link to="/dmo/circuits" className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">Circuit Management</Link>
              <Link to="/dmo/analytics" className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">Analytics & Heatmap</Link>
            </>
          ) : (
            <>
              <Link to="/" className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">{t('nav.home', 'Home')}</Link>
              <Link to="/plan" className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">{t('nav.planTrip', 'Plan Trip')}</Link>
              <Link to="/trips" className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">{t('nav.myTrips', 'My Trips')}</Link>
              <Link to="/trips/group" className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>{t('nav.groupTravelFull', 'Group Travel (Live Map & E2EE)')}</span>
              </Link>
              <Link to="/privacy" className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t('nav.securityPrivacy', 'Security & Privacy Center')}</span>
              </Link>
              <Link to="/explore" className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">{t('nav.exploreCatalog', 'Explore Catalog')}</Link>
              <Link to="/stays" className="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">{t('nav.homestays', 'Homestays')}</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
