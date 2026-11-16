'use client';

import { useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { SKILLS_OPTIONS, filterOptions } from '@/lib/catalog';
import { useClickOutside } from '@/lib/use-click-outside';

interface SkillsSectionProps {
  skills: string[];
  /** Agrega la habilidad si no está, o la quita si ya estaba. */
  onToggle: (skill: string) => void;
  error?: string;
  disabled?: boolean;
}

/** Selector de habilidades: elige de la lista o escribe una propia y presiona Enter (o "Agregar"). */
export function SkillsSection({ skills, onToggle, error, disabled }: SkillsSectionProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapRef, () => setOpen(false), open);

  const suggestions = useMemo(
    () => filterOptions(SKILLS_OPTIONS, query).filter((s) => !skills.some((k) => k.toLowerCase() === s.toLowerCase())),
    [query, skills]
  );
  const typed = query.trim();
  const canAddTyped =
    typed.length > 0 &&
    !skills.some((k) => k.toLowerCase() === typed.toLowerCase()) &&
    !suggestions.some((s) => s.toLowerCase() === typed.toLowerCase());

  const add = (skill: string) => {
    onToggle(skill);
    setQuery('');
    setOpen(false);
  };

  // Enter agrega la habilidad escrita; nunca envía el formulario
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!typed) return;
      const exact = suggestions.find((s) => s.toLowerCase() === typed.toLowerCase());
      add(exact ?? typed);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative flex gap-2">
        <Input
          id="skills-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe o elige una habilidad (ej. Python, Power BI...) y presiona Enter"
          disabled={disabled}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => typed && add(suggestions.find((s) => s.toLowerCase() === typed.toLowerCase()) ?? typed)}
          disabled={disabled || !typed}
          className="shrink-0 inline-flex items-center gap-1 px-3 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      {open && (suggestions.length > 0 || canAddTyped) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-56 overflow-y-auto">
          {canAddTyped && (
            <button
              type="button"
              onClick={() => add(typed)}
              className="w-full px-4 py-2 text-left text-sm text-primary font-medium hover:bg-primary/5"
            >
              + Agregar «{typed}»
            </button>
          )}
          {suggestions.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => add(skill)}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
            >
              {skill}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {skills.length === 0 ? (
          <p className="text-sm text-neutral-500 w-full">Agrega las habilidades técnicas que necesita el proyecto</p>
        ) : (
          skills.map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
              {skill}
              <button
                type="button"
                onClick={() => onToggle(skill)}
                disabled={disabled}
                className="p-0.5 hover:bg-primary/20 rounded-full"
                aria-label={'Eliminar ' + skill}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
