'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4" aria-label="CO-MATCH Home">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">CM</span>
              </div>
              <span className="font-semibold text-xl text-neutral-900">CO-MATCH</span>
            </Link>
            <p className="text-neutral-600 text-sm">
              Plataforma de gestión de talento para el programa Aprende Trabajando (PAT) de la Universidad de La Sabana.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-4">Enlaces rápidos</h4>
            <nav aria-label="Enlaces rápidos">
              <ul className="space-y-2">
                <li><Link href="/oportunidades" className="text-neutral-600 hover:text-primary text-sm transition-colors">Oportunidades</Link></li>
                <li><Link href="/dashboard" className="text-neutral-600 hover:text-primary text-sm transition-colors">Dashboard</Link></li>
                <li><Link href="/profile" className="text-neutral-600 hover:text-primary text-sm transition-colors">Mi Perfil</Link></li>
              </ul>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-4">Soporte</h4>
            <nav aria-label="Soporte">
              <ul className="space-y-2">
                <li><Link href="/ayuda" className="text-neutral-600 hover:text-primary text-sm transition-colors">Centro de ayuda</Link></li>
                <li><Link href="/contacto" className="text-neutral-600 hover:text-primary text-sm transition-colors">Contacto</Link></li>
                <li><Link href="/faq" className="text-neutral-600 hover:text-primary text-sm transition-colors">Preguntas frecuentes</Link></li>
              </ul>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-4">Legal</h4>
            <nav aria-label="Legal">
              <ul className="space-y-2">
                <li><Link href="/terminos" className="text-neutral-600 hover:text-primary text-sm transition-colors">Términos y condiciones</Link></li>
                <li><Link href="/privacidad" className="text-neutral-600 hover:text-primary text-sm transition-colors">Política de privacidad</Link></li>
                <li><Link href="/cookies" className="text-neutral-600 hover:text-primary text-sm transition-colors">Política de cookies</Link></li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-neutral-500 text-sm">
            © 2024 Universidad de La Sabana. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://unisabana.edu.co" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-primary text-sm transition-colors">
              unisabana.edu.co
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}