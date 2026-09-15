import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Globe, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Home, 
  Building2, 
  ShieldAlert, 
  Layers, 
  Calendar,
  Clock,
  Bot,
  MapPin,
  LayoutDashboard,
  DollarSign,
  Activity,
  Users,
  FileText,
  LogOut,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';

export interface MenuItem {
  label: string;
  href: string;
  icon?: any;
}

export const MENUS: Record<string, MenuItem[]> = {
  tourist: [
    { label: 'Tourist Command Center', href: '/tourist', icon: LayoutDashboard },
    { label: 'Group Travel (Live Map & E2EE)', href: '/trips/group', icon: Users },
    { label: 'Security & Privacy Center', href: '/privacy', icon: ShieldCheck },
    { label: 'Explore Catalog', href: '/tourist/explore', icon: Compass },
    { label: 'AI Concierge', href: '/tourist/chat', icon: Bot },
    { label: 'Smart Map', href: '/tourist/map', icon: MapPin },
    { label: 'Safety Index', href: '/tourist/safety', icon: ShieldCheck },
    { label: 'Travel History', href: '/tourist/history', icon: Clock },
  ],
  host: [
    { label: 'Host Command Center', href: '/host', icon: Home },
    { label: 'My Listings', href: '/host/listings', icon: Layers },
    { label: 'AI Price Co-Pilot', href: '/host/pricing', icon: DollarSign },
    { label: 'Availability', href: '/host/calendar', icon: Calendar },
    { label: 'DigiLocker Verification', href: '/host/verification', icon: ShieldCheck },
  ],
  dmo: [
    { label: 'DMO Intelligence', href: '/dmo', icon: Building2 },
    { label: 'Footfall & Sentiment', href: '/dmo/analytics', icon: Activity },
    { label: 'Circuit Management', href: '/dmo/circuits', icon: Compass },
  ],
  admin: [
    { label: 'Admin Center', href: '/admin', icon: ShieldAlert },
    { label: 'Users & Hosts', href: '/admin/users', icon: Users },
    { label: 'Moderation', href: '/admin/moderation', icon: CheckCircle2 },
    { label: 'System Health', href: '/admin/health', icon: Activity },
    { label: 'Audit Log', href: '/admin/audit', icon: FileText },
  ],
};

interface ProfileDropdownProps {
  role?: string;
  onClose?: () => void;
  currentUser?: any;
}

export default function ProfileDropdown({ role = 'tourist', onClose }: ProfileDropdownProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    currentUser, 
    userRole, 
    switchRole, 
    darkMode, 
    toggleDarkMode, 
    language, 
    changeLanguage 
  } = useApp();

  // Normalize role from JWT or props
  const rawRole = role || userRole || 'tourist';
  const normalizedRole = rawRole === 'gov' ? 'dmo' : rawRole;
  const items = MENUS[normalizedRole] || MENUS['tourist'];

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  ];

  const handleClose = () => {
    if (onClose) onClose();
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'host':
        return '🏡 Verified Host Partner';
      case 'dmo':
        return '🏛️ Tourism Officer (DMO)';
      case 'admin':
        return '🛡️ System Administrator';
      default:
        return '✓ DPI Verified Traveler';
    }
  };

  const getLocalizedMenuLabel = (label: string) => {
    switch (label) {
      case 'Tourist Command Center': return t('nav.commandCenter', label);
      case 'Group Travel (Live Map & E2EE)': return t('nav.groupTravelFull', label);
      case 'Security & Privacy Center': return t('nav.securityPrivacy', label);
      case 'Explore Catalog': return t('nav.exploreCatalog', label);
      case 'AI Concierge': return t('nav.aiConcierge', label);
      case 'Smart Map': return t('nav.smartMap', label);
      case 'Safety Index': return t('nav.safetyIndex', label);
      case 'Travel History': return t('nav.travelHistory', label);
      case 'Host Command Center': return t('nav.hostCommandCenter', label);
      case 'My Listings': return t('nav.myListings', label);
      case 'AI Price Co-Pilot': return t('nav.aiPricing', label);
      case 'Availability': return t('nav.availability', label);
      case 'DigiLocker Verification': return t('nav.digiLockerVerification', label);
      case 'DMO Intelligence': return t('nav.dmoIntelligence', label);
      case 'Footfall & Sentiment': return t('nav.footfallSentiment', label);
      case 'Circuit Management': return t('nav.circuitManagement', label);
      case 'Admin Center': return t('nav.adminCenter', label);
      case 'Users & Hosts': return t('nav.usersHosts', label);
      default: return label;
    }
  };

  return (
    <div 
      className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-[#1C1A17] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[85vh] overflow-y-auto"
      data-testid="role-scoped-profile-dropdown"
    >
      {/* User Info Header */}
      <div className="px-4 py-2.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
            {currentUser?.name || (normalizedRole === 'host' ? 'Sunil Thakur' : normalizedRole === 'dmo' ? 'Dr. Rajesh Verma, IAS' : normalizedRole === 'admin' ? 'Chief Security Officer' : 'Aarav Sharma')}
          </p>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-black bg-brand/10 text-brand">
            {normalizedRole}
          </span>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
          {currentUser?.email || (normalizedRole === 'host' ? 'sunil.thakur@pineshade.in' : normalizedRole === 'dmo' ? 'officer.tourism@nic.in' : normalizedRole === 'admin' ? 'admin.ops@travelsathi.gov.in' : 'aarav.sharma@travelsathi.in')}
        </p>
        <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-secondary-800 dark:text-secondary-400">
          <span>{getRoleBadge(normalizedRole)}</span>
        </div>
      </div>

      {/* Portal & Persona Switcher */}
      <div className="py-2 px-3 bg-neutral-50 dark:bg-neutral-800/40">
        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 px-1">
          {t('nav.roleSwitcher', 'Portal & Role Switcher')}
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <button
            onClick={() => { switchRole('tourist'); navigate('/tourist'); handleClose(); }}
            className={`px-2 py-1 rounded text-left font-medium ${normalizedRole === 'tourist' ? 'bg-primary-800 text-white font-bold' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
          >
            {t('nav.tourist', 'Tourist')}
          </button>
          <button
            onClick={() => { switchRole('host'); navigate('/host'); handleClose(); }}
            className={`px-2 py-1 rounded text-left font-medium ${normalizedRole === 'host' ? 'bg-amber-800 text-white font-bold' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
          >
            {t('nav.host', 'Host')}
          </button>
          <button
            onClick={() => { switchRole('dmo'); navigate('/dmo'); handleClose(); }}
            className={`px-2 py-1 rounded text-left font-medium ${normalizedRole === 'dmo' ? 'bg-blue-800 text-white font-bold' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
          >
            {t('nav.dmo', 'DMO')}
          </button>
          <button
            onClick={() => { switchRole('admin'); navigate('/admin'); handleClose(); }}
            className={`px-2 py-1 rounded text-left font-medium ${normalizedRole === 'admin' ? 'bg-red-800 text-white font-bold' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
          >
            {t('nav.admin', 'Admin')}
          </button>
        </div>
      </div>

      {/* Role-Scoped Navigation Items — Zero cross-panel bleeding */}
      <div className="py-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300" data-testid={`menu-items-${normalizedRole}`}>
        <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {normalizedRole === 'host' ? t('nav.hostOperations', 'Host Operations') : normalizedRole === 'dmo' ? t('nav.dmoIntelligence', 'DMO Intelligence') : normalizedRole === 'admin' ? t('nav.administration', 'Administration') : t('nav.travelerModules', 'Traveler Modules')}
        </div>
        {items.map((item) => {
          const IconComp = item.icon || Compass;
          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
              onClick={handleClose}
            >
              <IconComp className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
              <span>{getLocalizedMenuLabel(item.label)}</span>
            </Link>
          );
        })}
      </div>

      {/* Common Settings: Dark Theme & Language Selection */}
      <div className="py-2 px-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 font-medium">
          <span className="flex items-center gap-2">
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{t('nav.darkTheme', 'Dark Theme')}</span>
          </span>
          <button
            onClick={toggleDarkMode}
            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
          >
            {darkMode ? t('nav.disable', 'Disable') : t('nav.enable', 'Enable')}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 font-medium">
          <span className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('nav.language', 'Language')}</span>
          </span>
          <select
            id="language-selector"
            data-testid="language-selector"
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded px-1.5 py-1 border border-neutral-300 dark:border-neutral-700 outline-none cursor-pointer"
          >
            {languages.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Common Sign Out */}
      <div className="py-1 text-xs">
        <Link
          to="/login"
          className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-neutral-800/80 font-semibold transition-colors"
          onClick={() => {
            localStorage.removeItem('travelsathi_token');
            localStorage.removeItem('travelsathi_user');
            handleClose();
          }}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('nav.signOut', 'Sign Out')}</span>
        </Link>
      </div>
    </div>
  );
}
