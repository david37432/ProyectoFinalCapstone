'use client';

import { ChevronDown, ChevronUp, Search, Users, Briefcase } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface VacancySelectorProps {
  vacancies: {
    id: string;
    title: string;
    department_name: string;
    candidates_count: number;
    required_skills: string[];
  }[];
  selectedVacancyId: string | null;
  onSelect: (vacancyId: string | null) => void;
  className?: string;
}

export function VacancySelector({ vacancies, selectedVacancyId, onSelect, className }: VacancySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVacancies = vacancies.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.department_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedVacancy = vacancies.find(v => v.id === selectedVacancyId);

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'hover:border-primary/50 transition-colors'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div>
            {selectedVacancy ? (
              <>
                <p className="font-medium">{selectedVacancy.title}</p>
                <p className="text-sm text-neutral-500">{selectedVacancy.department_name} • {selectedVacancy.candidates_count} candidatos</p>
              </>
            ) : (
              <>
                <p className="font-medium">Seleccionar necesidad</p>
                <p className="text-sm text-neutral-500">{vacancies.length} necesidades publicadas</p>
              </>
            )}
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-80 overflow-hidden"
          role="listbox"
        >
          <div className="p-3 border-b border-neutral-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar necesidad..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredVacancies.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 text-sm">
                No se encontraron necesidades
              </div>
            ) : (
              <ul role="list" className="py-1">
                {filteredVacancies.map((vacancy) => (
                  <li key={vacancy.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(vacancy.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full px-4 py-3 text-left transition-colors flex items-center gap-3',
                        selectedVacancyId === vacancy.id
                          ? 'bg-primary/5 text-primary'
                          : 'hover:bg-neutral-50 text-neutral-700'
                      )}
                      role="option"
                      aria-selected={selectedVacancyId === vacancy.id}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{vacancy.title}</p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {vacancy.candidates_count} candidatos
                          </span>
                          <span>{vacancy.department_name}</span>
                        </div>
                        {vacancy.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {vacancy.required_skills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="px-1.5 py-0.5 text-[10px] bg-neutral-100 text-neutral-600 rounded">
                                {skill}
                              </span>
                            ))}
                            {vacancy.required_skills.length > 3 && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-neutral-100 text-neutral-500 rounded">
                                +{vacancy.required_skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedVacancyId === vacancy.id && (
                        <ChevronDown className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-3 border-t border-neutral-100">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
            >
              Limpiar selección
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}