import { useEffect, useState } from 'react';
import { X, ExternalLink, BookmarkCheck, MapPin, Clock, Wallet, CheckCircle2, ListChecks, Gift } from 'lucide-react';
import { timeAgo, formatSalary } from '../utils/time';
import { extractSkills } from '../utils/skills';
import { isJobTracked, trackJob } from '../utils/storage';

function Section({ icon: Icon, title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-radar-muted">
        <Icon size={13} /> {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-300">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-radar-accent" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function JobDetailDrawer({ job, onClose }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (job) setSaved(isJobTracked(job.job_id));
  }, [job]);

  if (!job) return null;

  const salary = formatSalary(job);
  const skills = extractSkills(job, 10);
  const highlights = job.job_highlights || {};

  const handleSave = () => {
    trackJob(job);
    setSaved(true);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[1400] bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-[1401] flex h-full w-full max-w-md animate-slideIn flex-col bg-radar-panel shadow-2xl border-l border-radar-border">
        <div className="flex items-start justify-between gap-3 border-b border-radar-border p-5">
          <div className="flex gap-3">
            {job.employer_logo ? (
              <img src={job.employer_logo} alt="" className="h-12 w-12 rounded-lg border border-radar-border bg-white object-contain p-1.5" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-radar-accent/30 to-radar-accent2/30 text-sm font-bold">
                {(job.employer_name || '?').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-display text-base font-bold text-slate-50">{job.job_title}</h2>
              <p className="text-sm text-radar-muted">{job.employer_name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-radar-muted hover:bg-white/5 hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-full border border-radar-border bg-radar-card px-2.5 py-1 text-radar-muted">
              <MapPin size={11} className="text-radar-accent" /> {job.neighborhood}
            </span>
            <span className="flex items-center gap-1 rounded-full border border-radar-border bg-radar-card px-2.5 py-1 text-radar-muted">
              <Clock size={11} /> {timeAgo(job.job_posted_at_datetime_utc)}
            </span>
            {salary && (
              <span className="flex items-center gap-1 rounded-full border border-radar-border bg-radar-card px-2.5 py-1 text-emerald-400">
                <Wallet size={11} /> {salary}
              </span>
            )}
            {job.job_is_remote && (
              <span className="rounded-full bg-radar-accent2/15 px-2.5 py-1 font-medium text-radar-accent2">Remote</span>
            )}
            {job.job_employment_type && (
              <span className="rounded-full border border-radar-border bg-radar-card px-2.5 py-1 text-radar-muted">
                {job.job_employment_type.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {skills.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-radar-muted">Skills & Stack</h4>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span key={skill} className="rounded-md border border-radar-border bg-radar-card px-2 py-1 text-xs text-slate-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-radar-muted">Full Description</h4>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{job.job_description}</p>
          </div>

          <Section icon={CheckCircle2} title="Qualifications" items={highlights.Qualifications} />
          <Section icon={ListChecks} title="Responsibilities" items={highlights.Responsibilities} />
          <Section icon={Gift} title="Benefits" items={highlights.Benefits} />
        </div>

        <div className="space-y-2.5 border-t border-radar-border p-5">
          <a
            href={job.job_apply_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleSave}
            className="asr-shine-btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-radar-accent to-radar-accent2 py-3 text-sm font-bold text-radar-bg transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            Apply on Official Site
            <ExternalLink size={15} />
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-radar-border py-2.5 text-xs font-medium text-radar-muted transition-colors hover:border-radar-accent/50 hover:text-radar-accent disabled:cursor-default disabled:border-radar-live/40 disabled:text-radar-live"
          >
            <BookmarkCheck size={14} />
            {saved ? 'Saved to your application tracker' : 'Save to my application tracker'}
          </button>
          <p className="text-center text-[10px] text-radar-muted">
            Saves this job to your local application tracker (stored in your browser's localStorage — nothing leaves your device).
          </p>
        </div>
      </div>
    </>
  );
}
