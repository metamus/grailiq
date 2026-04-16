import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Briefcase, Bell, CreditCard, Heart, LogOut, X, Settings } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import { OnboardingModal } from '@/components/OnboardingModal';
import { CommandPalette } from '@/components/CommandPalette';

const navItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/sets', icon: Package, label: 'Sets' },
  { to: '/app/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/app/watchlist', icon: Heart, label: 'Watchlist' },
  { to: '/app/alerts', icon: Bell, label: 'Alerts' },
  { to: '/app/pricing', icon: CreditCard, label: 'Pricing' },
];

/** Main application layout with sidebar and mobile bottom nav */
export function AppLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showAppBanner, setShowAppBanner] = useState(true);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/sign-in');
  };

  return (
    <div className="min-h-screen flex bg-grailiq-ink">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-grailiq-dark border-r border-white/5 flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
            Grail<span className="text-grailiq-purple-light">IQ</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 italic">Know what your <span className="font-display">grails</span> are worth</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/app'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-grailiq-gold/20 text-grailiq-gold-light'
                    : 'text-gray-400 hover:text-white hover:bg-white/5',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10 space-y-3">
          {user && (
            <div className="px-3 py-2 bg-white/5 rounded-lg">
              <p className="text-xs text-gray-400">Signed in as</p>
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
            </div>
          )}
          <NavLink
            to="/app/account"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-grailiq-gold/20 text-grailiq-gold-light'
                  : 'text-gray-400 hover:text-white hover:bg-white/5',
              )
            }
          >
            <Settings className="h-5 w-5" />
            Account
          </NavLink>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0">
        {/* Mobile App Promotion Banner */}
        {showAppBanner && (
          <div className="md:hidden mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-lg border border-grailiq-purple/30 bg-gradient-to-r from-grailiq-purple/10 to-transparent p-3 flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-grailiq-purple-light uppercase tracking-wider">
                Get push restock alerts
              </p>
              <p className="text-sm font-medium text-white">Download the iPhone app</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://apps.apple.com/us/app/grailiq/id6740123456"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 rounded text-xs font-semibold bg-grailiq-purple text-white hover:bg-grailiq-purple-light transition-colors whitespace-nowrap"
              >
                App Store
              </a>
              <button
                onClick={() => setShowAppBanner(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
      <OnboardingModal />
      <CommandPalette />

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-grailiq-dark/95 backdrop-blur-xl border-t border-white/10 flex justify-around py-2 z-40">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 text-xs font-medium py-1 px-2',
                isActive ? 'text-grailiq-purple-light' : 'text-gray-400 hover:text-white',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-0.5 text-xs font-medium py-1 px-2 text-gray-400 hover:text-white"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </nav>
    </div>
  );
}
