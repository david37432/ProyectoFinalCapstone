'use client';

const WEEKLY_HOURS_OPTIONS = [10, 15, 20, 25, 30];

interface WeeklyHoursSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function WeeklyHoursSelect({ value, onChange, disabled }: WeeklyHoursSelectProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {WEEKLY_HOURS_OPTIONS.map((hours) => (
        <button
          key={hours}
          type="button"
          onClick={() => onChange(String(hours))}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
            value === String(hours)
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary/50'
          }`}
        >
          {hours} hrs
        </button>
      ))}
    </div>
  );
}