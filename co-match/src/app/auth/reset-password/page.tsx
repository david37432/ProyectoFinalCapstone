'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Suspense } from 'react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Tu sesión ha expirado o no es válida. Por favor, solicita un nuevo enlace de recuperación.');
      }
      setSessionChecked(true);
    };
    checkSession();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/auth/login');
    }, 2000);
  };

  if (!sessionChecked) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12'>
        <div className='w-full max-w-md'>
          <div className='bg-white rounded-xl border border-neutral-200 p-8 text-center'>
            <svg className='animate-spin h-8 w-8 text-primary mx-auto' viewBox='0 0 24 24'>
              <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='3' fill='none' />
              <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
            </svg>
            <p className='text-neutral-600 mt-4'>Verificando sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12'>
      <div className='w-full max-w-md'>
        <div className='bg-white rounded-xl border border-neutral-200 p-8'>
          <div className='text-center mb-8 border-b border-neutral-200 pb-6'>
            <Link href='/' className='inline-flex items-center gap-2 mb-4' aria-label='CO-MATCH Home'>
              <div className='w-12 h-12 rounded-xl bg-primary flex items-center justify-center'>
                <span className='text-white font-bold text-2xl'>CM</span>
              </div>
              <span className='font-bold text-2xl text-neutral-900'>CO-MATCH</span>
            </Link>
            <p className='text-sm text-neutral-500 w-full text-center'>
              Universidad de La Sabana - Programa Aprende Trabajando (PAT)
            </p>
          </div>

          <div className='text-center mb-8'>
            <h1 className='text-2xl font-bold text-neutral-900'>Establecer Nueva Contraseña</h1>
          </div>

          {error && !success && (
            <div className='mb-4 p-3 rounded-lg bg-danger/10 text-danger text-sm' role='alert'>
              {error}
            </div>
          )}

          {success && (
            <div className='mb-4 p-3 rounded-lg bg-success/10 text-success text-sm' role='alert'>
              ¡Contraseña cambiada con éxito! Redirigiendo al login...
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label htmlFor='password' className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  Nueva contraseña
                </label>
                <input
                  id='password'
                  name='password'
                  type='password'
                  placeholder='********'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete='new-password'
                  disabled={isLoading}
                  className='w-full px-4 py-2.5 rounded-lg border bg-white text-neutral-900 placeholder-neutral-400
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    disabled:bg-neutral-50 disabled:cursor-not-allowed
                    border-neutral-300 hover:border-neutral-400'
                />
              </div>

              <div>
                <label htmlFor='confirmPassword' className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  Confirmar nueva contraseña
                </label>
                <input
                  id='confirmPassword'
                  name='confirmPassword'
                  type='password'
                  placeholder='********'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete='new-password'
                  disabled={isLoading}
                  className='w-full px-4 py-2.5 rounded-lg border bg-white text-neutral-900 placeholder-neutral-400
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    disabled:bg-neutral-50 disabled:cursor-not-allowed
                    border-neutral-300 hover:border-neutral-400'
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className='mt-1 text-xs text-danger'>Las contraseñas no coinciden</p>
                )}
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isLoading && (
                  <svg className='animate-spin h-5 w-5' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='3' fill='none' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
                  </svg>
                )}
                Cambiar contraseña
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className='min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12'>
        <div className='w-full max-w-md'>
          <div className='bg-white rounded-xl border border-neutral-200 p-8 text-center'>
            <svg className='animate-spin h-8 w-8 text-primary mx-auto' viewBox='0 0 24 24'>
              <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='3' fill='none' />
              <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
            </svg>
            <p className='text-neutral-600 mt-4'>Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}