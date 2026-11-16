import { redirect } from 'next/navigation';

/** Ruta antigua: el perfil vive en el dashboard del estudiante. */
export default function ProfilePage() {
  redirect('/dashboard/estudiante/perfil');
}
