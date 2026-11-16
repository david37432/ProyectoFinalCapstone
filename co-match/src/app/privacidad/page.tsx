import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';
import { PRIVACY_POLICY_DATE_LABEL } from '@/lib/privacy';

export const metadata: Metadata = {
  title: 'Política de Privacidad y Tratamiento de Datos | CO-MATCH',
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de Privacidad y Tratamiento de Datos Personales" updatedAt={PRIVACY_POLICY_DATE_LABEL}>
      <p>
        CO-MATCH es una plataforma académica de la Universidad de La Sabana que conecta a estudiantes con
        dependencias de la universidad para proyectos del Programa Aprende Trabajando (PAT). Esta política
        se rige por la Ley Estatutaria 1581 de 2012 (Habeas Data), el Decreto 1377 de 2013 (compilado en el
        Decreto 1074 de 2015) y demás normas colombianas sobre protección de datos personales.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento es el equipo de CO-MATCH, en el marco del proyecto Capstone de la
        Universidad de La Sabana (Campus del Puente del Común, Chía, Cundinamarca). Las consultas, reclamos y
        solicitudes sobre tus datos se atienden a través del formulario de{' '}
        <Link href="/reportar" className="text-primary hover:underline">contacto y reportes</Link>.
      </p>

      <h2>2. Autorización</h2>
      <p>
        Al crear tu cuenta, y marcando la casilla de autorización del registro, nos das tu autorización previa,
        expresa e informada para tratar tus datos según esta política. Guardamos la fecha de la autorización y la
        versión de la política vigente en ese momento. Puedes revocarla en cualquier momento (ver el numeral 8);
        si lo haces, no podremos seguir prestándote el servicio.
      </p>

      <h2>3. Datos que recolectamos</h2>
      <ul>
        <li>Datos de identificación y contacto: nombre, correo institucional, teléfono y código estudiantil.</li>
        <li>Datos académicos y profesionales: carrera, semestre, promedio, habilidades, experiencia e intereses.</li>
        <li>Fotografía de perfil, si decides subirla.</li>
        <li>Datos de uso de la plataforma: postulaciones, mensajes, archivos adjuntos en el chat, hitos y horas registradas en proyectos.</li>
        <li>Datos técnicos: cookies estrictamente necesarias para mantener la sesión iniciada.</li>
      </ul>
      <p>
        CO-MATCH no solicita datos sensibles (salud, origen étnico, orientación política o religiosa, etc.). Te
        pedimos no incluirlos en tu perfil, en los mensajes ni en los archivos que compartas por el chat. La
        plataforma está dirigida a estudiantes y personal de la universidad mayores de edad; no se recolectan
        intencionalmente datos de menores de edad.
      </p>

      <h2>4. Finalidades</h2>
      <ul>
        <li>Crear y administrar la cuenta del usuario y autenticarlo.</li>
        <li>Calcular la compatibilidad entre estudiantes y necesidades publicadas por las dependencias.</li>
        <li>Permitir la comunicación (mensajes y archivos) entre estudiantes y dependencias y el seguimiento de los proyectos.</li>
        <li>Enviar avisos dentro de la plataforma sobre postulaciones, mensajes e hitos de los proyectos.</li>
        <li>Generar estadísticas agregadas y anónimas para mejorar el servicio.</li>
      </ul>

      <h2>5. Quién puede ver tus datos</h2>
      <ul>
        <li>
          <strong>Dependencias:</strong> solo ven el perfil académico y de contacto de los estudiantes que se postulan
          a sus necesidades o con quienes tienen una conversación.
        </li>
        <li>
          <strong>Estudiantes:</strong> solo ven las necesidades publicadas y los mensajes de sus propias conversaciones.
        </li>
        <li>
          <strong>Archivos del chat:</strong> se guardan en un espacio privado y solo pueden abrirlos las dos personas de la conversación.
        </li>
        <li>No vendemos ni compartimos tus datos con terceros con fines comerciales o publicitarios.</li>
      </ul>

      <h2>6. Encargados y transferencia de datos</h2>
      <p>
        Para operar la plataforma usamos proveedores que tratan datos en nuestro nombre: Supabase (base de datos,
        autenticación y almacenamiento de archivos) y Vercel (alojamiento de la aplicación). Estos proveedores pueden
        almacenar o procesar la información en servidores ubicados fuera de Colombia; en ese caso la transferencia
        se hace a proveedores con estándares de seguridad adecuados y solo para prestar el servicio.
      </p>

      <h2>7. Derechos del titular</h2>
      <p>De acuerdo con el artículo 8 de la Ley 1581 de 2012, como titular puedes:</p>
      <ul>
        <li>Conocer, actualizar y rectificar tus datos personales.</li>
        <li>Solicitar prueba de la autorización otorgada.</li>
        <li>Ser informado sobre el uso que se ha dado a tus datos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
        <li>Revocar la autorización y/o solicitar la supresión de tus datos cuando no exista un deber legal o contractual de conservarlos.</li>
        <li>Acceder gratuitamente a tus datos personales.</li>
      </ul>

      <h2>8. Procedimiento para consultas, reclamos y supresión</h2>
      <p>
        Escríbenos desde el formulario de contacto indicando qué derecho quieres ejercer. Las consultas se responden
        en un máximo de diez (10) días hábiles y los reclamos en un máximo de quince (15) días hábiles, contados desde
        su recepción, prorrogables en los términos de la ley. Si solicitas la supresión, eliminamos tu cuenta, tu
        perfil, tus mensajes y tus archivos, salvo la información que debamos conservar por un deber legal o
        contractual.
      </p>

      <h2>9. Conservación</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa y mientras sea necesario para las finalidades descritas.
        Las necesidades eliminadas por una dependencia dejan de mostrarse, pero pueden conservarse de forma interna
        mientras existan postulaciones asociadas, para mantener el historial del proceso. Los archivos del chat se
        eliminan cuando se suprime la cuenta o la conversación.
      </p>

      <h2>10. Seguridad</h2>
      <p>
        Los datos se almacenan en Supabase (PostgreSQL) con cifrado en tránsito (HTTPS/TLS), control de acceso
        por roles y políticas de seguridad a nivel de fila (RLS), de modo que cada usuario solo accede a la
        información que le corresponde. Las contraseñas se almacenan cifradas y nunca son visibles para el equipo.
        Si detectamos un incidente que afecte tus datos, te lo informaremos y lo reportaremos a la autoridad
        competente cuando corresponda.
      </p>

      <h2>11. Cookies</h2>
      <p>
        Usamos únicamente cookies técnicas necesarias para la autenticación. No usamos cookies publicitarias ni
        de seguimiento. En tu navegador guardamos solo preferencias locales (por ejemplo, cuándo viste por última
        vez tus notificaciones).
      </p>

      <h2>12. Cambios en esta política</h2>
      <p>
        Si modificamos esta política de forma sustancial, lo anunciaremos en la plataforma y, cuando la ley lo
        exija, pediremos de nuevo tu autorización. La fecha de la última actualización aparece al inicio de este
        documento.
      </p>
    </LegalPage>
  );
}
