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
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShoppingCart,
  MapPin
} from 'lucide-react';
import { Button } from '../components/ui/Button';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Produk', href: '/admin/products', icon: Package },
  { name: 'Produksi', href: '/admin/production', icon: Factory },
  { name: 'Distribusi', href: '/admin/distribution', icon: Truck },
  { name: 'Stock Opname', href: '/admin/stock-opname', icon: ClipboardList },
  { name: 'Return', href: '/admin/returns', icon: Undo2 },
  { name: 'Reject/Rusak', href: '/admin/rejects', icon: AlertTriangle },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { name: 'GPS Tracking', href: '/admin/gps', icon: MapPin },
];

const superAdminNav = [
  { name: 'Kelola User', href: '/admin/users', icon: Users },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const { user, logout, isSuperAdmin } = useAuth();
  const location = useLocation();

  const allNav = isSuperAdmin ? [...navigation, ...superAdminNav] : navigation;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">POS Rider</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-1">
          {allNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-white border-r transition-all duration-300",
          collapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">POS Rider</span>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && "Keluar"}
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-4 ml-auto">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {user?.full_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
