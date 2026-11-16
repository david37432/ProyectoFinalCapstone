'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check } from 'lucide-react';
import { publishVacancyAction, type MatchedCandidate } from '@/app/dashboard/dependencia/publicar/actions';
import { updateVacancyAction } from '@/app/dashboard/dependencia/necesidades/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { DepartmentSelect } from './DepartmentSelect';
import { SkillsSection } from './SkillsSection';
import { WeeklyHoursSelect } from './WeeklyHoursSelect';
import { DurationSelect } from './DurationSelect';
import { ActionButtons } from './ActionButtons';
import { addCustomItem, SKILLS_OPTIONS } from '@/lib/catalog';

export interface VacancyFormValues {
  title: string;
  department: string;
  description: string;
  skills: string[];
  weeklyHours: string;
  durationMonths: string;
}

const EMPTY: VacancyFormValues = {
  title: '',
  department: '',
  description: '',
  skills: [],
  weeklyHours: '20',
  durationMonths: '3',
};

interface VacancyFormProps {
  mode?: 'create' | 'edit';
  vacancyId?: string;
  initial?: Partial<VacancyFormValues>;
}

export function VacancyForm({ mode = 'create', vacancyId, initial }: VacancyFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit' && !!vacancyId;
  const backHref = isEdit ? `/dashboard/dependencia/necesidades/${vacancyId}` : '/dashboard/dependencia';

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [published, setPublished] = useState<{ candidates: MatchedCandidate[]; id?: string } | null>(null);
  const [formData, setFormData] = useState<VacancyFormValues>({ ...EMPTY, ...initial });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'El título es obligatorio';
    if (!formData.department.trim()) newErrors.department = 'El área/departamento es obligatorio';
    if (!formData.description.trim()) newErrors.description = 'La descripción es obligatoria';
    if (formData.skills.length === 0) newErrors.skills = 'Debe agregar al menos una habilidad';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof VacancyFormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => {
      const exists = prev.skills.some((s) => s.toLowerCase() === skill.toLowerCase());
      const skills = exists
        ? prev.skills.filter((s) => s.toLowerCase() !== skill.toLowerCase())
        : addCustomItem(prev.skills, skill, SKILLS_OPTIONS);
      return { ...prev, skills };
    });
    if (errors.skills) setErrors((prev) => ({ ...prev, skills: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // evita envíos dobles
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setSubmitError(null);
    try {
      if (isEdit) {
        const result = await updateVacancyAction(vacancyId!, formData);
        if (!result.success) {
          if (result.fieldErrors) setErrors(result.fieldErrors);
          setSubmitError(result.error ?? 'No se pudieron guardar los cambios');
          return;
        }
        router.push(backHref);
        router.refresh();
        return;
      }
      const result = await publishVacancyAction(formData);
      if (!result.success) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        setSubmitError(result.error ?? 'No se pudo publicar la necesidad');
        return;
      }
      setPublished({ candidates: result.candidates ?? [], id: result.vacancyId });
    } catch (err) {
      console.error('[necesidad] Error inesperado:', err);
      setSubmitError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Enter dentro de un campo de una línea NO envía el formulario: solo el botón lo hace
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (e.key === 'Enter' && target.tagName === 'INPUT') e.preventDefault();
  };

  if (published) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <Check className="w-6 h-6 text-success" />
              <h1 className="text-2xl font-bold text-neutral-900">Necesidad publicada</h1>
            </div>
            <p className="text-neutral-600 mb-6">
              Ya está <strong>publicada</strong> y los estudiantes pueden verla en Explorar. Estos son los candidatos más compatibles:
            </p>
            {published.candidates.length > 0 ? (
              <ul className="divide-y divide-neutral-200 mb-6">
                {published.candidates.map((c) => (
                  <li key={c.userId} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-neutral-900">{c.fullName}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.matchedSkills.map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-primary">{c.score}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500 mb-6">
                Aún no hay estudiantes con un perfil compatible. Te avisaremos cuando se postulen.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => router.push('/dashboard/dependencia')}>Volver al panel</Button>
              {published.id && (
                <Button variant="outline" onClick={() => router.push(`/dashboard/dependencia/necesidades/${published.id}`)}>
                  Ver la necesidad
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { skills } = formData;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                {isEdit ? 'Editar necesidad' : 'Publicar Necesidad de Automatización'}
              </h1>
              <p className="text-neutral-600 mt-1">
                {isEdit
                  ? 'Actualiza los datos; los cambios se ven de inmediato en Explorar'
                  : 'Registra una nueva necesidad de automatización para encontrar candidatos compatibles'}
              </p>
            </div>
            <Button variant="secondary" onClick={() => router.push(backHref)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6" noValidate>
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
                    maxLength={200}
                  />
                  {errors.title && <p className="mt-1.5 text-sm text-danger">{errors.title}</p>}
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Área / Departamento Solicitante <span className="text-danger">*</span>
                  </label>
                  <DepartmentSelect
                    value={formData.department}
                    onChange={(v) => handleInputChange('department', v)}
                    error={errors.department}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Descripción Detallada del Proceso <span className="text-danger">*</span>
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={'1. Proceso actual y problema identificado\n2. Tareas específicas a automatizar\n3. Impacto esperado en la productividad'}
                    rows={6}
                    error={errors.description}
                    disabled={isLoading}
                  />
                  <p className="mt-1.5 text-xs text-neutral-500">
                    Incluye: 1. Proceso actual y problema identificado | 2. Tareas específicas a automatizar | 3. Impacto esperado en la productividad
                  </p>
                  {errors.description && <p className="mt-1.5 text-sm text-danger">{errors.description}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-neutral-900">
                      Habilidades Requeridas <span className="text-danger">*</span>
                    </h2>
                    <span className="text-sm text-neutral-500">
                      {skills.length} agregada{skills.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <SkillsSection skills={skills} onToggle={handleSkillToggle} error={errors.skills} disabled={isLoading} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Dedicación Semanal (hrs) <span className="text-danger">*</span>
                    </label>
                    <WeeklyHoursSelect
                      value={formData.weeklyHours}
                      onChange={(v) => handleInputChange('weeklyHours', v)}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Duración del Proyecto <span className="text-danger">*</span>
                    </label>
                    <DurationSelect
                      value={formData.durationMonths}
                      onChange={(v) => handleInputChange('durationMonths', v)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {submitError && (
                  <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {submitError}
                  </div>
                )}

                <ActionButtons
                  onCancel={() => router.push(backHref)}
                  isLoading={isLoading}
                  submitLabel={isEdit ? 'Guardar cambios' : 'Publicar y buscar candidatos'}
                />
              </form>
            </div>

            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-6">
                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900">Vista Previa</h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                      {isEdit ? 'Se guardará al confirmar' : 'Se publicará al guardar'}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Título</p>
                      <h3 className="font-semibold text-neutral-900 break-words">{formData.title || 'Título de la necesidad'}</h3>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Área / Departamento</p>
                      <p className="text-neutral-900">{formData.department || 'Área solicitante'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Descripción</p>
                      <p className="text-neutral-700 whitespace-pre-wrap break-words">
                        {formData.description || 'Descripción del proceso a automatizar...'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Habilidades requeridas</p>
                      <div className="flex flex-wrap gap-2">
                        {skills.length > 0 ? (
                          skills.map((skill) => (
                            <Badge key={skill} variant="primary" className="text-xs">{skill}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-neutral-400">Sin habilidades</span>
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
                        <p className="font-medium text-neutral-900">
                          {formData.durationMonths} mes{formData.durationMonths !== '1' ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {!isEdit && (
                  <div className="bg-white border border-neutral-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">Candidatos Compatibles</h3>
                    <p className="text-sm text-neutral-600">
                      {skills.length > 0
                        ? 'Al publicar verás los candidatos ordenados por compatibilidad.'
                        : 'Agrega habilidades para ver candidatos compatibles al publicar.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
