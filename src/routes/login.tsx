import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, Eye, EyeOff, LogIn } from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: LoginComponent
})

function LoginComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      // @ts-ignore
      navigate({ to: '/' })
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 items-center justify-center">
      <div className="w-16 h-16 bg-primary rounded-[16px] mb-8 flex items-center justify-center">
        <span className="text-white text-3xl font-bold italic">L</span>
      </div>

      <h1 className="text-screen-title mb-8">Bem-vindo de volta</h1>

      <form onSubmit={handleLogin} className="w-full space-y-6">
        <div>
          <label className="text-label text-secondary ml-1 mb-2 block">E-mail</label>
          <input 
            type="email"
            placeholder="seu@email.com"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-label text-secondary ml-1 mb-2 block">Senha</label>
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="input-field pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-error/10 text-error rounded-[16px] text-label text-center">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <>
              <LogIn size={20} className="mr-2" />
              Entrar
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-body-secondary text-secondary">
          Não tem uma conta?{' '}
          <Link to="/onboarding" className="text-primary font-semibold">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
