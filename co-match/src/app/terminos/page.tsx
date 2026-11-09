import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | CO-MATCH',
};

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y Condiciones de Uso" updatedAt="8 de noviembre de 2026">
      <p>
        Al registrarte y usar CO-MATCH aceptas estos términos. Si no estás de acuerdo, no debes usar la plataforma.
      </p>

      <h2>1. Objeto</h2>
      <p>
        CO-MATCH facilita que las dependencias de la Universidad de La Sabana publiquen necesidades de
        automatización y que los estudiantes se postulen a ellas, con base en un puntaje de compatibilidad.
      </p>

      <h2>2. Registro y cuentas</h2>
      <ul>
        <li>El registro requiere un correo institucional @unisabana.edu.co.</li>
        <li>Eres responsable de la confidencialidad de tu contraseña y de la actividad de tu cuenta.</li>
        <li>La información de tu perfil debe ser veraz y estar actualizada.</li>
      </ul>

      <h2>3. Uso aceptable</h2>
      <ul>
        <li>No publicar contenido falso, ofensivo, discriminatorio o que infrinja derechos de terceros.</li>
        <li>No intentar acceder a información de otros usuarios ni vulnerar la seguridad de la plataforma.</li>
        <li>Usar la mensajería únicamente para asuntos relacionados con los proyectos.</li>
      </ul>

      <h2>4. Puntaje de compatibilidad</h2>
      <p>
        El puntaje es una recomendación automática calculada a partir de habilidades, disponibilidad y
        preferencias. No constituye una decisión de selección: la decisión final la toma la dependencia
        junto con la Coordinación PAT.
      </p>

      <h2>5. Propiedad intelectual</h2>
      <p>
        Los entregables desarrollados en los proyectos se rigen por el reglamento de propiedad intelectual de
        la Universidad de La Sabana y por los acuerdos que se firmen para cada proyecto.
      </p>

      <h2>6. Datos personales</h2>
      <p>
        El tratamiento de tus datos se rige por nuestra{' '}
        <Link href="/privacidad" className="text-primary hover:underline">Política de Privacidad</Link>.
      </p>

      <h2>7. Limitación de responsabilidad</h2>
      <p>
        CO-MATCH es un proyecto académico y se ofrece &quot;tal cual&quot;. Haremos esfuerzos razonables para
        mantener el servicio disponible, pero no garantizamos que esté libre de errores o interrupciones.
      </p>

      <h2>8. Reporte de errores y contacto</h2>
      <p>
        Puedes reportar errores o enviar sugerencias en{' '}
        <Link href="/reportar" className="text-primary hover:underline">Reportar un problema</Link>.
      </p>
    </LegalPage>
  );
}
