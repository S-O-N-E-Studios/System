import { MapPin } from 'lucide-react';
import AtlasMap from './AtlasMap';

const DEFAULT_CENTER = { lat: -25.4753, lng: 30.9694 };

interface ProjectLocationMapProps {
  address?: string;
  lat?: number;
  lng?: number;
  gpsFormatted?: string;
}

function MapPlaceholder({
  address,
  gpsFormatted,
  hint,
}: {
  address?: string;
  gpsFormatted?: string;
  hint?: string;
}) {
  return (
    <div className="w-full h-full bg-[var(--bg-surface-alt)] border border-dashed border-[var(--border-default)] flex items-center justify-center">
      <div className="text-center px-4">
        <MapPin className="h-10 w-10 text-[var(--accent-periwinkle)] mx-auto mb-2" />
        <p className="text-body text-[var(--text-primary)]">
          {address || 'R573, Mbombela, Mpumalanga'}
        </p>
        {gpsFormatted && (
          <p
            className="text-[0.7rem] text-[var(--text-muted)] mt-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {gpsFormatted}
          </p>
        )}
        {hint && (
          <p className="text-[0.65rem] text-[var(--text-muted)] mt-2">{hint}</p>
        )}
      </div>
    </div>
  );
}

export default function ProjectLocationMap({
  address,
  lat,
  lng,
  gpsFormatted,
}: ProjectLocationMapProps) {
  const center = lat != null && lng != null ? { lat, lng } : DEFAULT_CENTER;
  const showMap = lat != null && lng != null;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-5">
      <h3 className="text-h3 mb-3">Location</h3>
      <div className="h-56 mb-3 overflow-hidden">
        {showMap ? (
          <AtlasMap
            markers={[
              { id: 'project-location', lat, lng, label: address ?? gpsFormatted ?? 'Project' },
            ]}
            center={center}
            zoom={14}
            height="224px"
          />
        ) : (
          <MapPlaceholder
            address={address}
            gpsFormatted={gpsFormatted}
            hint={'Set GPS coordinates to show an interactive map'}
          />
        )}
      </div>
      {showMap && (
        <>
          {address && (
            <p className="text-body text-[var(--text-primary)] mb-1">{address}</p>
          )}
          {gpsFormatted && (
            <p
              className="text-[0.7rem] text-[var(--text-muted)]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {gpsFormatted}
            </p>
          )}
        </>
      )}
    </div>
  );
}
