import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Package, User, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'rider') {
        navigate('/rider');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[hsl(270,70%,60%)]/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-xl border-border/50 bg-card/80 backdrop-blur-xl animate-fade-in-up">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-glow animate-bounce-in hover-scale">
            <Package className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gradient-shine">
            POS Rider
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sistem Point of Sale untuk Distribusi
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm animate-fade-in border border-destructive/20">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-muted/50 border-border rounded-xl focus:border-primary focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 bg-muted/50 border-border rounded-xl focus:border-primary focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-primary hover:opacity-90 shadow-glow text-white font-semibold rounded-xl transition-all duration-300 hover-lift" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Belum punya akun?{' '}
              <Link to="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Daftar di sini
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Demo Account</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer hover-lift"
                onClick={() => { setEmail('superadmin@pos.com'); setPassword('admin123'); }}
              >
                <p className="font-semibold text-primary mb-1">Super Admin</p>
                <p className="text-muted-foreground">superadmin@pos.com</p>
                <p className="text-muted-foreground/70">admin123</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-xl border border-secondary/20 hover:border-secondary/40 transition-colors cursor-pointer hover-lift"
                onClick={() => { setEmail('rider1@pos.com'); setPassword('rider123'); }}
              >
                <p className="font-semibold text-secondary mb-1">Rider</p>
                <p className="text-muted-foreground">rider1@pos.com</p>
                <p className="text-muted-foreground/70">rider123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
