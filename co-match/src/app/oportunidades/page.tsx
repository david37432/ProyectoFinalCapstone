'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OportunidadesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/estudiante/explorar');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="flex items-center gap-3 text-primary">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg">CM</span>
        </div>
        <span className="font-semibold text-xl text-neutral-900">CO-MATCH</span>
      </div>
    </div>
  );
}