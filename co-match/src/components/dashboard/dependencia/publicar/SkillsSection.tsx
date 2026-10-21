'use client';

import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/Input';

const SKILLS_OPTIONS = [
  'Python', 'Excel Avanzado', 'Power BI', 'JavaScript', 'SQL', 'Apps Script',
  'Tableau', 'R', 'Node.js', 'MySQL', 'RPA/UiPath', 'VBA', 'Zapier', 'Pandas'
];

interface SkillsSectionProps {
  skills: string[];
  onToggle: (skill: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showDropdown: boolean;
  onShowDropdown: (show: boolean) => void;
  error?: string;
  disabled?: boolean;
}

export function SkillsSection({ 
  skills, 
  onToggle, 
  searchValue, 
  onSearchChange, 
  showDropdown, 
  onShowDropdown,
  error,
  disabled 
}: SkillsSectionProps) {
  const filteredSkills = useMemo(() => {
    return SKILLS_OPTIONS.filter(skill => 
      skill.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onShowDropdown(false);
    }
  };

  return (
    <div className="relative" onClick={handleBackdropClick}>
      <div className="relative">
        <Input
          id="skills-search"
          type="text"
          value={searchValue}
          onChange={(e) => { onSearchChange(e.target.value); onShowDropdown(true); }}
          onFocus={() => onShowDropdown(true)}
          placeholder="Agregar habilidad (ej. Python, Power BI...)"
          className="w-64 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
          disabled={disabled}
        />
        {showDropdown && filteredSkills.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {filteredSkills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => onToggle(skill)}
                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
              >
                {skill}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.length === 0 ? (
          <p className="text-sm text-neutral-500 w-full">Añade tus habilidades técnicas y tecnologías</p>
        ) : (
          <div>
            {skills.map((skill, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                {skill}
                <button
                  type="button"
                  onClick={() => onToggle(skill)}
                  className="p-0.5 hover:bg-primary/20 rounded-full"
                  aria-label={"Eliminar " + skill}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}