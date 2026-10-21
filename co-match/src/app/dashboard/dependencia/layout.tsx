'use client';

import { AdminHeader } from '@/components/layout/admin/AdminHeader';
import { AdminSidebar } from '@/components/layout/admin/AdminSidebar';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function DependenciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<'web' | 'mobile'>('web');

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminHeader
        userName="Usuario"
        departmentName="Dependencia"
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