'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    document_number: '',
    phone: '',
    role: 'postulante',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!formData.email.endsWith('@unisabana.edu.co')) {
      setError('El correo debe ser institucional (@unisabana.edu.co)');
      return;
    }

    setIsLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
          document_number: formData.document_number,
          phone: formData.phone,
          role: formData.role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    if (!data.user) {
      setError('Error al crear la cuenta');
      setIsLoading(false);
      return;
    }

    if (data.user.identities?.length === 0) {
      setError('Este correo ya está registrado');
      setIsLoading(false);
      return;
    }

    // Crear/actualizar perfil en la tabla profiles usando upsert
    const roleForProfile = formData.role === 'reclutador' ? 'dependencia' : 'estudiante';
    
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: formData.email,
        full_name: formData.full_name,
        role: roleForProfile,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (profileError) {
      console.warn('Profile upsert warning (non-blocking):', profileError.message);
      // No interrumpir el flujo del usuario, el trigger de BD también crea el perfil
    }

    router.refresh();
    // Redirigir según el rol seleccionado
    if (formData.role === 'postulante') {
      router.push('/dashboard/estudiante/explorar');
    } else {
      router.push('/dashboard/dependencia');
    }
  };

  const handleBack = () => setStep(1);
  const handleNext = () => setStep(2);

  const roleOptions = [
    { value: 'postulante', label: 'Estudiante PAT' },
    { value: 'reclutador', label: 'Administrador / Dependencia' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Tarjeta principal con layout vertical */}
        <div className="bg-white rounded-xl border border-neutral-200 p-8">
          {/* Encabezado institucional - Ocupa todo el ancho, arriba del título */}
          <div className="text-center mb-8 border-b border-neutral-200 pb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-4" aria-label="CO-MATCH Home">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-2xl">CM</span>
              </div>
              <span className="font-bold text-2xl text-neutral-900">CO-MATCH</span>
            </Link>
            {/* Leyenda institucional - Ancho completo, arriba del título */}
            <p className="text-sm text-neutral-500 w-full text-center">
              Universidad de La Sabana - Programa Aprende Trabajando (PAT)
            </p>
          </div>

          {/* Título del formulario */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">Crear cuenta</h1>
            <p className="text-neutral-600 mt-2">Únete a la plataforma de talento de la Universidad de La Sabana</p>
          </div>

          {/* Indicador de pasos */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${step === 1 ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                1
              </div>
              <div className={`w-8 h-1 bg-neutral-200 ${step === 2 ? 'bg-primary' : ''}`} />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${step === 2 ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                2
              </div>
            </div>
            <p className="text-center text-sm text-neutral-500 mt-2">
              {step === 1 ? 'Información de acceso y tipo de usuario' : 'Datos personales y contacto'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 text-danger text-sm" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                {/* Email - Label arriba, Input abajo */}
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
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 rounded-lg border bg-white text-neutral-900 placeholder-neutral-400
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                      disabled:bg-neutral-50 disabled:cursor-not-allowed
                      border-neutral-300 hover:border-neutral-400"
                  />
                </div>

                {/* Password - Label arriba, Input abajo */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      autoComplete="new-password"
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 rounded-lg border bg-white text-neutral-900 placeholder-neutral-400
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                        disabled:bg-neutral-50 disabled:cursor-not-allowed
                        border-neutral-300 hover:border-neutral-400 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password - Label arriba, Input abajo */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repite tu contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      autoComplete="new-password"
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 rounded-lg border bg-white text-neutral-900 placeholder-neutral-400
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                        disabled:bg-neutral-50 disabled:cursor-not-allowed
                        border-neutral-300 hover:border-neutral-400 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                      aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Role Select - Label arriba, Select abajo */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Tipo de usuario
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 rounded-lg border bg-white text-neutral-900
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                      disabled:bg-neutral-50 disabled:cursor-not-allowed
                      border-neutral-300 hover:border-neutral-400"
                  >
                    <option value="">Selecciona tu rol</option>
                    <option value="postulante">Estudiante PAT</option>
                    <option value="reclutador">Administrador / Dependencia</option>
                  </select>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Full Name - Label arriba, Input abajo */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Nombre completo
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Juan Pérez García"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    autoComplete="name"
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 rounded-lg border bg-white text-neutral-900 placeholder-neutral-400
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                      disabled:bg-neutral-50 disabled:cursor-not-allowed
                      border-neutral-300 hover:border-neutral-400"
                  />
                </div>

                {/* Document Number - Label arriba, Input abajo */}
                <div>
                  <label htmlFor="document_number" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Número de documento
                  </label>
                  <input
                    id="document_number"
                    name="document_number"
                    type="text"
                    placeholder="1234567890"
                    value={formData.document_number}
                    onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 rounded-lg border bg-white text-neutral-900 placeholder-neutral-400
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                      disabled:bg-neutral-50 disabled:cursor-not-allowed
                      border-neutral-300 hover:border-neutral-400"
                  />
                </div>

                {/* Phone - Label arriba, Input abajo */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Teléfono
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+57 300 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    autoComplete="tel"
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 rounded-lg border bg-white text-neutral-900 placeholder-neutral-400
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                      disabled:bg-neutral-50 disabled:cursor-not-allowed
                      border-neutral-300 hover:border-neutral-400"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              {step === 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              )}
              {step === 2 && (
                <>
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading && (
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    Crear cuenta
                  </button>
                </>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-600 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}