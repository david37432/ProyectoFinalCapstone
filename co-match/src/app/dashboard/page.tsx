'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { Plus, Users, Briefcase, Clock, TrendingUp, Filter, MoreVertical, Edit, Eye, Trash2 } from 'lucide-react';

const mockStats = [
  { label: 'Vacantes activas', value: '12', icon: Briefcase, color: 'bg-primary/10 text-primary' },
  { label: 'Candidatos pendientes', value: '47', icon: Users, color: 'bg-warning/10 text-warning' },
  { label: 'Proyectos en desarrollo', value: '5', icon: TrendingUp, color: 'bg-success/10 text-success' },
  { label: 'Horas PAT disponibles', value: '240', icon: Clock, color: 'bg-purple-100 text-purple-700' },
];

const mockVacancies = [
  {
    id: '1',
    title: 'Desarrollador Full Stack - PAT',
    department: 'Dirección de Tecnologías de Información',
    modality: 'hibrido',
    contract_type: 'pasantia',
    status: 'publicada',
    candidates: 23,
    slots: 3,
    created_at: '2024-01-15',
  },
  {
    id: '2',
    title: 'Analista de Datos Junior',
    department: 'Facultad de Ingeniería',
    modality: 'presencial',
    contract_type: 'prestacion_servicios',
    status: 'publicada',
    candidates: 15,
    slots: 2,
    created_at: '2024-01-10',
  },
  {
    id: '3',
    title: 'Diseñador UX/UI',
    department: 'Dirección de Comunicaciones',
    modality: 'remoto',
    contract_type: 'temporal',
    status: 'en_aprobacion',
    candidates: 0,
    slots: 1,
    created_at: '2024-01-20',
  },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline' }> = {
  publicada: { label: 'Publicada', variant: 'success' },
  borrador: { label: 'Borrador', variant: 'outline' },
  en_aprobacion: { label: 'En aprobación', variant: 'warning' },
  cerrada: { label: 'Cerrada', variant: 'default' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
};

const user = {
  full_name: 'Carlos Rodríguez',
  email: 'carlos.rodriguez@unisabana.edu.co',
  role: 'reclutador',
  avatar_url: undefined,
};

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'vacancies' | 'candidates'>('vacancies');

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header user={user} onSignOut={() => {}} />

      <main className="flex-1 pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Dashboard de Dependencia</h1>
              <p className="text-neutral-600 text-sm">Gestiona tus vacantes y candidatos</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Publicar vacante
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockStats.map((stat) => (
              <Card key={stat.label} variant="outlined" padding="md">
                <CardContent className="flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
                    <stat.icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                    <p className="text-sm text-neutral-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 border-b border-neutral-200" role="tablist">
            {[
              { id: 'vacancies', label: 'Mis Vacantes', count: mockVacancies.length },
              { id: 'candidates', label: 'Candidatos', count: 47 },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                    'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                )}
              >
                {tab.label}
                <span className="ml-2 px-2 py-0.5 text-xs bg-neutral-100 rounded-full">{tab.count}</span>
              </button>
            ))}
          </div>

          {activeTab === 'vacancies' && (
            <div className="space-y-4">
              {mockVacancies.map((vacancy) => (
                <Card key={vacancy.id} variant="outlined" padding="md">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-neutral-900">{vacancy.title}</h3>
                        <Badge variant={statusConfig[vacancy.status].variant}>
                          {statusConfig[vacancy.status].label}
                        </Badge>
                      </div>
                      <p className="text-neutral-600 text-sm mb-2">{vacancy.department}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {vacancy.candidates} candidatos / {vacancy.slots} cupos
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {vacancy.contract_type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {vacancy.modality}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" aria-label="Ver candidatos">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" aria-label="Editar vacante">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" aria-label="Más opciones">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'candidates' && (
            <div className="space-y-4">
              <Card variant="outlined" padding="md">
                <CardHeader>
                  <CardTitle>Candidatos por coincidencia</CardTitle>
                  <CardDescription>Filtrados por tus vacantes activas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-neutral-500 border-b border-neutral-200">
                          <th className="pb-3 font-medium">Candidato</th>
                          <th className="pb-3 font-medium">Vacante</th>
                          <th className="pb-3 font-medium">Match</th>
                          <th className="pb-3 font-medium">Estado</th>
                          <th className="pb-3 font-medium">Aplicado</th>
                          <th className="pb-3 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'María González', vacancy: 'Desarrollador Full Stack', match: 92, status: 'entrevista', date: '2024-01-18' },
                          { name: 'Juan Pérez', vacancy: 'Desarrollador Full Stack', match: 87, status: 'en_revision', date: '2024-01-19' },
                          { name: 'Ana Martínez', vacancy: 'Analista de Datos', match: 78, status: 'recibida', date: '2024-01-20' },
                          { name: 'Luis Fernández', vacancy: 'Analista de Datos', match: 65, status: 'recibida', date: '2024-01-21' },
                        ].map((candidate, i) => (
                          <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50">
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <Avatar alt={candidate.name} size="sm" />
                                <span className="font-medium text-neutral-900">{candidate.name}</span>
                              </div>
                            </td>
                            <td className="py-3 text-neutral-600">{candidate.vacancy}</td>
                            <td className="py-3">
                              <Badge variant={candidate.match >= 80 ? 'success' : candidate.match >= 60 ? 'primary' : 'warning'} className="font-medium">
                                {candidate.match}%
                              </Badge>
                            </td>
                            <td className="py-3">
                              <Badge variant={candidate.status === 'entrevista' ? 'primary' : candidate.status === 'en_revision' ? 'warning' : 'outline'}>
                                {candidate.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="py-3 text-neutral-500">{candidate.date}</td>
                            <td className="py-3">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" aria-label="Ver perfil">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" aria-label="Avanzar proceso">
                                  <TrendingUp className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNavigation userRole={user.role} />

      {showCreateModal && (
        <CreateVacancyModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function CreateVacancyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-bold text-neutral-900">Crear nueva vacante PAT</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700" aria-label="Cerrar">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Título de la vacante *" placeholder="Ej: Desarrollador Full Stack" required />
            <Select
              label="Dependencia *"
              options={[
                { value: 'dti', label: 'Dirección de Tecnologías de Información' },
                { value: 'fing', label: 'Facultad de Ingeniería' },
                { value: 'fce', label: 'Facultad de Ciencias Económicas' },
                { value: 'dcom', label: 'Dirección de Comunicaciones' },
                { value: 'cemp', label: 'Centro de Emprendimiento' },
              ]}
              placeholder="Selecciona dependencia"
              required
            />
            <Select
              label="Tipo de contrato *"
              options={[
                { value: 'pasantia', label: 'Pasantía' },
                { value: 'prestacion_servicios', label: 'Prestación de servicios' },
                { value: 'temporal', label: 'Temporal' },
                { value: 'fijo', label: 'Fijo' },
              ]}
              placeholder="Selecciona tipo"
              required
            />
            <Select
              label="Modalidad *"
              options={[
                { value: 'presencial', label: 'Presencial' },
                { value: 'remoto', label: 'Remoto' },
                { value: 'hibrido', label: 'Híbrido' },
              ]}
              placeholder="Selecciona modalidad"
              required
            />
            <Input label="Ubicación" placeholder="Bogotá, Campus Principal" />
            <Input label="Horas PAT/semana" type="number" placeholder="20" />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Descripción *</label>
            <textarea className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary" rows={4} placeholder="Describe el rol, responsabilidades y contexto..." required />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Requisitos</label>
            <textarea className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary" rows={3} placeholder="Habilidades técnicas, experiencia, formación..." />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" type="submit">Publicar vacante</Button>
          </div>
        </form>
      </div>
    </div>
  );
}