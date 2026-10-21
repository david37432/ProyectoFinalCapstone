'use client';

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';

const DEPARTMENTS = [
  'Coordinación PAT',
  'Dirección de Estudiantes',
  'Recursos Humanos',
  'Facultad de Ingeniería',
  'Biblioteca',
  'Finanzas',
  'Dirección de Comunicaciones',
  'Dirección de Tecnologías de Información',
  'Centro de Emprendimiento',
  'Facultad de Ciencias Económicas y Administrativas',
  'Facultad de Derecho',
  'Facultad de Medicina',
  'Facultad de Ciencias',
  'Dirección de Bienestar Universitario',
  'Centro de Emprendimiento',
];

interface DepartmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function DepartmentSelect({ value, onChange, error, disabled }: DepartmentSelectProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');

  const filteredDepartments = useMemo(() => {
    return DEPARTMENTS.filter(dept => 
      dept.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative" onClick={handleBackdropClick}>
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value) setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Selecciona o escribe el área/departamento"
          readOnly
          className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
          disabled={disabled}
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
      </div>
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar departamento..."
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
          {filteredDepartments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => {
                onChange(dept);
                setShowDropdown(false);
                setSearch('');
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${value === dept ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
            >
              {dept}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}