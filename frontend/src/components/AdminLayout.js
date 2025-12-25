import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import {
  LayoutDashboard,
  Package,
  Factory,
  Truck,
  ClipboardList,
  Undo2,
  AlertTriangle,
  BarChart3,
  Users,
  LogOut,
  MapPin,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, color: 'primary' },
  { name: 'Produk', href: '/admin/products', icon: Package, color: 'accent' },
  { name: 'Produksi', href: '/admin/production', icon: Factory, color: 'secondary' },
  { name: 'Distribusi', href: '/admin/distribution', icon: Truck, color: 'purple' },
  { name: 'Opname', href: '/admin/stock-opname', icon: ClipboardList, color: 'primary' },
];

const moreNavigation = [
  { name: 'Return', href: '/admin/returns', icon: Undo2 },
  { name: 'Reject', href: '/admin/rejects', icon: AlertTriangle },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { name: 'GPS', href: '/admin/gps', icon: MapPin },
];

const superAdminNav = [
  { name: 'Users', href: '/admin/users', icon: Users },
];

export default function AdminLayout({ children }) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const { user, logout, isSuperAdmin } = useAuth();
  const location = useLocation();

  const allMoreNav = isSuperAdmin ? [...moreNavigation, ...superAdminNav] : moreNavigation;

  const getActiveColor = (color) => {
    const colors = {
      primary: 'text-blue-600 bg-blue-50',
      secondary: 'text-green-600 bg-green-50',
      accent: 'text-orange-500 bg-orange-50',
      purple: 'text-purple-600 bg-purple-50',
      default: 'text-blue-600 bg-blue-50',
    };
    return colors[color] || colors.default;
  };

  const isActive = (path) => location.pathname === path;
  const isMoreActive = allMoreNav.some(item => location.pathname === item.href);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 glass border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white">POS Rider</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-semibold text-sm">
                {user?.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* More Menu Modal */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMoreOpen(false)}>
          <div 
            className="absolute bottom-20 left-4 right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Menu Lainnya</h3>
              <button onClick={() => setMoreOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {allMoreNav.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                    isActive(item.href)
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              ))}
              <button
                onClick={() => { setMoreOpen(false); logout(); }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <LogOut className="w-6 h-6" />
                <span className="text-xs font-medium">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="pb-nav-safe">
        <div className="p-4 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-gray-200/50 dark:border-gray-700/50 shadow-xl">
        {/* Decorative top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
        
        <div 
          className="flex items-center justify-evenly h-16 max-w-screen-xl mx-auto"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {navigation.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group relative flex flex-col items-center justify-center flex-1 h-full min-w-[3.5rem] max-w-[5rem] px-1 space-y-1 transition-all duration-300",
                  "hover:scale-105 active:scale-95"
                )}
              >
                {active && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 animate-bounce-in" />
                )}
                <div className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                  active 
                    ? cn(getActiveColor(item.color), "shadow-md scale-110") 
                    : "text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 group-hover:text-gray-600"
                )}>
                  {active && (
                    <div className={cn(
                      "absolute inset-0 rounded-xl blur-sm opacity-50 animate-pulse-slow",
                      item.color === 'primary' && "bg-blue-500/30",
                      item.color === 'secondary' && "bg-green-500/30",
                      item.color === 'accent' && "bg-orange-500/30",
                      item.color === 'purple' && "bg-purple-500/30"
                    )} />
                  )}
                  <item.icon className={cn(
                    "w-5 h-5 relative z-10 transition-transform duration-300",
                    active && "animate-scale-in"
                  )} />
                </div>
                <span className={cn(
                  "text-[0.6rem] sm:text-xs font-semibold text-center leading-tight truncate max-w-full transition-all duration-300",
                  active ? "text-gray-900 dark:text-white" : "text-gray-400 group-hover:text-gray-600"
                )}>
                  {item.name}
                </span>
                {active && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full animate-fade-in" />
                )}
              </Link>
            );
          })}
          
          {/* More Button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "group relative flex flex-col items-center justify-center flex-1 h-full min-w-[3.5rem] max-w-[5rem] px-1 space-y-1 transition-all duration-300",
              "hover:scale-105 active:scale-95"
            )}
          >
            {isMoreActive && (
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 animate-bounce-in" />
            )}
            <div className={cn(
              "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
              isMoreActive 
                ? "bg-blue-50 text-blue-600 shadow-md scale-110" 
                : "text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 group-hover:text-gray-600"
            )}>
              <Menu className="w-5 h-5 relative z-10" />
            </div>
            <span className={cn(
              "text-[0.6rem] sm:text-xs font-semibold text-center leading-tight truncate max-w-full transition-all duration-300",
              isMoreActive ? "text-gray-900 dark:text-white" : "text-gray-400 group-hover:text-gray-600"
            )}>
              Lainnya
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
