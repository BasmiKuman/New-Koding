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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl animate-fade-in-up">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-glow animate-bounce-in">
            <Package className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            POS Rider
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Sistem Point of Sale untuk Distribusi
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-primary hover:opacity-90 shadow-glow text-white font-semibold rounded-xl transition-all duration-300" 
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Belum punya akun?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Daftar di sini
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-3">Demo Account</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Super Admin</p>
                <p className="text-gray-600 dark:text-gray-400">superadmin@pos.com</p>
                <p className="text-gray-500 dark:text-gray-500">admin123</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <p className="font-semibold text-green-600 dark:text-green-400 mb-1">Rider</p>
                <p className="text-gray-600 dark:text-gray-400">rider1@pos.com</p>
                <p className="text-gray-500 dark:text-gray-500">rider123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
