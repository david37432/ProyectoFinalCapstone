'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';
import { Camera, Save, Edit, Upload, X, CheckCircle, AlertCircle, Plus } from 'lucide-react';

const user = {
  full_name: 'María González',
  email: 'maria.gonzalez@unisabana.edu.co',
  phone: '+57 300 123 4567',
  document_number: '1234567890',
  role: 'postulante',
  avatar_url: undefined,
};

const profile = {
  birth_date: '2000-05-15',
  city: 'Bogotá',
  education_level: 'pregrado',
  professional_summary: 'Estudiante de Ingeniería de Sistemas con interés en desarrollo full stack y ciencia de datos. Busco oportunidades para aplicar mis conocimientos en proyectos reales.',
  professional_network_url: 'https://linkedin.com/in/mariagonzalez',
  availability_hours_per_week: 20,
  preferred_modality: 'hibrido',
  preferred_contract_type: 'pasantia',
  skills: [
    { id: '1', name: 'React', level: 'avanzado' },
    { id: '2', name: 'TypeScript', level: 'avanzado' },
    { id: '3', name: 'Node.js', level: 'intermedio' },
    { id: '4', name: 'PostgreSQL', level: 'intermedio' },
    { id: '5', name: 'Python', level: 'avanzado' },
    { id: '6', name: 'Git', level: 'avanzado' },
  ],
  experience: [
    {
      id: '1',
      company: 'Tech Solutions SAS',
      position: 'Desarrollador Junior',
      start_date: '2023-06-01',
      end_date: '2023-12-31',
      is_current: false,
      description: 'Desarrollo de componentes React y APIs REST con Node.js',
    },
    {
      id: '2',
      company: 'Universidad de La Sabana',
      position: 'Monitor Académico - Programación',
      start_date: '2023-02-01',
      end_date: null,
      is_current: true,
      description: 'Apoyo a estudiantes en materias de algoritmos y estructuras de datos',
    },
  ],
  documents: [
    { id: '1', name: 'Hoja de vida.pdf', type: 'hoja_viva', verified: true },
    { id: '2', name: 'Certificado notas.pdf', type: 'certificado', verified: true },
    { id: '3', name: 'Carta recomendación.pdf', type: 'carta_recomendacion', verified: false },
  ],
};

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

const proficiencyLevels = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermedio' });
  const [availableSkills] = useState([
    'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Python', 'Git',
    'JavaScript', 'AWS', 'Docker', 'Kubernetes', 'Figma', 'Excel Avanzado',
    'Machine Learning', 'Análisis de Datos', 'Agile/Scrum', 'Comunicación Efectiva',
    'Trabajo en Equipo', 'Resolución de Problemas', 'Inglés Técnico'
  ]);

  const handleSave = () => {
    setIsEditing(false);
  };

  const addSkill = () => {
    if (newSkill.name.trim() && !profile.skills.some(s => s.name.toLowerCase() === newSkill.name.toLowerCase())) {
      setEditedProfile(prev => ({
        ...prev,
        skills: [...prev.skills, { id: Date.now().toString(), name: newSkill.name, level: newSkill.level }]
      }));
      setNewSkill({ name: '', level: 'intermedio' });
      setShowSkillModal(false);
    }
  };

  const removeSkill = (skillId: string) => {
    setEditedProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.id !== skillId)
    }));
  };

  const levelColors: Record<string, string> = {
    basico: 'bg-neutral-100 text-neutral-700',
    intermedio: 'bg-primary/10 text-primary',
    avanzado: 'bg-success/10 text-success',
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header user={user} onSignOut={() => {}} />

      <main className="flex-1 pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-6">
            <Avatar src={user.avatar_url} alt={user.full_name} size="2xl" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-neutral-900">{user.full_name}</h1>
                <Badge variant="primary">{user.role === 'postulante' ? 'Estudiante PAT' : user.role}</Badge>
              </div>
              <p className="text-neutral-600 mt-1">{user.email}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                <span>Tel: {user.phone}</span>
                <span>Doc: {user.document_number}</span>
              </div>
            </div>
            <div className="ml-auto">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar perfil
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="skills">Habilidades</TabsTrigger>
              <TabsTrigger value="experience">Experiencia</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-6">
              <Card variant="outlined" padding="lg">
                <CardHeader>
                  <CardTitle>Información personal</CardTitle>
                  <CardDescription>Datos para tu perfil profesional</CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Fecha de nacimiento"
                          type="date"
                          value={editedProfile.birth_date}
                          onChange={(e) => setEditedProfile({ ...editedProfile, birth_date: e.target.value })}
                        />
                        <Input
                          label="Ciudad"
                          type="text"
                          value={editedProfile.city}
                          onChange={(e) => setEditedProfile({ ...editedProfile, city: e.target.value })}
                        />
                      </div>

                      <Select
                        label="Nivel educativo"
                        options={educationLevels}
                        value={editedProfile.education_level}
                        onChange={(e) => setEditedProfile({ ...editedProfile, education_level: e.target.value })}
                      />

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Resumen profesional</label>
                        <textarea
                          className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          rows={4}
                          value={editedProfile.professional_summary}
                          onChange={(e) => setEditedProfile({ ...editedProfile, professional_summary: e.target.value })}
                        />
                      </div>

                      <Input
                        label="LinkedIn / Portfolio"
                        type="url"
                        value={editedProfile.professional_network_url}
                        onChange={(e) => setEditedProfile({ ...editedProfile, professional_network_url: e.target.value })}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Disponibilidad (hrs/semana)"
                          type="number"
                          min="0"
                          max="48"
                          value={editedProfile.availability_hours_per_week}
                          onChange={(e) => setEditedProfile({ ...editedProfile, availability_hours_per_week: parseInt(e.target.value) || 0 })}
                        />
                        <Select
                          label="Modalidad preferida"
                          options={modalityOptions}
                          value={editedProfile.preferred_modality}
                          onChange={(e) => setEditedProfile({ ...editedProfile, preferred_modality: e.target.value })}
                        />
                        <Select
                          label="Tipo de contrato preferido"
                          options={contractOptions}
                          value={editedProfile.preferred_contract_type}
                          onChange={(e) => setEditedProfile({ ...editedProfile, preferred_contract_type: e.target.value })}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                        <Button type="button" variant="secondary" onClick={() => { setEditedProfile(profile); setIsEditing(false); }}>
                          Cancelar
                        </Button>
                        <Button type="submit" variant="primary">
                          <Save className="w-4 h-4 mr-2" />
                          Guardar cambios
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-neutral-500">Fecha de nacimiento</p>
                          <p className="font-medium text-neutral-900">{new Date(profile.birth_date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Ciudad</p>
                          <p className="font-medium text-neutral-900">{profile.city}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Nivel educativo</p>
                        <p className="font-medium text-neutral-900">{educationLevels.find(l => l.value === profile.education_level)?.label}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Resumen profesional</p>
                        <p className="text-neutral-700">{profile.professional_summary}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">LinkedIn / Portfolio</p>
                        <a href={profile.professional_network_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{profile.professional_network_url}</a>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-neutral-500">Disponibilidad</p>
                          <p className="font-medium text-neutral-900">{profile.availability_hours_per_week} hrs/semana</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Modalidad preferida</p>
                          <p className="font-medium text-neutral-900">{modalityOptions.find(l => l.value === profile.preferred_modality)?.label}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Contrato preferido</p>
                          <p className="font-medium text-neutral-900">{contractOptions.find(l => l.value === profile.preferred_contract_type)?.label}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="mt-6">
              <Card variant="outlined" padding="lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Habilidades técnicas</CardTitle>
                    <CardDescription>Tus competencias para el match con vacantes</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowSkillModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill.id} variant={levelColors[skill.level] as 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'} className="gap-1">
                        {skill.name}
                        <span className="text-xs capitalize">{skill.level}</span>
                        {isEditing && (
                          <button onClick={() => removeSkill(skill.id)} className="ml-1 hover:text-danger">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {profile.skills.length === 0 && (
                    <p className="text-neutral-500 text-center py-8">No hay habilidades registradas. Agrega tus competencias para mejorar el match.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experience" className="mt-6">
              <Card variant="outlined" padding="lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Experiencia laboral</CardTitle>
                    <CardDescription>Tu historial profesional</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {profile.experience.map((exp) => (
                      <div key={exp.id} className="border-l-2 border-primary pl-4">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h4 className="font-semibold text-neutral-900">{exp.position}</h4>
                            <p className="text-primary font-medium">{exp.company}</p>
                          </div>
                          <Badge variant={exp.is_current ? 'success' : 'outline'} size="sm">
                            {exp.is_current ? 'Actual' : 'Finalizado'}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-500 mb-2">
                          {new Date(exp.start_date).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}
                          {' - '}
                          {exp.is_current ? 'Presente' : new Date(exp.end_date!).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-neutral-600 text-sm">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                  {profile.experience.length === 0 && (
                    <p className="text-neutral-500 text-center py-8">No hay experiencia registrada.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card variant="outlined" padding="lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Documentos</CardTitle>
                    <CardDescription>Archivos adjuntos a tu perfil</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Subir
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{doc.name}</p>
                            <p className="text-sm text-neutral-500 capitalize">{doc.type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={doc.verified ? 'success' : 'warning'} size="sm">
                            {doc.verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                            {doc.verified ? 'Verificado' : 'Pendiente'}
                          </Badge>
                          <Button variant="ghost" size="sm" aria-label="Descargar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      <BottomNavigation userRole={user.role} />

      {showSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Agregar habilidad</h3>
            <div className="space-y-4">
              <Input
                label="Habilidad"
                placeholder="Ej: React, Python, Figma..."
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                autoFocus
              />
              <Select
                label="Nivel de dominio"
                options={proficiencyLevels}
                value={newSkill.level}
                onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => { setShowSkillModal(false); setNewSkill({ name: '', level: 'intermedio' }); }}>Cancelar</Button>
              <Button variant="primary" onClick={addSkill} disabled={!newSkill.name.trim()}>Agregar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}