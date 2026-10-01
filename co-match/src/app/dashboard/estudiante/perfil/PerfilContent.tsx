'use client';

import { useState, useEffect, useTransition } from 'react';
import { Camera, Save, CheckCircle, AlertCircle, Loader2, Plus, Trash2, Edit2 } from 'lucide-react';
import { updateStudentProfile, type UpdateProfileResult } from './actions';

interface ProfileData {
  id: string
  email: string
  full_name: string
  role: string
  phone?: string
  student_code?: string
  career: string | null
  semester?: number
  focus?: string
  gpa?: number
  availability_hours: number | null
  skills: string[]
  interests: string[]
  experience: string | null
  completion: number
  avatar_url: string | null
  created_at: string
  updated_at: string
}

const availableSkills = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Power BI', 'Power Automate',
  'Power Apps', 'Power Query', 'Excel Avanzado', 'VBA', 'SQL', 'PostgreSQL', 'MongoDB',
  'Git', 'Docker', 'AWS', 'Azure', 'RPA', 'UiPath', 'n8n', 'Pandas', 'NumPy', 'Matplotlib',
  'Tableau', 'Looker', 'FastAPI', 'Django', 'Flask', 'Next.js', 'Tailwind CSS'
];

const availableInterests = [
  'Automatización de Procesos', 'Análisis de Datos', 'Desarrollo Web', 'RPA',
  'Inteligencia Artificial', 'Machine Learning', 'Desarrollo Móvil', 'DevOps',
  'Ciberseguridad', 'Cloud Computing', 'IoT', 'Blockchain', 'Realidad Aumentada',
  'Experiencia de Usuario (UX)', 'Gestión de Proyectos', 'Investigación Aplicada'
];

const getDefaultProfile = (): ProfileData => ({
  id: '',
  email: '',
  full_name: '',
  role: 'estudiante',
  phone: '',
  student_code: '',
  career: null,
  semester: undefined,
  focus: '',
  gpa: undefined,
  availability_hours: null,
  skills: [],
  interests: [],
  experience: null,
  completion: 0,
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

interface PerfilContentProps {
  initialProfile: ProfileData | null
  userId: string
}

export default function PerfilContent({ initialProfile, userId }: PerfilContentProps) {
  const [profile, setProfile] = useState<ProfileData>(() => initialProfile ?? getDefaultProfile());
  const [loading, setLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [showSkillSelect, setShowSkillSelect] = useState(false);
  const [showInterestSelect, setShowInterestSelect] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Log initialProfile on mount for debugging
  useEffect(() => {
    console.log('[PerfilContent] initialProfile recibido:', initialProfile);
  }, []);

  const calculateCompletion = (p: ProfileData): number => {
    const fields = [
      p.full_name, p.email, p.phone, p.student_code,
      p.career, p.semester, p.focus, p.gpa,
      p.skills.length > 0, p.interests.length > 0, p.experience, p.availability_hours
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completion = profile ? calculateCompletion(profile) : 0;

  const handleSave = async () => {
    setSaveStatus(null);

    const payload = {
      full_name: profile.full_name,
      career: profile.career || '',
      experience: profile.experience || '',
      availability_hours: profile.availability_hours ?? null,
    };

    startTransition(async () => {
      const result: UpdateProfileResult = await updateStudentProfile(payload);

      if (result.success) {
        setSaveStatus({ type: 'success', message: 'Perfil actualizado correctamente' });
        setProfile(prev => ({ ...prev, ...result.data }));
      } else {
        setSaveStatus({ type: 'error', message: result.error });
      }
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
      setShowSkillSelect(false);
    }
  };

  const removeSkill = (skill: string) => {
    setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !profile.interests.includes(newInterest.trim())) {
      setProfile(prev => ({ ...prev, interests: [...prev.interests, newInterest.trim()] }));
      setNewInterest('');
      setShowInterestSelect(false);
    }
  };

  const removeInterest = (interest: string) => {
    setProfile(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
  };

  const filteredSkills = availableSkills
    .filter(s => !profile.skills.includes(s))
    .filter(s => s.toLowerCase().includes(newSkill.toLowerCase()))
    .slice(0, 8);

  const filteredInterests = availableInterests
    .filter(i => !profile.interests.includes(i))
    .filter(i => i.toLowerCase().includes(newInterest.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Save Status Toast */}
      {saveStatus && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          saveStatus.type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'
        } animate-slide-in`}>
          {saveStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              <span className="text-4xl font-bold text-primary">
                {profile.full_name?.split(' ').map(n => n[0]).join('') || '?'}
              </span>
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors cursor-pointer">
              <Camera className="w-5 h-5" />
              <input type="file" accept="image/*" className="sr-only" />
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-bold text-neutral-900">{profile.full_name || 'Sin nombre'}</h1>
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium">
                Estudiante PAT
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 mb-4">
              {profile.career && <span className="flex items-center gap-1">{profile.career}</span>}
              {profile.semester && <span className="flex items-center gap-1">Semestre {profile.semester}</span>}
              {profile.gpa && <span className="flex items-center gap-1">Promedio: {profile.gpa}/5.0</span>}
            </div>
            <p className="text-sm text-neutral-500">{profile.focus || 'Sin especificar'}</p>
          </div>
          <div className="text-center md:ml-auto">
            <div className="w-24 h-24 rounded-full bg-neutral-100 flex flex-col items-center justify-center mx-auto mb-2 relative">
              <svg className="w-16 h-16 text-neutral-300" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={`${completion * 0.999}, 100`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className={completion >= 80 ? 'text-success' : completion >= 50 ? 'text-warning' : 'text-danger'}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-neutral-700">
                {completion}%
              </span>
            </div>
            <p className="text-sm text-neutral-500">Perfil completado</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
        {/* Personal Info */}
        <section className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            Información Personal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Correo institucional</label>
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-neutral-50 text-neutral-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Añade tu teléfono"
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Código estudiantil</label>
              <input
                type="text"
                value={profile.student_code || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, student_code: e.target.value }))}
                placeholder="Añade tu código"
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </section>

        {/* Academic Info */}
        <section className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            Formación Académica
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Carrera</label>
              <input
                type="text"
                value={profile.career || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, career: e.target.value }))}
                placeholder="Añade tu carrera"
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Semestre actual</label>
              <input
                type="number"
                value={profile.semester || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, semester: parseInt(e.target.value) || 0 }))}
                placeholder="Semestre"
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Enfoque / Especialización</label>
              <input
                type="text"
                value={profile.focus || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, focus: e.target.value }))}
                placeholder="Añade tu enfoque"
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Promedio acumulado</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={profile.gpa || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, gpa: parseFloat(e.target.value) || 0 }))}
                placeholder="Promedio (0-5)"
                className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </section>

        {/* Skills */}
        <section className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              Habilidades Técnicas y Tecnologías
            </h2>
            <div className="relative">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => { setNewSkill(e.target.value); setShowSkillSelect(true); }}
                onFocus={() => setShowSkillSelect(true)}
                placeholder="Agregar habilidad (ej. Python, Power BI...)"
                className="w-64 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
              />
              {showSkillSelect && filteredSkills.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredSkills.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => { setNewSkill(skill); addSkill(); }}
                      className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.skills.length === 0 ? (
              <p className="text-sm text-neutral-500 w-full">Añade tus habilidades técnicas y tecnologías</p>
            ) : (
              profile.skills.map((skill, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="p-0.5 hover:bg-primary/20 rounded-full"
                    aria-label={`Eliminar ${skill}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>
        </section>

        {/* Interests */}
        <section className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              Intereses y Áreas de Preferencia
            </h2>
            <div className="relative">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => { setNewInterest(e.target.value); setShowInterestSelect(true); }}
                onFocus={() => setShowInterestSelect(true)}
                placeholder="Agregar interés (ej. Machine Learning...)"
                className="w-64 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
              />
              {showInterestSelect && filteredInterests.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredInterests.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => { setNewInterest(interest); addInterest(); }}
                      className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.interests.length === 0 ? (
              <p className="text-sm text-neutral-500 w-full">Añade tus áreas de interés y preferencia</p>
            ) : (
              profile.interests.map((interest, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-info/10 text-info text-sm rounded-full">
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
                    className="p-0.5 hover:bg-info/20 rounded-full"
                    aria-label={`Eliminar ${interest}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>
        </section>

        {/* Experience */}
        <section className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            Experiencia y Proyectos Previos
          </h2>
          <textarea
            value={profile.experience || ''}
            onChange={(e) => setProfile(prev => ({ ...prev, experience: e.target.value }))}
            rows={6}
            placeholder="Describe tus proyectos, prácticas, investigaciones o experiencias relevantes..."
            className="w-full px-4 py-3 rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </section>

        {/* Availability */}
        <section className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            Disponibilidad Horaria
          </h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="number"
                min="0"
                max="40"
                value={profile.availability_hours || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setProfile(prev => ({ ...prev, availability_hours: value ? parseInt(value) : null }));
                }}
                placeholder="Horas"
                className="w-24 px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center"
              />
              <span className="text-neutral-700 font-medium">horas/semana disponibles para PAT</span>
            </label>
            <div className="flex-1 h-2 bg-neutral-200 rounded overflow-hidden">
              <div
                className="h-full bg-primary rounded transition-all duration-300"
                style={{ width: `${Math.min((profile.availability_hours || 0) / 40 * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm text-neutral-500 w-12 text-right">
              {Math.round((profile.availability_hours || 0) / 40 * 100)}%
            </span>
          </div>
        </section>

        {/* Save Button */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm py-4 border-t border-neutral-200 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-8 py-3 text-base font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
            {isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}