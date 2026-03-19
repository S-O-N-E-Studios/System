import { useMemo } from 'react';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

const DEFAULT_CENTER = { lat: -25.4753, lng: 30.9694 };
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%', minHeight: '224px' };

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
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
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
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const center = useMemo(() => {
    if (lat != null && lng != null) return { lat, lng };
    return DEFAULT_CENTER;
  }, [lat, lng]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    id: 'project-location-map',
  });

  const showMap = Boolean(apiKey) && isLoaded && !loadError;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-5">
      <h3 className="text-h3 mb-3">Location</h3>
      <div className="h-56 mb-3 overflow-hidden">
        {showMap ? (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={center}
            zoom={14}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
              styles: [
                {
                  featureType: 'water',
                  elementType: 'geometry.fill',
                  stylers: [{ color: '#97A8D7' }],
                },
                {
                  featureType: 'landscape',
                  elementType: 'geometry.fill',
                  stylers: [{ color: '#ECE4CE' }],
                },
              ],
            }}
          >
            {(lat != null && lng != null) && <Marker position={center} />}
          </GoogleMap>
        ) : (
          <MapPlaceholder
            address={address}
            gpsFormatted={gpsFormatted}
            hint={!apiKey ? 'Set VITE_GOOGLE_MAPS_API_KEY to show map' : undefined}
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
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {gpsFormatted}
            </p>
          )}
        </>
      )}
    </div>
  );
}
