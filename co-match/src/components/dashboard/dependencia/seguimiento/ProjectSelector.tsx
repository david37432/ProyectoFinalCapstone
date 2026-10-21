'use client';

import { ChevronDown, ChevronUp, Search, Briefcase, Users, Filter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { SeguimientoProject } from '@/lib/supabase/admin-queries';

interface ProjectSelectorProps {
  projects: SeguimientoProject[];
  selectedProject: SeguimientoProject | null;
  onSelect: (project: SeguimientoProject | null) => void;
  className?: string;
}

export function ProjectSelector({ projects, selectedProject, onSelect, className }: ProjectSelectorProps) {
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

  const filteredProjects = projects.filter(p => 
    p.vacancy_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.candidate_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            {selectedProject ? (
              <>
                <p className="font-medium truncate pr-8">{selectedProject.vacancy_title}</p>
                <p className="text-sm text-neutral-500 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  {selectedProject.candidate_name}
                  <span className="text-neutral-300">•</span>
                  <span>{selectedProject.department_name}</span>
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Seleccionar proyecto</p>
                <p className="text-sm text-neutral-500">{projects.length} proyectos en curso</p>
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
                placeholder="Buscar proyecto, estudiante o dependencia..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 text-sm">
                No se encontraron proyectos
              </div>
            ) : (
              <ul role="list" className="py-1">
                {filteredProjects.map((project) => (
                  <li key={project.application_id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(project);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full px-4 py-3 text-left transition-colors flex items-center gap-3',
                        selectedProject?.application_id === project.application_id
                          ? 'bg-primary/5 text-primary'
                          : 'hover:bg-neutral-50 text-neutral-700'
                      )}
                      role="option"
                      aria-selected={selectedProject?.application_id === project.application_id}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{project.vacancy_title}</p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {project.candidate_name}
                          </span>
                          <span className="text-neutral-300">•</span>
                          <span>{project.department_name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            project.milestones.some(m => m.status === 'in_progress') ? 'bg-primary/10 text-primary' :
                            project.milestones.every(m => m.status === 'completed') ? 'bg-success/10 text-success' :
                            'bg-warning/10 text-warning'
                          )}>
                            {project.milestones.filter(m => m.status === 'completed').length}/{project.milestones.length} hitos
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-medium',
                            project.milestones.some(m => m.status === 'in_progress') ? 'bg-primary/10 text-primary' :
                            project.milestones.every(m => m.status === 'completed') ? 'bg-success/10 text-success' :
                            'bg-warning/10 text-warning'
                          )}>
                            {project.milestones.some(m => m.status === 'in_progress') ? 'En curso' :
                            project.milestones.every(m => m.status === 'completed') ? 'Completado' :
                            'Pendiente'}
                          </span>
                        </div>
                      </div>
                      {selectedProject?.application_id === project.application_id && (
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
              <Filter className="w-4 h-4 mr-2" />
              Limpiar selección
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}