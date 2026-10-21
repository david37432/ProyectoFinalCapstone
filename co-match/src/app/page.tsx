import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="flex items-center gap-3 text-primary">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg">CM</span>
        </div>
        <span className="font-semibold text-xl text-neutral-900">CO-MATCH</span>
      </div>
      <p className="mt-4 text-center text-neutral-600">
        <Link href="/auth/login" className="text-primary hover:underline font-medium">
          Iniciar sesión
        </Link>
        <span className="mx-2">o</span>
        <Link href="/auth/register" className="text-primary hover:underline font-medium">
          Registrarse
        </Link>
      </p>
    </div>
  );
}