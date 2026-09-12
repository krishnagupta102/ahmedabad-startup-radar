// geoMapper.js
// -----------------------------------------------------------------------------
// Turns whatever fuzzy location info a job posting gives us (city name, state,
// company name, free-text description) into a concrete lat/lng inside
// Ahmedabad, using a hub lookup table first and a deterministic scattered
// fallback second. Deterministic = the same job/company always lands on the
// same pixel, so the map doesn't reshuffle itself on every refetch.

// Known tech/startup hubs across Ahmedabad. Coordinates are hub centers —
// jitterCoords() nudges each job a little so pins at the same hub don't stack.
export const AHMEDABAD_HUBS = {
  SG_HIGHWAY: {
    label: 'SG Highway',
    coords: [23.0489, 72.5195],
    keywords: ['sg highway', 's.g. highway', 'sarkhej gandhinagar highway', 'sindhu bhavan'.slice(0, 0)],
  },
  SBR: {
    label: 'Sindhu Bhavan Road',
    coords: [23.0456, 72.5085],
    keywords: ['sindhu bhavan', 'sbr', 'shilaj', 'bopal'],
  },
  PRAHLAD_NAGAR: {
    label: 'Prahlad Nagar',
    coords: [23.0118, 72.5115],
    keywords: ['prahlad nagar', 'prahladnagar', 'satellite', 'jodhpur'],
  },
  VASTRAPUR: {
    label: 'Vastrapur / IIM Road',
    coords: [23.0373, 72.5298],
    keywords: ['vastrapur', 'iim road', 'iim ahmedabad', 'thaltej', 'science city'],
  },
  NAVRANGPURA: {
    label: 'Navrangpura',
    coords: [23.0365, 72.5611],
    keywords: ['navrangpura', 'ellisbridge', 'law garden', 'cg road', 'c.g. road'],
  },
  GIFT_CITY: {
    label: 'GIFT City / Gandhinagar',
    coords: [23.161, 72.6842],
    keywords: ['gift city', 'gandhinagar', 'infocity', 'raisan'],
  },
};

// Fallback keyword fixed for SG Highway (kept separate to avoid an awkward
// empty-string entry above).
AHMEDABAD_HUBS.SG_HIGHWAY.keywords = ['sg highway', 's.g. highway', 'sarkhej-gandhinagar highway', 'makarba', 'thaltej cross'];

// Rough bounding box for Ahmedabad city + immediate suburbs, used to scatter
// pins for companies/areas we can't confidently place at a named hub.
export const AHMEDABAD_BOUNDS = {
  minLat: 22.95,
  maxLat: 23.18,
  minLng: 72.45,
  maxLng: 72.68,
};

export const AHMEDABAD_CENTER = [23.045, 72.535];

// Curated employer -> hub lookup for well-known Ahmedabad startups/companies.
// Keys are lowercased and stripped of legal suffixes before matching.
const COMPANY_HUB_MAP = {
  quicko: 'SG_HIGHWAY',
  saleshandy: 'PRAHLAD_NAGAR',
  'crest data systems': 'SBR',
  'crest data': 'SBR',
  'matter motor': 'VASTRAPUR',
  'matter motor works': 'VASTRAPUR',
  simform: 'SG_HIGHWAY',
  'simform solutions': 'SG_HIGHWAY',
  'space-o technologies': 'NAVRANGPURA',
  'space o technologies': 'NAVRANGPURA',
  tatvasoft: 'SBR',
  'third rock techkno': 'PRAHLAD_NAGAR',
  softuvo: 'VASTRAPUR',
  solguruz: 'SG_HIGHWAY',
  aegis: 'GIFT_CITY',
  'aegis school of business': 'GIFT_CITY',
  'gift city': 'GIFT_CITY',
};

function normalizeCompanyName(name = '') {
  return name
    .toLowerCase()
    .replace(/\b(pvt\.?|private|ltd\.?|limited|llp|inc\.?|technologies|technology|solutions|systems|corp\.?)\b/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim();
}

// Simple, fast, deterministic string hash (djb2) so the same input always
// produces the same pseudo-random offset.
function hashString(str = '') {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash >>> 0);
}

// Deterministic "random" in [0, 1) seeded by a hash.
function seededRandom(seed, salt = 0) {
  const x = Math.sin(seed + salt) * 10000;
  return x - Math.floor(x);
}

/**
 * Nudges a hub's center coordinates by a small deterministic jitter so
 * multiple companies at the same hub render as distinct, non-overlapping pins.
 */
export function jitterCoords([lat, lng], seedKey, radiusDeg = 0.006) {
  const seed = hashString(seedKey);
  const angle = seededRandom(seed, 1) * Math.PI * 2;
  const distance = seededRandom(seed, 2) * radiusDeg;
  return [lat + Math.cos(angle) * distance, lng + Math.sin(angle) * distance * 1.15];
}

/**
 * Deterministically scatters a pin inside the Ahmedabad bounding box for
 * companies/locations we have no better information about.
 */
function scatterInBounds(seedKey) {
  const seed = hashString(seedKey);
  const latSpan = AHMEDABAD_BOUNDS.maxLat - AHMEDABAD_BOUNDS.minLat;
  const lngSpan = AHMEDABAD_BOUNDS.maxLng - AHMEDABAD_BOUNDS.minLng;
  const lat = AHMEDABAD_BOUNDS.minLat + seededRandom(seed, 3) * latSpan;
  const lng = AHMEDABAD_BOUNDS.minLng + seededRandom(seed, 4) * lngSpan;
  return [lat, lng];
}

function findHubByText(text = '') {
  const lower = text.toLowerCase();
  for (const [key, hub] of Object.entries(AHMEDABAD_HUBS)) {
    if (hub.keywords.some((kw) => kw && lower.includes(kw))) {
      return key;
    }
  }
  return null;
}

/**
 * Resolves a lat/lng + human-readable neighborhood label for a job posting.
 *
 * Resolution order:
 *  1. Company name matches our curated COMPANY_HUB_MAP.
 *  2. City / description text mentions a known hub by name.
 *  3. Deterministic scatter across the Ahmedabad bounding box.
 *
 * A small deterministic jitter is always applied so pins never stack exactly.
 */
export function resolveJobLocation(job) {
  const employer = normalizeCompanyName(job.employer_name || '');
  const cityText = `${job.job_city || ''} ${job.job_state || ''}`;
  const descText = job.job_description || '';
  const seedKey = job.job_id || `${job.employer_name}-${job.job_title}`;

  // 1. Curated company lookup
  let hubKey = COMPANY_HUB_MAP[employer];

  // 2. Text-based hub detection (city field first, then description)
  if (!hubKey) hubKey = findHubByText(cityText);
  if (!hubKey) hubKey = findHubByText(descText);

  if (hubKey) {
    const hub = AHMEDABAD_HUBS[hubKey];
    return {
      coords: jitterCoords(hub.coords, seedKey),
      neighborhood: hub.label,
      hubKey,
    };
  }

  // 3. Fallback: deterministic scatter, labeled generically.
  return {
    coords: scatterInBounds(seedKey),
    neighborhood: job.job_city && job.job_city.toLowerCase() !== 'ahmedabad' ? job.job_city : 'Ahmedabad',
    hubKey: null,
  };
}

export function hubList() {
  return Object.entries(AHMEDABAD_HUBS).map(([key, hub]) => ({ key, ...hub }));
}
