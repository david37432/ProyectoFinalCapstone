'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';

interface FilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: {
    all: number;
    high: number;
    medium: number;
    contacted: number;
  };
}

export function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  const filters = [
    { value: 'all', label: 'Todos', count: counts.all },
    { value: 'high', label: '≥ 90% Compatibilidad', count: counts.high },
    { value: 'medium', label: '80% - 89% Compatibilidad', count: counts.medium },
    { value: 'contacted', label: 'Contactados', count: counts.contacted },
  ];

  return (
    <Tabs value={activeFilter} onValueChange={onFilterChange} className="w-full">
      <TabsList className="grid grid-cols-4 gap-1 w-full">
        {filters.map((filter) => (
          <TabsTrigger
            key={filter.value}
            value={filter.value}
            className={cn(
              'px-3 py-2 text-xs font-medium',
              'data-[state=active]:bg-white data-[state=active]:shadow-sm',
              'hover:bg-neutral-50'
            )}
          >
            <div className="flex flex-col items-center gap-1">
              <span>{filter.label}</span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                activeFilter === filter.value
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-600'
              )}>
                {filter.count}
              </span>
            </div>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}