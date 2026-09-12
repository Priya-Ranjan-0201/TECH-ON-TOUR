import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, User } from 'lucide-react';

export default function MobileBottomNav() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Search', path: '/explore', icon: Search },
    { name: 'My Trips', path: '/trips', icon: Calendar },
    { name: 'Profile', path: '/travel-twin', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#141210]/95 backdrop-blur-md border-t border-neutral-200/90 dark:border-neutral-800/90 shadow-2xl">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                active
                  ? 'text-primary-800 dark:text-accent-400 font-bold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-primary-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px] scale-105' : 'stroke-2'} transition-transform`} />
              <span className="text-[10px] mt-1 font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
