// Thin localStorage wrapper for the "application tracker" feature.
const TRACKER_KEY = 'asr_application_tracker_v1';

export function getTrackedJobs() {
  try {
    const raw = localStorage.getItem(TRACKER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isJobTracked(jobId) {
  return getTrackedJobs().some((j) => j.job_id === jobId);
}

export function trackJob(job) {
  const existing = getTrackedJobs();
  if (existing.some((j) => j.job_id === job.job_id)) return existing;

  const entry = {
    job_id: job.job_id,
    job_title: job.job_title,
    employer_name: job.employer_name,
    job_apply_link: job.job_apply_link,
    saved_at: new Date().toISOString(),
  };
  const updated = [entry, ...existing];
  localStorage.setItem(TRACKER_KEY, JSON.stringify(updated));
  return updated;
}

export function untrackJob(jobId) {
  const updated = getTrackedJobs().filter((j) => j.job_id !== jobId);
  localStorage.setItem(TRACKER_KEY, JSON.stringify(updated));
  return updated;
}
