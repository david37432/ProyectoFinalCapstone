import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 bg-neutral-50 px-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-2xl">CM</span>
        </div>
        <span className="font-bold text-3xl text-neutral-900">CO-MATCH</span>
      </div>

      <p className="max-w-md text-center text-neutral-600">
        Conectamos a estudiantes de la Universidad de La Sabana con las dependencias que necesitan
        automatizar sus procesos a través del Programa de Asistencia Técnica (PAT).
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
        <Link
          href="/auth/login"
          className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium text-center hover:bg-primary-dark transition-colors"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/auth/register"
          className="px-6 py-2.5 rounded-lg border border-primary text-primary font-medium text-center hover:bg-primary/5 transition-colors"
        >
          Registrarse
        </Link>
      </div>
    </main>
  );
}
