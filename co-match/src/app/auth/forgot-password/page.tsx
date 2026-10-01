'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ email: '' });
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const getErrorMessage = (message: string): string => {
    if (message.includes('email rate limit exceeded') || message.includes('rate limit')) {
      return 'Has superado el límite de intentos de envío por correo. Por favor, espera unos minutos antes de solicitar un nuevo enlace.';
    }
    if (message.includes('User not found') || message.includes('Invalid email')) {
      return 'No encontramos ninguna cuenta asociada a este correo institucional.';
    }
    return message;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      console.error('Supabase resetPasswordForEmail error:', error.message);
      setError(getErrorMessage(error.message));
      setIsLoading(false);
      setCooldown(60);
      return;
    }

    setFormData({ email: '' });
    setSuccess(true);
    setIsLoading(false);
    setCooldown(60);
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

  const isButtonDisabled = isLoading || cooldown > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-neutral-200 p-8">
          <div className="flex flex-col items-center w-full mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4" aria-label="CO-MATCH Home">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-2xl">CM</span>
              </div>
              <span className="font-bold text-2xl text-neutral-900">CO-MATCH</span>
            </Link>
            <p className="text-sm text-neutral-500 w-full text-center">
              Universidad de La Sabana - Programa Aprende Trabajando (PAT)
            </p>
            <h1 className="text-2xl font-bold text-neutral-900 mt-4">Recuperar contraseña</h1>
            <p className="text-neutral-600 mt-2">
              Ingresa tu correo institucional para recibir un enlace de restablecimiento
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                ¡Enlace enviado!
              </h2>
              <p className="text-neutral-600 mb-6">
                Revisa tu bandeja de entrada o la carpeta de correo no deseado (spam).
              </p>
              <button
                onClick={handleBackToLogin}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-danger/10 text-danger text-sm" role="alert">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Correo institucional
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="usuario@unisabana.edu.co"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="email"
                  disabled={isButtonDisabled}
                  className="w-full px-4 py-2.5 rounded-lg border bg-white text-neutral-900 placeholder-neutral-400
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    disabled:bg-neutral-50 disabled:cursor-not-allowed
                    border-neutral-300 hover:border-neutral-400"
                />
              </div>

              <button
                type="submit"
                disabled={isButtonDisabled}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading && (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {cooldown > 0 ? `Reintentar en ${cooldown}s...` : 'Enviar enlace de recuperación'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="text-sm text-primary font-medium hover:underline transition-colors"
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}