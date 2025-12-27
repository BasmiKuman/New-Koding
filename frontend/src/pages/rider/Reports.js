import React, { useState, useEffect } from 'react';
import RiderLayout from '../../components/RiderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { reportsAPI, transactionsAPI } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, TrendingUp, ShoppingCart, Loader2, RefreshCw, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function RiderReports() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const [summaryRes, transRes] = await Promise.all([
        reportsAPI.getSummary(params),
        transactionsAPI.getAll(params)
      ]);
      setSummary(summaryRes.data);
      setTransactions(transRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
  }, []);

  const setPreset = (preset) => {
    const today = new Date();
    let start = new Date();
    
    switch(preset) {
      case 'today':
        start = new Date(today.setHours(0, 0, 0, 0));
        break;
      case 'week':
        start = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'month':
        start = new Date(today.setMonth(today.getMonth() - 1));
        break;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <RiderLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-[hsl(270,70%,60%)]" />
              Laporan Saya
            </h1>
            <p className="text-sm text-muted-foreground">Ringkasan penjualan Anda</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm" disabled={loading} className="hover-lift">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex gap-2 mb-3 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => setPreset('today')} className="hover-lift">
                <Calendar className="w-3 h-3 mr-1" />
                Hari Ini
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPreset('week')} className="hover-lift">
                7 Hari
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPreset('month')} className="hover-lift">
                30 Hari
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm bg-muted/50"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm bg-muted/50"
              />
              <Button size="sm" onClick={fetchData} className="bg-gradient-primary hover:opacity-90">
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Memuat laporan...</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-secondary/30 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent hover:shadow-glow-secondary transition-all duration-300 hover-lift animate-fade-in-up">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center shadow-md">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Penjualan</p>
                      <p className="text-xl font-bold text-secondary">{formatCurrency(summary?.total_sales || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:shadow-colored transition-all duration-300 hover-lift animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-md">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Transaksi</p>
                      <p className="text-xl font-bold text-primary">{summary?.total_transactions || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card className="border-border/50 overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <CardHeader className="pb-2 bg-gradient-to-r from-[hsl(270,70%,60%)]/5 to-transparent">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <div className="w-7 h-7 rounded-lg bg-gradient-purple flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-white" />
                  </div>
                  Riwayat Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium">Belum ada transaksi</p>
                    <p className="text-sm text-muted-foreground">Transaksi akan muncul di sini</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 20).map((trans, index) => (
                      <div 
                        key={trans.id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted/80 transition-colors duration-200 animate-fade-in-up"
                        style={{ animationDelay: `${(index + 3) * 50}ms` }}
                      >
                        <div>
                          <p className="font-medium text-sm text-foreground">{formatDateTime(trans.created_at)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs capitalize ${trans.payment_method === 'tunai' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}
                            >
                              {trans.payment_method}
                            </Badge>
                          </div>
                        </div>
                        <p className="font-bold text-secondary">{formatCurrency(trans.total_amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </RiderLayout>
  );
}
