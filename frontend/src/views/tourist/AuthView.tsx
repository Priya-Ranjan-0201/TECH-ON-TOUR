import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, 
  ShieldCheck, 
  Lock, 
  User, 
  Home, 
  Building2, 
  ShieldAlert, 
  ArrowRight,
  CheckCircle2,
  Mail,
  KeyRound,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import axios from 'axios';

export default function AuthView() {
  const navigate = useNavigate();
  const { switchRole, setCurrentUser } = useApp();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [selectedRole, setSelectedRole] = useState('tourist');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('aarav.sharma@travelsathi.in');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 4 Persona Profiles with authentic credentials & landing routes
  const PERSONA_PROFILES = [
    {
      id: 'tourist',
      title: 'Tourist',
      subtitle: 'Traveler & Explorer',
      defaultEmail: 'aarav.sharma@travelsathi.in',
      name: 'Aarav Sharma',
      landingRoute: '/explore',
      icon: Compass,
      desc: 'Autonomous trip planning, eco-homestays, verified bookings.'
    },
    {
      id: 'host',
      title: 'Host / Homestay',
      subtitle: 'Rural & Tribal Stays',
      defaultEmail: 'sunil.thakur@pineshade.in',
      name: 'Sunil Thakur',
      landingRoute: '/host',
      icon: Home,
      desc: 'Bookings list, revenue analytics, AI pricing co-pilot, PM-JUGA badge.'
    },
    {
      id: 'dmo',
      title: 'DMO / Government',
      subtitle: 'Tourism Intelligence',
      defaultEmail: 'officer.tourism@nic.in',
      name: 'Dr. Rajesh Verma, IAS',
      landingRoute: '/dmo',
      icon: Building2,
      desc: 'Footfall heatmaps, sentiment analytics, overtourism alerts, district safety.'
    },
    {
      id: 'admin',
      title: 'System Admin',
      subtitle: 'Platform Operations',
      defaultEmail: 'admin.ops@travelsathi.gov.in',
      name: 'Chief Security Officer',
      landingRoute: '/admin',
      icon: ShieldAlert,
      desc: 'User management, listing moderation, system health, multi-persona preview.'
    }
  ];

  const handleSelectPersona = (profile) => {
    setSelectedRole(profile.id);
    setEmail(profile.defaultEmail);
    setPassword('password123');
    setName(profile.name);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        const res = await axios.post('/api/auth/login', { email, password });
        if (res.data?.success && res.data.token) {
          localStorage.setItem('travelsathi_token', res.data.token);
          const userData = res.data.user;
          localStorage.setItem('travelsathi_user', JSON.stringify(userData));
          if (setCurrentUser) setCurrentUser(userData);
          switchRole(userData.role);
          
          const target = PERSONA_PROFILES.find(p => p.id === userData.role)?.landingRoute || '/explore';
          navigate(target);
        }
      } else if (authMode === 'register') {
        const res = await axios.post('/api/auth/register', {
          name: name.trim() || 'New Traveler',
          email,
          password,
          role: selectedRole
        });
        if (res.data?.success && res.data.token) {
          localStorage.setItem('travelsathi_token', res.data.token);
          const userData = res.data.user;
          localStorage.setItem('travelsathi_user', JSON.stringify(userData));
          if (setCurrentUser) setCurrentUser(userData);
          switchRole(userData.role);

          setSuccessMsg('Account created successfully! Redirecting...');
          const target = PERSONA_PROFILES.find(p => p.id === userData.role)?.landingRoute || '/explore';
          setTimeout(() => navigate(target), 600);
        }
      } else if (authMode === 'forgot') {
        const res = await axios.post('/api/auth/forgot-password', { email });
        setSuccessMsg(res.data.message || 'Password reset instructions dispatched.');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      const detail = err?.response?.data?.detail || err?.message || 'Authentication request failed.';
      setErrorMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-neutral-100 dark:bg-[#141210]">
      <div className="w-full max-w-xl bg-white dark:bg-[#1C1A17] border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* TravelSathi Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Compass className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900 dark:text-neutral-100">
            {authMode === 'login' && 'Sign In to TravelSathi'}
            {authMode === 'register' && 'Create Your Account'}
            {authMode === 'forgot' && 'Reset Password'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
            National Digital Public Infrastructure (DPI) for Tourism. Real database authentication with role security.
          </p>
        </div>

        {/* Tab Switcher: Login vs Register vs Forgot */}
        <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              authMode === 'login' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              authMode === 'register' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              authMode === 'forgot' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Forgot Password
          </button>
        </div>

        {/* 4-Persona Quick Selection Cards */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Quick Persona Autofill & Demo Logins
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PERSONA_PROFILES.map((profile) => {
              const Icon = profile.icon;
              const isSelected = selectedRole === profile.id;
              return (
                <div
                  key={profile.id}
                  onClick={() => handleSelectPersona(profile)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-left flex items-start gap-2.5 ${
                    isSelected 
                      ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20' 
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-amber-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {profile.title}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      {profile.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-700 dark:text-red-400 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div className="space-y-1 text-xs">
              <label className="font-bold text-neutral-700 dark:text-neutral-300">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:border-amber-600"
                />
              </div>
            </div>
          )}

          <div className="space-y-1 text-xs">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@travelsathi.in"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {authMode !== 'forgot' && (
            <div className="space-y-1 text-xs">
              <label className="font-bold text-neutral-700 dark:text-neutral-300">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:border-amber-600"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating with database...</span>
              </>
            ) : (
              <>
                <span>
                  {authMode === 'login' && 'Sign In with Credentials'}
                  {authMode === 'register' && 'Register Account'}
                  {authMode === 'forgot' && 'Send Reset Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
