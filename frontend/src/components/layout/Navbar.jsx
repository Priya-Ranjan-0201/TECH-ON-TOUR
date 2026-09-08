import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Compass, 
  Menu, 
  X, 
  MapPin, 
  Calendar, 
  Home, 
  BarChart3, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get('http://localhost:8000/api/health', { timeout: 2500 });
        setBackendOnline(true);
      } catch (e) {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Explore 12k Catalog', path: '/explore', icon: MapPin },
    { name: 'Travel Twin AI', path: '/plan', icon: Calendar },
    { name: 'Host Hub (PM-JUGA)', path: '/host', icon: ShieldCheck },
    { name: 'DMO Command Center', path: '/dmo', icon: BarChart3 },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-primary-800 text-ivory border-b border-primary-900/40 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-ts bg-accent-400/20 flex items-center justify-center border border-accent-400/40 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 text-accent-400" />
            </div>
            <div>
              <span className="text-xl font-display font-bold tracking-tight text-ivory">
                Travel<span className="text-accent-400">Sathi</span>
              </span>
              <span className="hidden md:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider bg-accent-400/20 text-accent-400 px-2 py-0.5 rounded-full border border-accent-400/30">
                National DPI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-ts text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-primary-900 text-accent-400'
                      : 'text-ivory/90 hover:text-ivory hover:bg-primary-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Status & Actions */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className={`flex items-center space-x-2 text-[11px] px-3 py-1 rounded-full border font-medium ${
              backendOnline
                ? 'bg-secondary-50 text-secondary-900 border-secondary-800/40'
                : 'bg-alert-50 text-alert-800 border-alert-600/40'
            }`}>
              <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-secondary-800 animate-pulse' : 'bg-alert-600'}`} />
              <span>{backendOnline ? 'FastAPI Gateway Live' : 'Backend Offline'}</span>
            </div>

            <button className="bg-accent-400 hover:bg-accent-600 text-neutral-900 text-xs font-bold px-3.5 py-1.5 rounded-ts shadow-sm transition-all active:scale-95">
              SIH 2026 Jury
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-ts text-ivory hover:bg-primary-900 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden bg-primary-900 border-t border-primary-800/60 px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-ts text-sm font-medium ${
                  active ? 'bg-primary-800 text-accent-400' : 'text-ivory hover:bg-primary-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-primary-800/50 flex items-center justify-between">
            <span className="text-xs text-ivory/80">API Gateway Status:</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
              backendOnline ? 'bg-secondary-50 text-secondary-800' : 'bg-alert-50 text-alert-800'
            }`}>
              {backendOnline ? 'Online (Port 8000)' : 'Offline'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
