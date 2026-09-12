import { MapPin, Clock, Wallet, Building2, ArrowUpRight } from 'lucide-react';
import { timeAgo, formatSalary } from '../utils/time';

function CompanyAvatar({ job }) {
  if (job.employer_logo) {
    return (
      <img
        src={job.employer_logo}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg border border-radar-border bg-white object-contain p-1"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextSibling.style.display = 'flex';
        }}
      />
    );
  }
  return <FallbackAvatar name={job.employer_name} />;
}

function FallbackAvatar({ name }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="h-10 w-10 shrink-0 rounded-lg border border-radar-border bg-gradient-to-br from-radar-accent/30 to-radar-accent2/30 flex items-center justify-center text-xs font-bold text-slate-100">
      {initials}
    </div>
  );
}

export default function JobCard({ job, isSelected, onSelect, onApply }) {
  const salary = formatSalary(job);

  return (
    <div
      id={`job-card-${job.job_id}`}
      onClick={() => onSelect(job)}
      className={`group cursor-pointer rounded-2xl border p-3.5 transition-all ${
        isSelected
          ? 'border-radar-accent/60 bg-radar-accent/[0.07] shadow-glow'
          : 'border-radar-border bg-radar-card hover:border-slate-500/50'
      }`}
    >
      <div className="flex gap-3">
        <div className="relative">
          <CompanyAvatar job={job} />
          <div
            className="hidden h-10 w-10 shrink-0 rounded-lg border border-radar-border bg-gradient-to-br from-radar-accent/30 to-radar-accent2/30 items-center justify-center text-xs font-bold text-slate-100"
            style={{ display: 'none' }}
          >
            {(job.employer_name || '?').slice(0, 2).toUpperCase()}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-100">{job.job_title}</h3>
              <p className="flex items-center gap-1 truncate text-xs text-radar-muted">
                <Building2 size={11} className="shrink-0" />
                {job.employer_name}
              </p>
            </div>
            {job.job_is_remote && (
              <span className="shrink-0 rounded-full bg-radar-accent2/15 px-2 py-0.5 text-[10px] font-semibold text-radar-accent2">
                Remote
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-radar-muted">
            <span className="flex items-center gap-1 rounded-full bg-radar-panel border border-radar-border px-2 py-0.5">
              <MapPin size={10} className="text-radar-accent" />
              {job.neighborhood}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {timeAgo(job.job_posted_at_datetime_utc)}
            </span>
            {salary && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Wallet size={10} />
                {salary}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onApply(job);
        }}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-radar-accent to-radar-accent2 py-2 text-xs font-semibold text-radar-bg transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        Apply Now
        <ArrowUpRight size={13} />
      </button>
    </div>
  );
}
