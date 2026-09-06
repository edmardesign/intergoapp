import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { translateAuthError } from '@/lib/auth-errors';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      
      // Redirect logic is handled by the root '/' route
      navigate({ to: '/' } as any);
    } catch (err: unknown) {
      setError(translateAuthError(err));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <header className="mb-12 pt-8">
        <Link to="/onboarding" className="p-2 -ml-2 text-secondary block w-fit">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-screen-title mt-6">Bem-vindo de volta</h1>
        <p className="text-body-secondary mt-2">Acesse sua conta para continuar.</p>
      </header>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="text-label text-secondary mb-2 block">E-mail corporativo</label>
          <input 
            required
            type="email"
            className="input-field"
            placeholder="nome@exemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="relative">
          <label className="text-label text-secondary mb-2 block">Senha</label>
          <input 
            required
            type={showPassword ? 'text' : 'password'}
            className="input-field pr-12"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-10 text-secondary"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {error && (
          <p className="text-error text-sm text-center bg-error/10 p-3 rounded-lg">{error}</p>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary mt-4"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
        </button>
      </form>
      
      <div className="mt-auto pt-10 text-center">
        <p className="text-body-secondary text-sm">
          Ainda não tem conta? <Link to="/onboarding" className="text-primary font-bold">Cadastrar</Link>
        </p>
      </div>
    </div>
  );
}
