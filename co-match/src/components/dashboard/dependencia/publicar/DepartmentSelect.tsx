'use client';

import { useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { DEPARTMENTS, filterOptions } from '@/lib/catalog';
import { useClickOutside } from '@/lib/use-click-outside';

interface DepartmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/** Combo editable: se puede elegir una dependencia de la lista o escribir cualquier otra. */
export function DepartmentSelect({ value, onChange, error, disabled }: DepartmentSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapRef, () => setOpen(false), open);

  const options = useMemo(() => filterOptions(DEPARTMENTS, value), [value]);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Input
          id="department"
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); // Enter no publica el formulario
              setOpen(false);
            }
          }}
          placeholder="Selecciona o escribe el área/departamento"
          error={error}
          disabled={disabled}
          autoComplete="off"
          className="pr-10"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((o) => !o)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
          aria-label="Mostrar opciones"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
      {open && options.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => {
                onChange(dept);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                value === dept ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
