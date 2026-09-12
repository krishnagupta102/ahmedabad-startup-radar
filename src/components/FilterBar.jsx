import { Search } from 'lucide-react';

const EXPERIENCE_OPTIONS = [
  { value: 'all', label: 'All levels' },
  { value: 'internship', label: 'Internship' },
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
];

const DATE_OPTIONS = [
  { value: 'today', label: 'Past 24h' },
  { value: 'week', label: 'Past week' },
  { value: 'month', label: 'Past month' },
];

function Pill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-radar-accent/60 bg-radar-accent/15 text-radar-accent'
          : 'border-radar-border bg-radar-panel text-radar-muted hover:text-slate-200 hover:border-slate-500/50'
      }`}
    >
      {children}
    </button>
  );
}

export default function FilterBar({ search, onSearchChange, filters, onFilterChange }) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-radar-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder='Search "React", "Python", "Sales", "Intern"…'
          className="w-full rounded-xl border border-radar-border bg-radar-panel py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-radar-muted focus:outline-none focus:ring-2 focus:ring-radar-accent/40 focus:border-radar-accent/60 transition"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {EXPERIENCE_OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            active={filters.experience === opt.value}
            onClick={() => onFilterChange({ experience: opt.value })}
          >
            {opt.label}
          </Pill>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Pill active={filters.remoteOnly === false} onClick={() => onFilterChange({ remoteOnly: false })}>
          All
        </Pill>
        <Pill active={filters.remoteOnly === true} onClick={() => onFilterChange({ remoteOnly: true })}>
          Remote only
        </Pill>
        <span className="mx-1 h-4 w-px bg-radar-border" />
        {DATE_OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            active={filters.datePosted === opt.value}
            onClick={() => onFilterChange({ datePosted: opt.value })}
          >
            {opt.label}
          </Pill>
        ))}
      </div>
    </div>
  );
}
