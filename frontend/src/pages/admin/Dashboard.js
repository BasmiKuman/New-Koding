import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { reportsAPI, returnsAPI, rejectsAPI } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Sparkles,
  Undo2,
  RefreshCw,
  Trophy,
  Crown,
  Award,
  Medal,
  User
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

// Stats Card Component with enhanced design
const StatsCard = ({ title, value, icon: Icon, variant = 'default' }) => {
  const variantStyles = {
    default: "border-border/50 bg-card hover:shadow-md",
    primary: "border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:shadow-colored hover:border-primary/50",
    secondary: "border-secondary/30 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent hover:shadow-glow-secondary hover:border-secondary/50",
    accent: "border-accent/30 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent hover:shadow-glow-accent hover:border-accent/50",
    destructive: "border-destructive/30 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent hover:border-destructive/50",
    purple: "border-[hsl(270,70%,60%)]/30 bg-gradient-to-br from-[hsl(270,70%,60%)]/10 via-[hsl(270,70%,60%)]/5 to-transparent hover:border-[hsl(270,70%,60%)]/50",
  };

  const iconBgStyles = {
    default: "bg-primary/10 group-hover:bg-primary/20",
    primary: "bg-gradient-primary text-white",
    secondary: "bg-gradient-secondary text-white",
    accent: "bg-gradient-accent text-white",
    destructive: "bg-gradient-to-br from-destructive to-red-400 text-white",
    purple: "bg-gradient-purple text-white",
  };

  return (
    <Card className={`group overflow-hidden transition-all duration-300 hover-lift backdrop-blur-sm ${variantStyles[variant]}`}>
      <CardContent className="p-4 sm:p-5 relative">
        {/* Decorative corner accent */}
        <div className={`absolute top-0 right-0 w-20 h-20 opacity-20 rounded-bl-full transition-opacity duration-300 group-hover:opacity-30
          ${variant === 'primary' ? 'bg-gradient-primary' : ''}
          ${variant === 'secondary' ? 'bg-gradient-secondary' : ''}
          ${variant === 'accent' ? 'bg-gradient-accent' : ''}
          ${variant === 'destructive' ? 'bg-gradient-to-br from-destructive to-red-400' : ''}
          ${variant === 'purple' ? 'bg-gradient-purple' : ''}
          ${variant === 'default' ? 'bg-primary/20' : ''}
        `} />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {title}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-foreground truncate animate-fade-in">
              {value}
            </p>
          </div>
          
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-300 shadow-md group-hover:scale-110 ${iconBgStyles[variant]}`}>
            <Icon className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300" />
          </div>
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none transform -skew-x-12" />
      </CardContent>
    </Card>
  );
};

// Leaderboard Card Component
const LeaderboardCard = ({ leaderboard, loading }) => {
  const getRankStyle = (index) => {
    switch(index) {
      case 0: return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white';
      case 1: return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700';
      case 2: return 'bg-gradient-to-br from-orange-400 to-orange-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-4 h-4" />;
    if (index === 1) return <Award className="w-4 h-4" />;
    if (index === 2) return <Medal className="w-4 h-4" />;
    return <span className="text-xs font-bold">{index + 1}</span>;
  };

  return (
    <Card className="overflow-hidden border-border/50 hover:shadow-md transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-accent/5 to-transparent pb-2">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          Leaderboard Rider
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">Belum ada data penjualan</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((rider, index) => (
              <div
                key={rider.rider_id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover-lift animate-fade-in-up ${
                  index < 3 ? 'bg-muted/50' : 'bg-muted/30'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getRankStyle(index)}`}>
                  {getRankIcon(index)}
                </div>
                <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                  {rider.avatar_url ? (
                    <img src={rider.avatar_url} alt={rider.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{rider.full_name}</p>
                  <p className="text-xs text-muted-foreground">{rider.total_transactions} transaksi</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-secondary">{formatCurrency(rider.total_sales)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [pendingRejects, setPendingRejects] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, returnsRes, rejectsRes, leaderboardRes] = await Promise.all([
        reportsAPI.getSummary({}),
        returnsAPI.getAll('pending'),
        rejectsAPI.getAll('pending'),
        reportsAPI.getLeaderboard({})
      ]);
      setStats(summaryRes.data);
      setPendingReturns(returnsRes.data);
      setPendingRejects(rejectsRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statCards = [
    {
      title: 'Total Penjualan',
      value: stats ? formatCurrency(stats.total_sales) : '-',
      icon: TrendingUp,
      variant: 'secondary',
    },
    {
      title: 'Total Transaksi',
      value: stats?.total_transactions || 0,
      icon: ShoppingCart,
      variant: 'primary',
    },
    {
      title: 'Total Kerugian',
      value: stats ? formatCurrency(stats.total_loss) : '-',
      icon: AlertTriangle,
      variant: 'destructive',
    },
    {
      title: 'Profit Bersih',
      value: stats ? formatCurrency(stats.net_profit) : '-',
      icon: Sparkles,
      variant: 'purple',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Ringkasan sistem POS Rider</p>
          </div>
          <Button onClick={fetchData} variant="outline" disabled={loading} className="hover-lift">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((stat, index) => (
            <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <StatsCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                variant={stat.variant}
              />
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Pending Returns */}
          <Card className="overflow-hidden border-border/50 hover:shadow-md transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-accent/5 to-transparent pb-2">
              <CardTitle className="flex items-center gap-2 text-foreground text-sm">
                <div className="w-7 h-7 rounded-lg bg-gradient-accent flex items-center justify-center">
                  <Undo2 className="w-3.5 h-3.5 text-white" />
                </div>
                Return Menunggu
                {pendingReturns.length > 0 && (
                  <Badge variant="warning" className="ml-1">{pendingReturns.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {pendingReturns.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">Tidak ada return menunggu</p>
              ) : (
                <div className="space-y-2">
                  {pendingReturns.slice(0, 4).map((ret, index) => (
                    <div 
                      key={ret.id} 
                      className="flex items-center justify-between p-2.5 bg-muted/50 rounded-xl hover:bg-muted/80 transition-colors duration-200 animate-fade-in-up"
                      style={{ animationDelay: `${(index + 5) * 50}ms` }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate">{ret.products?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{ret.profiles?.full_name} - {ret.quantity} pcs</p>
                      </div>
                      <Badge variant="warning" className="text-[10px] ml-2">Pending</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Rejects */}
          <Card className="overflow-hidden border-border/50 hover:shadow-md transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-destructive/5 to-transparent pb-2">
              <CardTitle className="flex items-center gap-2 text-foreground text-sm">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-destructive to-red-400 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                </div>
                Reject Menunggu
                {pendingRejects.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{pendingRejects.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {pendingRejects.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">Tidak ada reject menunggu</p>
              ) : (
                <div className="space-y-2">
                  {pendingRejects.slice(0, 4).map((rej, index) => (
                    <div 
                      key={rej.id} 
                      className="flex items-center justify-between p-2.5 bg-muted/50 rounded-xl hover:bg-muted/80 transition-colors duration-200 animate-fade-in-up"
                      style={{ animationDelay: `${(index + 5) * 50}ms` }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate">{rej.products?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{rej.profiles?.full_name} - {rej.quantity} pcs</p>
                      </div>
                      <Badge variant="destructive" className="text-[10px] ml-2">Pending</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <LeaderboardCard leaderboard={leaderboard} loading={loading} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
