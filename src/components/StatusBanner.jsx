import { Radio, Satellite, AlertTriangle, RefreshCw } from 'lucide-react';

const ERROR_COPY = {
  RATE_LIMITED: '(free tier busy — try refresh soon)',
  API_ERROR: '(feed unreachable)',
  NO_RESULTS: '(no eligible live roles right now)',
  UNKNOWN_ERROR: '(feed unreachable)',
};

/**
 * Live-feed status strip at the top of the sidebar. Shows connection state,
 * active listing count, a manual refresh action, and the Live/Demo toggle.
 */
const SOURCE_LINKS = {
  remotive: { label: 'Remotive', href: 'https://remotive.com' },
  jobicy: { label: 'Jobicy', href: 'https://jobicy.com' },
};

export default function StatusBanner({ source, count, loading, error, onToggleMode, onRefresh, sourcesUsed = [] }) {
  const isLive = source === 'live';

  return (
    <div className="space-y-1.5">
      <div className="rounded-xl border border-radar-border bg-radar-card/60 px-3.5 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isLive ? (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-radar-live animate-pulseDot" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-radar-live" />
            </span>
          ) : (
            <AlertTriangle size={14} className="shrink-0 text-amber-400" />
          )}
          <p className="text-xs text-radar-muted truncate">
            {loading ? (
              'Scanning live feed…'
            ) : isLive ? (
              <>
                <span className="text-radar-live font-medium">Connected to live feed</span>
                {' · '}
                <span className="text-slate-200 font-semibold">{count}</span> active listings in Ahmedabad
              </>
            ) : (
              <>
                <span className="text-amber-400 font-medium">Demo Mode</span>
                {' · '}
                <span className="text-slate-200 font-semibold">{count}</span> curated listings
                {error && ` ${ERROR_COPY[error] || ''}`}
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-lg border border-radar-border bg-radar-panel p-1.5 text-radar-muted hover:border-radar-accent/50 hover:text-radar-accent transition-colors disabled:opacity-50"
            title="Refresh live feed"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={onToggleMode}
            className="flex items-center gap-1.5 rounded-lg border border-radar-border bg-radar-panel px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-radar-accent/50 hover:text-radar-accent transition-colors"
            title="Switch between Live and Demo data"
          >
            {isLive ? <Satellite size={12} /> : <Radio size={12} />}
            {isLive ? 'Live' : 'Demo'}
          </button>
        </div>
      </div>

      {isLive && (
        <p className="px-1 text-[10px] text-radar-muted">
          Live roles via{' '}
          {(sourcesUsed.length ? sourcesUsed : ['remotive', 'jobicy']).map((key, i, arr) => {
            const src = SOURCE_LINKS[key];
            if (!src) return null;
            return (
              <span key={key}>
                <a href={src.href} target="_blank" rel="noopener noreferrer" className="text-radar-accent hover:underline">
                  {src.label}
                </a>
                {i < arr.length - 1 ? ' + ' : ''}
              </span>
            );
          })}{' '}
          — free, keyless public job feeds, filtered to roles open to India-based applicants. Not affiliated with LinkedIn, Indeed, or Naukri.
        </p>
      )}
    </div>
  );
}
