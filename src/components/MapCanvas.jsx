import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { ExternalLink, MapPin } from 'lucide-react';
import { AHMEDABAD_CENTER, hubList } from '../utils/geoMapper';
import { timeAgo } from '../utils/time';

// Consistent color per hub so the map legend and pins always agree.
const HUB_COLORS = {
  SG_HIGHWAY: '#22d3ee',
  SBR: '#a78bfa',
  PRAHLAD_NAGAR: '#34d399',
  VASTRAPUR: '#fbbf24',
  NAVRANGPURA: '#f472b6',
  GIFT_CITY: '#60a5fa',
};
const DEFAULT_PIN_COLOR = '#94a3b8';

function initialsFor(name = '?') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function createPinIcon(job, isSelected) {
  const color = HUB_COLORS[job.hubKey] || DEFAULT_PIN_COLOR;
  return L.divIcon({
    className: '',
    html: `<div class="asr-pin${isSelected ? ' is-selected' : ''}" style="background:${color}"><span>${initialsFor(
      job.employer_name
    )}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 30],
    popupAnchor: [0, -30],
  });
}

function clusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 30 ? 42 : 50;
  return L.divIcon({
    html: `<div class="marker-cluster-custom" style="width:${size}px;height:${size}px">${count}</div>`,
    className: '',
    iconSize: [size, size],
  });
}

/** Smoothly pans/zooms to a job's pin whenever it becomes the selected job. */
function FlyToSelected({ job }) {
  const map = useMap();
  useEffect(() => {
    if (job) {
      map.flyTo(job.coords, Math.max(map.getZoom(), 14), { duration: 0.9 });
    }
  }, [job, map]);
  return null;
}

function PopupContent({ job, siblings, onApply, onSelectJob }) {
  const others = siblings.filter((s) => s.job_id !== job.job_id);
  return (
    <div className="w-56 text-slate-100">
      <div className="flex items-center gap-2">
        {job.employer_logo ? (
          <img src={job.employer_logo} alt="" className="h-7 w-7 rounded bg-white object-contain p-0.5" />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded bg-radar-accent/20 text-[10px] font-bold">
            {initialsFor(job.employer_name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{job.employer_name}</p>
          <p className="flex items-center gap-1 text-[10px] text-radar-muted">
            <MapPin size={9} /> {job.neighborhood}
          </p>
        </div>
      </div>

      <div className="mt-2 border-t border-white/10 pt-2">
        <p className="text-xs font-medium text-slate-200">{job.job_title}</p>
        <p className="text-[10px] text-radar-muted">{timeAgo(job.job_posted_at_datetime_utc)}</p>
      </div>

      {others.length > 0 && (
        <p className="mt-1.5 text-[10px] text-radar-accent2">+{others.length} more opening{others.length > 1 ? 's' : ''} at this company</p>
      )}

      <div className="mt-2.5 flex gap-1.5">
        <button
          type="button"
          onClick={() => onSelectJob(job)}
          className="flex-1 rounded-md border border-white/15 bg-white/5 py-1.5 text-[11px] font-medium hover:bg-white/10"
        >
          Highlight
        </button>
        <button
          type="button"
          onClick={() => onApply(job)}
          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-gradient-to-r from-radar-accent to-radar-accent2 py-1.5 text-[11px] font-semibold text-radar-bg"
        >
          Apply <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
}

function MapLegend() {
  const hubs = hubList();
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] hidden max-w-[220px] rounded-xl border border-radar-border bg-radar-panel/90 p-3 backdrop-blur sm:block">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-radar-muted">Tech Hubs</p>
      <ul className="space-y-1">
        {hubs.map((hub) => (
          <li key={hub.key} className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <span className="h-2 w-2 rounded-full" style={{ background: HUB_COLORS[hub.key] }} />
            {hub.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="h-2 w-2 rounded-full" style={{ background: DEFAULT_PIN_COLOR }} />
          Other areas
        </li>
      </ul>
    </div>
  );
}

export default function MapCanvas({ jobs, selectedJobId, onSelectJob, onApply }) {
  const selectedJob = jobs.find((j) => j.job_id === selectedJobId) || null;

  const jobsByEmployer = useMemo(() => {
    const map = {};
    jobs.forEach((job) => {
      map[job.employer_name] = map[job.employer_name] || [];
      map[job.employer_name].push(job);
    });
    return map;
  }, [jobs]);

  return (
    <div className="relative h-full w-full">
      <MapContainer center={AHMEDABAD_CENTER} zoom={12} scrollWheelZoom className="h-full w-full">
        {/* Standard OpenStreetMap tiles — free, unauthenticated, no API key.
            Dark look is faked with a CSS filter on .leaflet-tile-pane
            (see index.css) instead of relying on a keyed dark tile provider. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToSelected job={selectedJob} />

        <MarkerClusterGroup chunkedLoading maxClusterRadius={45} iconCreateFunction={clusterIcon}>
          {jobs.map((job) => (
            <Marker
              key={job.job_id}
              position={job.coords}
              icon={createPinIcon(job, job.job_id === selectedJobId)}
              eventHandlers={{ click: () => onSelectJob(job) }}
            >
              <Popup>
                <PopupContent
                  job={job}
                  siblings={jobsByEmployer[job.employer_name] || [job]}
                  onApply={onApply}
                  onSelectJob={onSelectJob}
                />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <MapLegend />
    </div>
  );
}
