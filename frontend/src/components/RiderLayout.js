import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { useGPS } from '../hooks/useGPS';
import {
  ShoppingCart,
  Trophy,
  FileText,
  Settings,
  LogOut
} from 'lucide-react';

const navigation = [
  { name: 'POS', href: '/rider', icon: ShoppingCart },
  { name: 'Leaderboard', href: '/rider/leaderboard', icon: Trophy },
  { name: 'Laporan', href: '/rider/reports', icon: FileText },
  { name: 'Pengaturan', href: '/rider/settings', icon: Settings },
];

export default function RiderLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Initialize GPS tracking
  useGPS();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">POS Rider</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-xs text-gray-500">Rider</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {user?.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="p-4">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-blue-600")} />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="flex flex-col items-center gap-1 px-4 py-2 text-red-500"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-medium">Keluar</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
