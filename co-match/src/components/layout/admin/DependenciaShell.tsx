'use client';

import { useState } from 'react';
import { AdminHeader } from '@/components/layout/admin/AdminHeader';
import { AdminSidebar } from '@/components/layout/admin/AdminSidebar';
import { cn } from '@/lib/utils';

interface DependenciaShellProps {
  children: React.ReactNode;
  userName: string;
  departmentName: string;
}

/** Encabezado + menú lateral de la sección de dependencias. Se adapta solo al tamaño de pantalla. */
export function DependenciaShell({ children, userName, departmentName }: DependenciaShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminHeader
        userName={userName}
        departmentName={departmentName}
        onMenuClick={() => setIsMobileMenuOpen(true)}
      />
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((c) => !c)}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      <main
        className={cn(
          'pt-16 transition-all duration-300 min-h-[calc(100vh-4rem)]',
          isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        {children}
      </main>
    </div>
  );
}
