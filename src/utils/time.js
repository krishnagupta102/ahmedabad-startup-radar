// Small relative-time formatter so we don't pull in a date library for one function.
export function timeAgo(isoString) {
  if (!isoString) return 'Recently';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Recently';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';

  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [unit, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) {
      return `${value} ${unit}${value > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
}

export function formatSalary(job) {
  // Some sources (e.g. Remotive) give a free-text range instead of numbers.
  if (job.job_salary_text) return job.job_salary_text;

  const { job_min_salary: min, job_max_salary: max, job_salary_currency: currency, job_salary_period: period } = job;
  if (!min && !max) return null;

  const fmt = (n) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return `${n}`;
  };

  const symbol = currency === 'INR' ? '₹' : currency ? `${currency} ` : '₹';
  const periodLabel = period ? `/${period.toLowerCase()}` : '/yr';

  if (min && max) return `${symbol}${fmt(min)} - ${fmt(max)}${periodLabel}`;
  return `${symbol}${fmt(min || max)}${periodLabel}`;
}
