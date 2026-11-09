import Link from 'next/link';
import type { ReactNode } from 'react';

interface LegalPageProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="text-sm text-primary hover:underline">← Volver al inicio</Link>
        <article className="mt-6 bg-white border border-neutral-200 rounded-xl p-8 space-y-6 text-neutral-700 leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
          <header>
            <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
            <p className="text-sm text-neutral-500 mt-2">Última actualización: {updatedAt}</p>
          </header>
          {children}
        </article>
      </div>
    </main>
  );
}
