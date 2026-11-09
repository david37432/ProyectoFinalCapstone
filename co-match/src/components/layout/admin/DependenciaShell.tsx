'use client';

import { AdminHeader } from '@/components/layout/admin/AdminHeader';
import { AdminSidebar } from '@/components/layout/admin/AdminSidebar';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface DependenciaShellProps {
  children: React.ReactNode;
  userName: string;
  departmentName: string;
}

/** Encabezado + menú lateral de la sección de dependencias (una sola vez para todas las páginas). */
export function DependenciaShell({ children, userName, departmentName }: DependenciaShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<'web' | 'mobile'>('web');

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminHeader
        userName={userName}
        departmentName={departmentName}
        onViewToggle={setCurrentView}
        currentView={currentView}
      />
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={cn(
          'pt-16 transition-all duration-300 min-h-[calc(100vh-4rem)]',
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {children}
      </main>
    </div>
  );
}