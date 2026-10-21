'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, X, Check, ChevronDown, ChevronUp, Save, X as XIcon } from 'lucide-react';
import { DepartmentSelect } from '@/components/dashboard/dependencia/publicar/DepartmentSelect';
import { SkillsSection } from '@/components/dashboard/dependencia/publicar/SkillsSection';
import { WeeklyHoursSelect } from '@/components/dashboard/dependencia/publicar/WeeklyHoursSelect';
import { DurationSelect } from '@/components/dashboard/dependencia/publicar/DurationSelect';
import { ActionButtons } from '@/components/dashboard/dependencia/publicar/ActionButtons';

const SKILLS_OPTIONS = [
  'Python', 'Excel Avanzado', 'Power BI', 'JavaScript', 'SQL', 'Apps Script',
  'Tableau', 'R', 'Node.js', 'MySQL', 'RPA/UiPath', 'VBA', 'Zapier', 'Pandas'
];

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

interface PublicarNecesidadPageProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    department_name: string;
  };
}

export default function PublicarNecesidadPage({ user }: PublicarNecesidadPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    skills: [] as string[],
    weeklyHours: '20',
    durationMonths: '3',
  },
);

  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const [showDepartmentsDropdown, setShowDepartmentsDropdown] = useState(false);
  const [searchSkill, setSearchSkill] = useState('');
  const [searchDepartment, setSearchDepartment] = useState('');

  const filteredSkills = useMemo(() => {
    return SKILLS_OPTIONS.filter(skill => 
      skill.toLowerCase().includes(searchSkill.toLowerCase())
    );
  }, [searchSkill]);

  const filteredDepartments = useMemo(() => {
    return DEPARTMENTS.filter(dept => 
      dept.toLowerCase().includes(searchDepartment.toLowerCase())
    );
  }, [searchDepartment]);

  const selectedSkillsCount = formData.skills.length;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }
    if (!formData.department.trim()) {
      newErrors.department = 'El área/departamento es obligatorio';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }
    if (formData.skills.length === 0) {
      newErrors.skills = 'Debe seleccionar al menos una habilidad';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills };
    });
    setShowSkillsDropdown(false);
    setSearchSkill('');
  };

  const handleDepartmentSelect = (department: string) => {
    setFormData(prev => ({ ...prev, department }));
    setShowDepartmentsDropdown(false);
    setSearchDepartment('');
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowSkillsDropdown(false);
      setShowDepartmentsDropdown(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('Debes iniciar sesión para publicar una necesidad');
      return;
    }

    // TODO: Implementar inserción en Supabase
    // const { data: newOp, error } = await supabase
    //   .from('opportunities')
    //   .insert({
    //     dependency_id: user.id,
    //     title: formData.title,
    //     area: formData.department,
    //     description: formData.description,
    //     required_skills: formData.skills,
    //     weekly_hours: Number(formData.weeklyHours),
    //     duration_months: Number(formData.durationMonths),
    //     status: 'pending_pat'
    //   })
    //   .select()
    //   .single();

    // if (error) {
    //   alert('Error al publicar: ' + error.message);
    //   return;
    // }

    // TODO: Implementar algoritmo de matching y mostrar candidatos
    
    alert('Necesidad publicada exitosamente (simulación)');
    router.push('/dashboard/dependencia');
  };

  const handleCancel = () => {
    router.push('/dashboard/dependencia');
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Publicar Necesidad de Automatización</h1>
              <p className="text-neutral-600 mt-1">
                Registra una nueva necesidad de automatización para encontrar candidatos compatibles
              </p>
            </div>
            <Button variant="secondary" onClick={() => router.push('/dashboard/dependencia')}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario Principal */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Título de la Necesidad */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Título de la Necesidad <span className="text-danger">*</span>
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ej: Automatización de reportes financieros mensuales"
                    error={errors.title}
                    disabled={isLoading}
                  />
                  {errors.title && <p className="mt-1.5 text-sm text-danger">{errors.title}</p>}
                </div>

                {/* Área / Departamento Solicitante */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Área / Departamento Solicitante <span className="text-danger">*</span>
                  </label>
                  <DepartmentSelect
                    value={formData.department}
                    onChange={handleDepartmentSelect}
                    error={errors.department}
                    disabled={isLoading}
                  />
                </div>

                {/* Descripción Detallada */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Descripción Detallada del Proceso <span className="text-danger">*</span>
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="1. Proceso actual y problema identificado\n2. Tareas específicas a automatizar\n3. Impacto esperado en la productividad"
                    rows={6}
                    error={errors.description}
                    disabled={isLoading}
                  />
                  <p className="mt-1.5 text-xs text-neutral-500">
                    Incluye: 1. Proceso actual y problema identificado | 2. Tareas específicas a automatizar | 3. Impacto esperado en la productividad
                  </p>
                  {errors.description && <p className="mt-1.5 text-sm text-danger">{errors.description}</p>}
                </div>

                {/* Habilidades Requeridas */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                      Habilidades Requeridas <span className="text-danger">*</span>
                    </h2>
                    <span className="text-sm text-neutral-500">{selectedSkillsCount} seleccionada{selectedSkillsCount !== 1 ? 's' : ''}</span>
                  </div>
                  <SkillsSection
                    skills={formData.skills}
                    onToggle={handleSkillToggle}
                    searchValue={searchSkill}
                    onSearchChange={setSearchSkill}
                    showDropdown={showSkillsDropdown}
                    onShowDropdown={setShowSkillsDropdown}
                    error={errors.skills}
                    disabled={isLoading}
                  />
                </div>

                {/* Dedicación Semanal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Dedicación Semanal (hrs) <span className="text-danger">*</span>
                    </label>
                    <WeeklyHoursSelect
                      value={formData.weeklyHours}
                      onChange={(value) => handleInputChange('weeklyHours', value)}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Duración del Proyecto */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Duración del Proyecto <span className="text-danger">*</span>
                    </label>
                    <DurationSelect
                      value={formData.durationMonths}
                      onChange={(value) => handleInputChange('durationMonths', value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Botones de Acción */}
                <ActionButtons
                  onCancel={handleCancel}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                />
              </form>
            </div>

            {/* Panel Lateral - Vista Previa Dinámica */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900">Vista Previa</h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                      Pendiente Revisión PAT
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Título</p>
                      <h3 className="font-semibold text-neutral-900">{formData.title || 'Título de la necesidad'}</h3>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Área / Departamento</p>
                      <p className="text-neutral-900">{formData.department || 'Área solicitante'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Descripción</p>
                      <p className="text-neutral-700 whitespace-pre-wrap">{formData.description || 'Descripción del proceso a automatizar...'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Habilidades requeridas</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.length > 0 ? (
                          formData.skills.map((skill) => (
                            <Badge key={skill} variant="primary" className="text-xs">{skill}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-neutral-400">Sin habilidades seleccionadas</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                      <div>
                        <p className="text-sm text-neutral-500 mb-1">Dedicación semanal</p>
                        <p className="font-medium text-neutral-900">{formData.weeklyHours} hrs</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500 mb-1">Duración</p>
                        <p className="font-medium text-neutral-900">{formData.durationMonths} mes{formData.durationMonths !== '1' ? 'es' : ''}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coincidencias Estimadas */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Candidatos Compatibles Estimados</h3>
                  <div className="space-y-3">
                    {formData.skills.length > 0 ? (
                      <>
                        <p className="text-sm text-neutral-600">
                          Basado en las {formData.skills.length} habilidad{formData.skills.length !== 1 ? 'es' : ''} seleccionada{formData.skills.length !== 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                          ))}
                          {formData.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{formData.skills.length - 3} más</Badge>
                          )}
                        </div>
                        <p className="text-sm text-primary font-medium">
                          ~{Math.max(3, formData.skills.length * 2)} candidatos potenciales
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-neutral-500 text-center py-4">
                        Selecciona habilidades para ver candidatos compatibles
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}