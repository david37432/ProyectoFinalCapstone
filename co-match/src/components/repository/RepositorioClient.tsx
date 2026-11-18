'use client';

import { useMemo, useRef, useState } from 'react';
import { ExternalLink, FileText, Link2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { addSolutionAction, deleteSolutionAction } from '@/lib/repository-actions';
import { REPO_BUCKET, repoFilePath, validateRepoFile, type RepoSolution } from '@/lib/repository';

interface Props {
  initialSolutions: RepoSolution[];
  userId: string;
}

const formatSize = (b: number | null) => (b ? `${(b / 1024 / 1024 >= 1 ? (b / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB')}` : '');

export default function RepositorioClient({ initialSolutions, userId }: Props) {
  const [solutions, setSolutions] = useState(initialSolutions);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return solutions;
    return solutions.filter((s) =>
      [s.title, s.description ?? '', s.authorName].some((t) => t.toLowerCase().includes(q))
    );
  }, [solutions, query]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setLinkUrl('');
    setFile(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    if (file) {
      const invalid = validateRepoFile(file);
      if (invalid) return setError(invalid);
    }
    setSaving(true);
    let uploaded: { path: string; name: string; size: number } | null = null;
    if (file) {
      const path = repoFilePath(userId, file.name, crypto.randomUUID().slice(0, 8));
      const { error: upErr } = await createClient().storage.from(REPO_BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) {
        setSaving(false);
        return setError(
          /bucket/i.test(upErr.message)
            ? 'El almacenamiento aún no está configurado (falta ejecutar la migración del repositorio).'
            : 'No se pudo subir el archivo. Inténtalo de nuevo.'
        );
      }
      uploaded = { path, name: file.name, size: file.size };
    }
    const res = await addSolutionAction({ title, description, linkUrl, file: uploaded });
    setSaving(false);
    if (!res.success || !res.solution) return setError(res.error ?? 'No se pudo publicar');
    setSolutions((prev) => [res.solution!, ...prev]);
    reset();
    setShowForm(false);
  };

  const remove = async (s: RepoSolution) => {
    if (!window.confirm(`¿Eliminar "${s.title}" del repositorio?`)) return;
    const res = await deleteSolutionAction(s.id);
    if (res.success) setSolutions((prev) => prev.filter((x) => x.id !== s.id));
    else window.alert(res.error ?? 'No se pudo eliminar');
  };

  const openFile = async (s: RepoSolution) => {
    if (!s.filePath) return;
    const { data, error: err } = await createClient().storage.from(REPO_BUCKET).createSignedUrl(s.filePath, 60);
    if (err || !data?.signedUrl) return window.alert('No se pudo abrir el archivo');
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const inputCls =
    'w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Repositorio de soluciones</h2>
          <p className="text-sm text-neutral-600">
            Soluciones ya realizadas que puedes usar como base para tu propio proyecto.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Subir solución'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 space-y-4">
          <div>
            <label htmlFor="repo-title" className="block text-sm font-medium text-neutral-700 mb-1">
              Nombre de la solución *
            </label>
            <input id="repo-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={inputCls} placeholder="Ej: App de inventario con Next.js" required />
          </div>
          <div>
            <label htmlFor="repo-desc" className="block text-sm font-medium text-neutral-700 mb-1">
              Descripción
            </label>
            <textarea id="repo-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} className={inputCls} placeholder="¿Qué problema resolvía y cómo?" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="repo-link" className="block text-sm font-medium text-neutral-700 mb-1">
                Enlace (GitHub, Drive, demo…)
              </label>
              <input id="repo-link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className={inputCls} placeholder="https://github.com/..." />
            </div>
            <div>
              <label htmlFor="repo-file" className="block text-sm font-medium text-neutral-700 mb-1">
                Archivo (máx. 10 MB)
              </label>
              <input id="repo-file" ref={fileInput} type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-neutral-600 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-neutral-100 file:text-neutral-700" />
            </div>
          </div>
          <p className="text-xs text-neutral-500">Agrega un enlace, un archivo o ambos. Será visible para todos los usuarios.</p>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-60">
            <Upload className="w-4 h-4" />
            {saving ? 'Publicando…' : 'Publicar'}
          </button>
        </form>
      )}

      <div className="relative max-w-md">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, descripción o autor…" aria-label="Buscar en el repositorio" className={inputCls + ' pl-10'} />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" aria-hidden="true" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 bg-white border border-neutral-200 rounded-xl">
          {solutions.length === 0 ? 'Aún no hay soluciones. ¡Sé el primero en subir una!' : 'Sin resultados para tu búsqueda.'}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <li key={s.id} className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-neutral-900 break-words">{s.title}</h3>
                {s.authorId === userId && (
                  <button type="button" onClick={() => remove(s)} className="p-1.5 rounded-lg text-danger hover:bg-danger/10" aria-label={`Eliminar ${s.title}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {s.description && <p className="text-sm text-neutral-600 whitespace-pre-line break-words">{s.description}</p>}
              <div className="flex flex-wrap gap-2 mt-auto">
                {s.linkUrl && (
                  <a href={s.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20">
                    <Link2 className="w-4 h-4" /> Abrir enlace <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {s.filePath && (
                  <button type="button" onClick={() => openFile(s)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 text-sm font-medium hover:bg-neutral-200 max-w-full">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{s.fileName ?? 'Archivo'}</span>
                    <span className="text-xs text-neutral-500">{formatSize(s.fileSize)}</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                {s.authorName} · {s.authorRole === 'dependencia' ? 'Dependencia' : 'Estudiante'} ·{' '}
                {new Date(s.createdAt).toLocaleDateString('es-CO')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
