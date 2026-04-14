import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Briefcase, Bell, CreditCard, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sets', icon: Package, label: 'Sets' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/pricing', icon: CreditCard, label: 'Pricing' },
];

/** Main application layout with sidebar and mobile bottom nav */
export function AppLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/sign-in');
  };

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-grailiq-dark flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">
            Grail<span className="text-grailiq-purple">IQ</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Know what your grails are worth</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-grailiq-purple/20 text-grailiq-purple-light'
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around py-2 z-40">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 text-xs font-medium py-1 px-2',
                isActive ? 'text-grailiq-purple' : 'text-gray-400',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-0.5 text-xs font-medium py-1 px-2 text-gray-400 hover:text-grailiq-purple"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </nav>
    </div>
  );
}
