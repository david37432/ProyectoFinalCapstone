'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from './actions';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formDataToSend = new FormData();
    formDataToSend.append('email', formData.email);
    formDataToSend.append('password', formData.password);

    const result = await loginAction(formDataToSend);

    if (!result.success) {
      setError(result.error || 'Error al iniciar sesion');
      setIsLoading(false);
      return;
    }

    if (result.redirectTo) {
      router.push(result.redirectTo);
    } else {
      router.refresh();
    }
  };

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
            <h1 className='text-2xl font-bold text-neutral-900'>Iniciar sesion</h1>
            <p className='text-neutral-600 mt-2'>Accede a tu cuenta de la Universidad de La Sabana</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <div className='mb-4 p-3 rounded-lg bg-danger/10 text-danger text-sm' role='alert'>
                {error}
              </div>
            )}

            <div className='space-y-4'>
              <div>
                <label htmlFor='email' className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  Correo institucional
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  placeholder='usuario@unisabana.edu.co'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete='email'
                  disabled={isLoading}
                  className='w-full px-4 py-2.5 rounded-lg border bg-white text-neutral-900 placeholder-neutral-400
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    disabled:bg-neutral-50 disabled:cursor-not-allowed
                    border-neutral-300 hover:border-neutral-400'
                />
              </div>

              <div>
                <label htmlFor='password' className='block text-sm font-medium text-neutral-700 mb-1.5'>
                  Contrasena
                </label>
                <div className='relative'>
                  <input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='********'
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    autoComplete='current-password'
                    disabled={isLoading}
                    className='w-full px-4 py-2.5 rounded-lg border bg-white text-neutral-900 placeholder-neutral-400
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                      disabled:bg-neutral-50 disabled:cursor-not-allowed
                      border-neutral-300 hover:border-neutral-400 pr-12'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700'
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  >
                    {showPassword ? (
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                      </svg>
                    ) : (
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input type='checkbox' className='w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary' disabled={isLoading} />
                  <span className='text-sm text-neutral-600'>Recordarme</span>
                </label>
                <Link href='/auth/forgot-password' className='text-sm text-primary hover:underline'>
                  ¿Olvidaste tu contrasena?
                </Link>
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
                Iniciar sesion
              </button>
            </div>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-neutral-600 text-sm'>
              ¿No tienes cuenta?{' '}
              <Link href='/auth/register' className='text-primary font-medium hover:underline'>
                Registrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}