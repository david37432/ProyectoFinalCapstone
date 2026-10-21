'use client';

const DURATION_OPTIONS = [1, 2, 3, 4, 6];

interface DurationSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DurationSelect({ value, onChange, disabled }: DurationSelectProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {DURATION_OPTIONS.map((months) => (
        <button
          key={months}
          type="button"
          onClick={() => onChange(String(months))}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
            value === String(months)
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary/50'
          }`}
        >
          {months} mes{months !== 1 ? 'es' : ''}
        </button>
      ))}
    </div>
  );
}