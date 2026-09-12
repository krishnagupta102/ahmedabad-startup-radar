import { useEffect, useRef } from 'react';
import { Satellite, Loader2, SearchX } from 'lucide-react';
import StatusBanner from './StatusBanner';
import FilterBar from './FilterBar';
import JobCard from './JobCard';

export default function JobSidebar({
  jobs,
  loading,
  source,
  error,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  selectedJobId,
  onSelectJob,
  onApply,
  onToggleMode,
  onRefresh,
  sourcesUsed,
}) {
  const listRef = useRef(null);

  // When a map pin is clicked, scroll the matching card into view.
  useEffect(() => {
    if (!selectedJobId) return;
    const el = document.getElementById(`job-card-${selectedJobId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedJobId]);

  return (
    <aside className="relative flex h-full w-full flex-col gap-4 overflow-hidden bg-radar-bg p-4 lg:p-5">
      {/* Contained decorative glow behind the header only — kept inside the
          sidebar's own bounds so it never fights map/card readability. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-radar-accent/20 blur-3xl"
      />

      <header className="relative flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-radar-accent to-radar-accent2 shadow-glow">
          <Satellite size={18} className="text-radar-bg" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-50 to-slate-300">
            Ahmedabad Startup Radar
          </h1>
          <p className="text-[11px] text-radar-muted">Live jobs across the city, mapped in real time</p>
        </div>
      </header>

      <StatusBanner
        source={source}
        count={jobs.length}
        loading={loading}
        error={error}
        onToggleMode={onToggleMode}
        onRefresh={onRefresh}
        sourcesUsed={sourcesUsed}
      />

      <FilterBar search={search} onSearchChange={onSearchChange} filters={filters} onFilterChange={onFilterChange} />

      <div ref={listRef} className="scrollbar-thin -mr-2 flex-1 space-y-2.5 overflow-y-auto pr-2">
        {loading && jobs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-radar-muted">
            <Loader2 size={22} className="animate-spin text-radar-accent" />
            <p className="text-sm">Scanning Ahmedabad for openings…</p>
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-radar-muted">
            <SearchX size={22} />
            <p className="text-sm">No listings match your filters.</p>
            <p className="text-xs">Try a broader search term.</p>
          </div>
        )}

        {jobs.map((job, i) => (
          <JobCard
            key={job.job_id}
            job={job}
            isSelected={job.job_id === selectedJobId}
            onSelect={onSelectJob}
            onApply={onApply}
            staggerIndex={i}
          />
        ))}
      </div>
    </aside>
  );
}
