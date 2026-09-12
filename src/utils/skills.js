// Lightweight keyword-scan skill extractor. JSearch sometimes returns
// job_required_skills directly (Google Jobs derived listings) — when it
// doesn't, we fall back to scanning the description for common stack terms.
const SKILL_KEYWORDS = [
  'React', 'React Native', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Node',
  'Express', 'Django', 'Flask', 'FastAPI', 'Ruby on Rails', 'Spring Boot',
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Golang', 'Rust',
  'PHP', 'C++', 'C#', '.NET', 'Kotlin', 'Swift',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
  'HTML', 'CSS', 'Tailwind', 'SASS', 'Figma',
  'Machine Learning', 'Data Science', 'Pandas', 'TensorFlow', 'PyTorch',
  'Salesforce', 'HubSpot', 'SEO', 'Google Ads', 'Excel', 'Power BI',
  'Communication', 'Negotiation', 'Lead Generation', 'CRM',
];

export function extractSkills(job, limit = 8) {
  if (Array.isArray(job.job_required_skills) && job.job_required_skills.length) {
    return job.job_required_skills.slice(0, limit);
  }

  const haystack = `${job.job_title || ''} ${job.job_description || ''}`;
  const found = SKILL_KEYWORDS.filter((skill) => {
    const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return pattern.test(haystack);
  });

  return [...new Set(found)].slice(0, limit);
}
