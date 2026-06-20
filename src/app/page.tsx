'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkPassword, login, isAuthenticated } from '@/lib/auth';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 500));

    if (checkPassword(password)) {
      login();
      router.push('/dashboard');
    } else {
      setError('Contraseña incorrecta');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-willou-lightgray px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-willou-orange font-display">willou</h1>
          <p className="text-willou-gray mt-2">Panel de Facturación</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 gradient-willou rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-willou-dark">Bienvenido</h2>
            <p className="text-willou-gray text-sm">Ingresa tu contraseña para continuar</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:border-willou-orange focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200 text-center text-lg"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-4 gradient-willou text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Ingresando...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-willou-gray text-sm mt-6">
          © 2026 willou. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
