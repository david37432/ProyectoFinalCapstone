'use client';

import { useState } from 'react';
import Link from 'next/link';
import { submitFeedbackAction } from './actions';

export default function ReportarPage() {
  const [category, setCategory] = useState('error');
  const [message, setMessage] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    const result = await submitFeedbackAction({ category, message, pageUrl });
    if (result.success) {
      setStatus('sent');
      setMessage('');
      setPageUrl('');
    } else {
      setStatus('idle');
      setError(result.error ?? 'No se pudo enviar el reporte');
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-primary hover:underline">← Volver al inicio</Link>
        <div className="mt-6 bg-white border border-neutral-200 rounded-xl p-8">
          <h1 className="text-2xl font-bold text-neutral-900">Reportar un problema</h1>
          <p className="text-neutral-600 mt-1 mb-6">
            ¿Encontraste un error o tienes una sugerencia? Cuéntanos y lo revisaremos.
          </p>

          {status === 'sent' ? (
            <div role="status" className="rounded-lg bg-success/10 border border-success/30 px-4 py-3 text-success">
              ¡Gracias! Recibimos tu reporte.
              <button type="button" onClick={() => setStatus('idle')} className="block mt-2 text-sm underline">
                Enviar otro
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-1.5">Tipo</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                >
                  <option value="error">Error</option>
                  <option value="sugerencia">Sugerencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1.5">Descripción</label>
                <textarea
                  id="message"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="¿Qué pasó? ¿Qué esperabas que pasara?"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="pageUrl" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Página donde ocurrió (opcional)
                </label>
                <input
                  id="pageUrl"
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                  placeholder="/dashboard/estudiante/explorar"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>
              {error && <p role="alert" className="text-sm text-danger">{error}</p>}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full rounded-lg bg-primary text-white py-2.5 font-medium hover:bg-primary-dark disabled:opacity-60"
              >
                {status === 'sending' ? 'Enviando…' : 'Enviar reporte'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
