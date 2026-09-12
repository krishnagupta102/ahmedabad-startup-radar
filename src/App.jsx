import { useEffect, useMemo, useState, useCallback } from 'react';
import JobSidebar from './components/JobSidebar';
import MapCanvas from './components/MapCanvas';
import JobDetailDrawer from './components/JobDetailDrawer';
import IntroSplash from './components/IntroSplash';
import { fetchJobs, applyClientFilters } from './api/jobs';

const DEBOUNCE_MS = 300;
const INTRO_SESSION_KEY = 'asr-intro-shown';

export default function App() {
  // Show the radar-globe intro once per browser tab, not on every re-render
  // or SPA navigation — a fresh tab/reload brings it back.
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !sessionStorage.getItem(INTRO_SESSION_KEY);
    } catch {
      return true; // sessionStorage unavailable (e.g. privacy mode) — just show it once
    }
  });
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ experience: 'all', remoteOnly: false, datePosted: 'week' });

  const [jobs, setJobs] = useState([]);
  const [source, setSource] = useState('live');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualDemo, setManualDemo] = useState(false); // user-forced Demo Mode

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [drawerJob, setDrawerJob] = useState(null);

  // Debounce the free-text search box (purely client-side, but keeps typing snappy).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch the job pool once (and whenever Live/Demo mode is toggled or a
  // manual refresh is requested) — search/filters are applied client-side
  // below so we're not hitting the free Remotive endpoint on every keystroke.
  const loadJobs = useCallback((forceDemo) => {
    let cancelled = false;
    setLoading(true);

    fetchJobs({ forceDemo }).then((result) => {
      if (cancelled) return;
      setJobs(result.jobs);
      setSource(result.source);
      setError(result.error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => loadJobs(manualDemo), [manualDemo, loadJobs]);

  const sourcesUsed = useMemo(() => [...new Set(jobs.map((j) => j.job_source))], [jobs]);

  const displayedJobs = useMemo(
    () =>
      applyClientFilters(jobs, {
        search: debouncedSearch,
        experience: filters.experience,
        remoteOnly: filters.remoteOnly,
        datePosted: filters.datePosted,
      }),
    [jobs, debouncedSearch, filters]
  );

  const handleFilterChange = (patch) => setFilters((prev) => ({ ...prev, ...patch }));

  const handleSelectJob = (job) => setSelectedJobId(job.job_id);

  const handleApply = (job) => setDrawerJob(job);

  const handleToggleMode = () => setManualDemo((prev) => !prev);

  const handleRefresh = () => loadJobs(manualDemo);

  const dismissIntro = () => {
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, '1');
    } catch {
      // ignore — worst case the intro just replays next load
    }
    setShowIntro(false);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-radar-bg lg:flex-row">
      {showIntro && <IntroSplash onFinish={dismissIntro} />}
      <div className="h-[45vh] w-full shrink-0 border-b border-radar-border lg:h-full lg:w-[40%] lg:max-w-xl lg:border-b-0 lg:border-r">
        <JobSidebar
          jobs={displayedJobs}
          loading={loading}
          source={source}
          error={error}
          search={searchInput}
          onSearchChange={setSearchInput}
          filters={filters}
          onFilterChange={handleFilterChange}
          selectedJobId={selectedJobId}
          onSelectJob={handleSelectJob}
          onApply={handleApply}
          onToggleMode={handleToggleMode}
          onRefresh={handleRefresh}
          sourcesUsed={sourcesUsed}
        />
      </div>

      <div className="relative min-h-0 flex-1">
        <MapCanvas jobs={displayedJobs} selectedJobId={selectedJobId} onSelectJob={handleSelectJob} onApply={handleApply} />
      </div>

      <JobDetailDrawer job={drawerJob} onClose={() => setDrawerJob(null)} />
    </div>
  );
}
