// api/jobs.js
// -----------------------------------------------------------------------------
// Live job data is pooled from TWO genuinely free, keyless, no-signup public
// job board APIs — Remotive and Jobicy. Neither requires an account, a
// credit card, or a .env file. (LinkedIn, Indeed, and Naukri do not offer
// anything like this: their job data is only reachable through paid/keyed
// aggregators like JSearch, or by scraping their sites directly — which
// violates their terms of service and is blocked by CORS from a browser
// anyway. So this app deliberately does not pretend to pull from them.)
//
// Trade-off: both sources are remote-jobs boards, not Ahmedabad-specific
// scrapers, and each is individually a fairly small pool at any given
// moment. Combining them gives a meaningfully bigger, still 100%-free live
// feed. We keep only postings whose stated location eligibility is open to
// India/APAC/Worldwide candidates (so what's shown is something an
// Ahmedabad-based applicant could actually apply to), then hand them to
// geoMapper to scatter across the city. If both sources fail or return
// nothing usable, we fall back to a curated demo dataset of real Ahmedabad
// companies — same graceful-degradation pattern as before.
//
// (Considered: Himalayas' public API has a much bigger pool (~98k jobs) but
// sends no Access-Control-Allow-Origin header, so browsers block it outright
// — it would need a server-side proxy, which is out of scope for a
// static/no-backend app.)

import { getFallbackJobs } from '../data/fallbackJobs';
import { resolveJobLocation } from '../utils/geoMapper';
import { htmlToText } from '../utils/html';

const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs';
const JOBICY_URL = 'https://jobicy.com/api/v2/remote-jobs';

// Both sources describe location eligibility as free text ("Worldwide",
// "USA, Canada", "LATAM, Europe, APAC", "Anywhere", …). We keep roles that
// are plausibly open to a candidate based in India.
const INDIA_ELIGIBLE_PATTERN = /india|worldwide|anywhere|global|apac|\basia\b/i;

function isIndiaEligible(location = '') {
  if (!location.trim()) return true; // no restriction stated = assume open
  return INDIA_ELIGIBLE_PATTERN.test(location);
}

/** Converts one raw Remotive job into our canonical job shape. */
function fromRemotive(raw) {
  return {
    job_id: `remotive-${raw.id}`,
    employer_name: raw.company_name,
    employer_logo: raw.company_logo || raw.company_logo_url || null,
    employer_website: raw.company_url || null,
    job_title: raw.title,
    job_employment_type: (raw.job_type || 'full_time').toUpperCase(),
    job_apply_link: raw.url,
    job_city: '', // unknown — lets geoMapper fall back to scatter + "Ahmedabad" label
    job_state: '',
    job_country: 'IN',
    job_is_remote: true,
    job_posted_at_datetime_utc: raw.publication_date,
    job_salary_text: raw.salary || null,
    job_required_skills: Array.isArray(raw.tags) ? raw.tags : [],
    job_description: htmlToText(raw.description || ''),
    job_source: 'remotive',
    job_source_label: 'Remotive',
    job_source_url: raw.url,
  };
}

/** Converts one raw Jobicy job into our canonical job shape. */
function fromJobicy(raw) {
  return {
    job_id: `jobicy-${raw.id}`,
    employer_name: raw.companyName,
    employer_logo: raw.companyLogo || null,
    employer_website: null,
    job_title: raw.jobTitle,
    job_employment_type: (Array.isArray(raw.jobType) ? raw.jobType[0] : raw.jobType || 'full_time')
      .toUpperCase()
      .replace(/[\s-]+/g, '_'),
    job_apply_link: raw.url,
    job_city: '',
    job_state: '',
    job_country: 'IN',
    job_is_remote: true,
    job_posted_at_datetime_utc: raw.pubDate,
    job_min_salary: raw.salaryMin || null,
    job_max_salary: raw.salaryMax || null,
    job_salary_currency: raw.salaryCurrency || null,
    job_salary_period: raw.salaryPeriod || null,
    job_required_skills: Array.isArray(raw.jobIndustry) ? raw.jobIndustry : [],
    job_description: htmlToText(raw.jobDescription || raw.jobExcerpt || ''),
    job_source: 'jobicy',
    job_source_label: 'Jobicy',
    job_source_url: raw.url,
  };
}

/** Converts a curated fallback/demo job (already in canonical shape) through unchanged. */
function fromFallback(raw) {
  return { ...raw, job_source: 'demo' };
}

/**
 * Attaches map coordinates, a neighborhood label, and a stable id to a
 * canonical job object so downstream components never need to know which
 * source it came from.
 */
export function normalizeJob(job) {
  const { coords, neighborhood, hubKey } = resolveJobLocation(job);
  return { ...job, coords, neighborhood, hubKey };
}

async function fetchRemotive() {
  const response = await fetch(`${REMOTIVE_URL}?limit=200`);
  if (response.status === 429) {
    const err = new Error('Remotive rate limit hit');
    err.code = 'RATE_LIMITED';
    throw err;
  }
  if (!response.ok) {
    const err = new Error(`Remotive API error: ${response.status}`);
    err.code = 'API_ERROR';
    throw err;
  }
  const payload = await response.json();
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  return jobs.filter((j) => isIndiaEligible(j.candidate_required_location)).map(fromRemotive);
}

async function fetchJobicy() {
  const response = await fetch(`${JOBICY_URL}?count=200`);
  if (response.status === 429) {
    const err = new Error('Jobicy rate limit hit');
    err.code = 'RATE_LIMITED';
    throw err;
  }
  if (!response.ok) {
    const err = new Error(`Jobicy API error: ${response.status}`);
    err.code = 'API_ERROR';
    throw err;
  }
  const payload = await response.json();
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  return jobs.filter((j) => isIndiaEligible(j.jobGeo)).map(fromJobicy);
}

/**
 * Fetches the full live/demo job pool ONCE, from both free sources in
 * parallel. All search/filter interactions afterwards run client-side
 * against this cached list via applyClientFilters — both APIs ask
 * integrators not to hammer their free endpoints, so we fetch a broad batch
 * up front instead of refetching per keystroke.
 *
 * @returns {{ jobs: object[], source: 'live'|'demo', error: string|null }}
 */
export async function fetchJobs({ forceDemo = false } = {}) {
  if (forceDemo) {
    return { jobs: getFallbackJobs().map(fromFallback).map(normalizeJob), source: 'demo', error: null };
  }

  const results = await Promise.allSettled([fetchRemotive(), fetchJobicy()]);
  const combined = results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
  const allFailed = results.every((r) => r.status === 'rejected');

  if (combined.length > 0) {
    return { jobs: combined.map(normalizeJob), source: 'live', error: null };
  }

  const firstError = results.find((r) => r.status === 'rejected');
  return {
    jobs: getFallbackJobs().map(fromFallback).map(normalizeJob),
    source: 'demo',
    error: allFailed ? firstError?.reason?.code || 'UNKNOWN_ERROR' : 'NO_RESULTS',
  };
}

/** All search/filter/date logic runs client-side against the cached job pool. */
export function applyClientFilters(jobs, { search, experience, remoteOnly, datePosted }) {
  let results = jobs;

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (j) =>
        j.job_title?.toLowerCase().includes(q) ||
        j.employer_name?.toLowerCase().includes(q) ||
        j.job_description?.toLowerCase().includes(q) ||
        (j.job_required_skills || []).some((s) => s.toLowerCase().includes(q))
    );
  }

  if (remoteOnly) {
    results = results.filter((j) => j.job_is_remote);
  }

  if (datePosted && datePosted !== 'month') {
    const cutoffDays = datePosted === 'today' ? 1 : 7;
    const cutoffMs = Date.now() - cutoffDays * 86400000;
    results = results.filter((j) => {
      const t = new Date(j.job_posted_at_datetime_utc).getTime();
      return Number.isNaN(t) || t >= cutoffMs;
    });
  }

  if (experience && experience !== 'all') {
    const patterns = {
      internship: /\bintern(ship)?\b/i,
      entry: /\b(junior|entry.level|fresher|associate)\b/i,
      mid: /\b(mid.level|ii|2\+ years|3\+ years)\b/i,
      senior: /\b(senior|lead|principal|staff|sr\.)\b/i,
    };
    const pattern = patterns[experience];
    if (pattern) {
      results = results.filter((j) => pattern.test(j.job_title) || pattern.test(j.job_description || ''));
    }
  }

  return results;
}
