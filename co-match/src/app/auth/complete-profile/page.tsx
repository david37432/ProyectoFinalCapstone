'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const mockSkills = [
  { id: '1', name: 'React' },
  { id: '2', name: 'TypeScript' },
  { id: '3', name: 'Node.js' },
  { id: '4', name: 'PostgreSQL' },
  { id: '5', name: 'Python' },
  { id: '6', name: 'Git' },
  { id: '7', name: 'JavaScript' },
  { id: '8', name: 'AWS' },
  { id: '9', name: 'Docker' },
  { id: '10', name: 'Kubernetes' },
  { id: '11', name: 'Figma' },
  { id: '12', name: 'Excel Avanzado' },
  { id: '13', name: 'Machine Learning' },
  { id: '14', name: 'Análisis de Datos' },
  { id: '15', name: 'Agile/Scrum' },
  { id: '16', name: 'Comunicación Efectiva' },
  { id: '17', name: 'Trabajo en Equipo' },
  { id: '18', name: 'Resolución de Problemas' },
  { id: '19', name: 'Inglés Técnico' },
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [skills, setSkills] = useState<{ id: string; name: string }[]>(mockSkills);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    birth_date: '',
    city: '',
    education_level: '',
    professional_summary: '',
    professional_network_url: '',
    availability_hours_per_week: '',
    preferred_modality: 'cualquiera',
    preferred_contract_type: 'cualquiera',
  });

  const educationLevels = [
    { value: 'tecnico', label: 'Técnico' },
    { value: 'tecnologo', label: 'Tecnólogo' },
    { value: 'pregrado', label: 'Pregrado' },
    { value: 'especializacion', label: 'Especialización' },
    { value: 'maestria', label: 'Maestría' },
    { value: 'doctorado', label: 'Doctorado' },
  ];

  const modalityOptions = [
    { value: 'presencial', label: 'Presencial' },
    { value: 'remoto', label: 'Remoto' },
    { value: 'hibrido', label: 'Híbrido' },
    { value: 'cualquiera', label: 'Cualquiera' },
  ];

  const contractOptions = [
    { value: 'fijo', label: 'Fijo' },
    { value: 'temporal', label: 'Temporal' },
    { value: 'pasantia', label: 'Pasantía' },
    { value: 'prestacion_servicios', label: 'Prestación de servicios' },
    { value: 'cualquiera', label: 'Cualquiera' },
  ];

  const handleSave = async () => {
    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { error: profileError } = await supabase
      .from('candidate_profiles')
      .upsert({
        user_id: user.id,
        ...formData,
        availability_hours_per_week: formData.availability_hours_per_week ? parseInt(formData.availability_hours_per_week) : null,
        is_profile_complete: true,
      });

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    if (selectedSkills.length > 0) {
      const candidateProfile = await supabase
        .from('candidate_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (candidateProfile.data) {
        const skillRecords = selectedSkills.map((skillId) => ({
          candidate_profile_id: candidateProfile.data.id,
          skill_id: skillId,
          proficiency_level: 'intermedio' as const,
        }));

        await supabase.from('candidate_skills').upsert(skillRecords);
      }
    }

    await supabase
      .from('users')
      .update({ is_profile_complete: true })
      .eq('id', user.id);

    router.refresh();
    // Redirect based on role
    const { data: userData } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single();
    
    if (userData?.role_id) {
      const { data: role } = await supabase
        .from('roles')
        .select('name')
        .eq('id', userData.role_id)
        .single();
      
      if (['reclutador', 'jefe_area', 'admin'].includes(role?.name || '')) {
        router.push('/dashboard/dependencia');
      } else {
        router.push('/dashboard/estudiante/explorar');
      }
    } else {
      router.push('/dashboard/estudiante/explorar');
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-0">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6" aria-label="CO-MATCH Home">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-2xl">CM</span>
            </div>
            <span className="font-bold text-2xl text-neutral-900">CO-MATCH</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Completa tu perfil</h1>
          <p className="text-neutral-600 mt-2">Esta información nos ayuda a encontrar las mejores oportunidades para ti</p>
        </div>

        <Card variant="outlined" padding="lg">
          <CardHeader>
            <CardTitle>Información profesional</CardTitle>
            <CardDescription>Los campos marcados con * son obligatorios</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 text-danger text-sm" role="alert">
                {error}
              </div>
            )}

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fecha de nacimiento *"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  required
                />

                <Input
                  label="Ciudad *"
                  type="text"
                  placeholder="Bogotá, Medellín, Cali..."
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <Select
                label="Nivel educativo *"
                options={educationLevels}
                placeholder="Selecciona tu nivel educativo"
                value={formData.education_level}
                onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Resumen profesional *
                </label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Describe brevemente tu experiencia, objetivos profesionales y qué buscas en el programa PAT..."
                  value={formData.professional_summary}
                  onChange={(e) => setFormData({ ...formData, professional_summary: e.target.value })}
                  required
                />
              </div>

              <Input
                label="LinkedIn / Portfolio"
                type="url"
                placeholder="https://linkedin.com/in/tuusuario"
                value={formData.professional_network_url}
                onChange={(e) => setFormData({ ...formData, professional_network_url: e.target.value })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Disponibilidad horaria (hrs/semana) *"
                  type="number"
                  min="0"
                  max="48"
                  placeholder="20"
                  value={formData.availability_hours_per_week}
                  onChange={(e) => setFormData({ ...formData, availability_hours_per_week: e.target.value })}
                  required
                />

                <Select
                  label="Modalidad preferida"
                  options={modalityOptions}
                  placeholder="Selecciona modalidad"
                  value={formData.preferred_modality}
                  onChange={(e) => setFormData({ ...formData, preferred_modality: e.target.value })}
                />
              </div>

              <Select
                label="Tipo de contrato preferido"
                options={contractOptions}
                placeholder="Selecciona tipo de contrato"
                value={formData.preferred_contract_type}
                onChange={(e) => setFormData({ ...formData, preferred_contract_type: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Habilidades técnicas <span className="text-primary">({selectedSkills.length} seleccionadas)</span>
                </label>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border border-neutral-200 rounded-lg bg-neutral-50">
                  {skills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant={selectedSkills.includes(skill.id) ? 'primary' : 'outline'}
                      onClick={() => toggleSkill(skill.id)}
                      className="cursor-pointer"
                    >
                      {skill.name}
                    </Badge>
                  ))}
                </div>
                {selectedSkills.length === 0 && (
                  <p className="text-sm text-neutral-500 mt-2">Selecciona al menos 3 habilidades para mejores coincidencias</p>
                )}
              </div>
            </form>
          </CardContent>

          <CardFooter className="justify-end gap-3">
            <Button variant="secondary" onClick={() => router.back()} disabled={saving}>
              Omitir por ahora
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={saving} disabled={!formData.birth_date || !formData.city || !formData.education_level || !formData.professional_summary || !formData.availability_hours_per_week}>
              Completar perfil
            </Button>
          </CardFooter>
        </Card>
      </div>

      <BottomNavigation userRole="postulante" />
    </div>
  );
}

function BottomNavigation({ userRole }: { userRole?: string }) {
  const navigation = [
    { name: 'Inicio', href: '/oportunidades', icon: HomeIcon },
    { name: 'Perfil', href: '/profile', icon: UserIcon },
    { name: 'Ajustes', href: '/profile/settings', icon: SettingsIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 md:hidden" aria-label="Navegación inferior">
      <div className="grid grid-cols-3">
        {navigation.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="flex flex-col items-center justify-center py-2 px-2 gap-1 text-neutral-500 hover:text-primary transition-colors"
          >
            <item.icon className="w-6 h-6" aria-hidden="true" />
            <span className="text-xs font-medium">{item.name}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function UserIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}