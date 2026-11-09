import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Política de Privacidad y Tratamiento de Datos | CO-MATCH',
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de Privacidad y Tratamiento de Datos Personales" updatedAt="8 de noviembre de 2026">
      <p>
        CO-MATCH es una plataforma académica de la Universidad de La Sabana que conecta a estudiantes con
        dependencias de la universidad para proyectos del Programa de Asistencia Técnica (PAT). Esta política
        se rige por la Ley Estatutaria 1581 de 2012 (Habeas Data), el Decreto 1377 de 2013 (compilado en el
        Decreto 1074 de 2015) y demás normas colombianas sobre protección de datos personales.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento es el equipo de CO-MATCH, en el marco del proyecto Capstone de la
        Universidad de La Sabana (Campus del Puente del Común, Chía, Cundinamarca). Las solicitudes se
        atienden a través del formulario de <Link href="/reportar" className="text-primary hover:underline">contacto y reportes</Link>.
      </p>

      <h2>2. Datos que recolectamos</h2>
      <ul>
        <li>Datos de identificación y contacto: nombre, correo institucional, teléfono y código estudiantil.</li>
        <li>Datos académicos y profesionales: carrera, semestre, habilidades, experiencia e intereses.</li>
        <li>Datos de uso de la plataforma: postulaciones, mensajes, hitos y horas registradas en proyectos.</li>
        <li>Datos técnicos: cookies estrictamente necesarias para mantener la sesión iniciada.</li>
      </ul>
      <p>CO-MATCH no solicita datos sensibles (salud, origen étnico, orientación política o religiosa, etc.).</p>

      <h2>3. Finalidades</h2>
      <ul>
        <li>Crear y administrar la cuenta del usuario y autenticarlo.</li>
        <li>Calcular la compatibilidad entre estudiantes y necesidades publicadas por las dependencias.</li>
        <li>Permitir la comunicación entre estudiantes y dependencias y el seguimiento de los proyectos.</li>
        <li>Enviar notificaciones relacionadas con postulaciones y proyectos.</li>
        <li>Generar estadísticas agregadas y anónimas para mejorar el servicio.</li>
      </ul>

      <h2>4. Derechos del titular</h2>
      <p>De acuerdo con el artículo 8 de la Ley 1581 de 2012, como titular puedes:</p>
      <ul>
        <li>Conocer, actualizar y rectificar tus datos personales.</li>
        <li>Solicitar prueba de la autorización otorgada.</li>
        <li>Ser informado sobre el uso que se ha dado a tus datos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
        <li>Revocar la autorización y/o solicitar la supresión de tus datos cuando no exista un deber legal o contractual de conservarlos.</li>
        <li>Acceder gratuitamente a tus datos personales.</li>
      </ul>

      <h2>5. Procedimiento para consultas y reclamos</h2>
      <p>
        Las consultas se responden en un máximo de diez (10) días hábiles y los reclamos en un máximo de
        quince (15) días hábiles, contados desde su recepción, prorrogables en los términos de la ley.
      </p>

      <h2>6. Seguridad y almacenamiento</h2>
      <p>
        Los datos se almacenan en Supabase (PostgreSQL) con cifrado en tránsito (HTTPS/TLS), control de acceso
        por roles y políticas de seguridad a nivel de fila (RLS), de modo que cada usuario solo accede a la
        información que le corresponde. Las contraseñas se almacenan cifradas y nunca son visibles para el equipo.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Usamos únicamente cookies técnicas necesarias para la autenticación. No usamos cookies publicitarias.
      </p>

      <h2>8. Vigencia</h2>
      <p>
        Esta política rige desde su publicación. Los datos se conservarán mientras la cuenta esté activa o
        mientras sea necesario para las finalidades descritas.
      </p>
    </LegalPage>
  );
}
