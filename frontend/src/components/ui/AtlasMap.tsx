import { useEffect, useMemo, useState } from 'react';
import { useJsApiLoader, GoogleMap, Marker as GoogleMarker } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

// Leaflet provider
import { MapContainer, TileLayer, Marker as LeafletMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

/** Lat/lng shape used by Google Maps and Leaflet in this component. */
export type MapLatLng = { lat: number; lng: number };

export type AtlasMapProvider = 'google' | 'osm';

export type AtlasMapMarkerStatus = 'active' | 'review' | 'planning' | 'complete' | string;

export interface AtlasMapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  status?: AtlasMapMarkerStatus;
}

interface AtlasMapProps {
  markers: AtlasMapMarker[];
  center?: MapLatLng;
  zoom?: number;
  height?: string;
  provider?: AtlasMapProvider; // defaults from env
  onMarkerClick?: (marker: AtlasMapMarker) => void;
}

function LeafletViewSync({ center, zoom }: { center: MapLatLng; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);

  return null;
}

function readCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function getStatusColorToken(status: AtlasMapMarkerStatus | undefined): string {
  // Tokens are platform-locked; use semantic status colours.
  switch (status) {
    case 'active':
      return '--status-success';
    case 'review':
      return '--status-warning';
    case 'complete':
      return '--status-done';
    case 'planning':
      return '--status-planning';
    default:
      return '--accent-periwinkle';
  }
}

function createGoogleMarkerIcon(colorHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
  <path d="M17 33s13-10.2 13-19.3C30 6.9 24.5 2 17 2S4 6.9 4 13.7C4 22.8 17 33 17 33Z" fill="${colorHex}" stroke="white" stroke-width="1.5" />
  <circle cx="17" cy="14" r="6" fill="rgba(255,255,255,0.35)" />
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createLeafletMarkerIcon(colorHex: string): L.DivIcon {
  const html = `<div style="
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: ${colorHex};
    border: 2px solid rgba(255,255,255,0.9);
    box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    display:flex;
    align-items:center;
    justify-content:center;
  ">
    <div style="width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.9);"></div>
  </div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
}

export default function AtlasMap({
  markers,
  center,
  zoom = 14,
  height = '280px',
  provider,
  onMarkerClick,
}: AtlasMapProps) {
  const resolvedProvider: AtlasMapProvider = useMemo(() => {
    const envProvider = (import.meta.env.VITE_MAP_PROVIDER as AtlasMapProvider | undefined) ?? undefined;
    if (provider) return provider;
    if (envProvider) return envProvider;

    // Default: prefer google only if key exists.
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return apiKey ? 'google' : 'osm';
  }, [provider]);

  const [themeVersion, setThemeVersion] = useState(() => {
    if (typeof document === 'undefined') return 0;
    return document.documentElement.getAttribute('data-theme') ?? 'dark';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setThemeVersion(document.documentElement.getAttribute('data-theme') ?? 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const computedCenter = useMemo(() => {
    if (center) return center;
    if (markers.length === 0) return { lat: -25.4753, lng: 30.9694 };
    return { lat: markers[0].lat, lng: markers[0].lng };
  }, [center, markers]);

  // Google settings
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    id: 'google-maps-script',
    libraries: ['maps'],
  });

  const showGoogle = resolvedProvider === 'google' && Boolean(apiKey) && isLoaded && !loadError;

  const googleStyles = useMemo(() => {
    // Convert Atlas token colours to actual hex strings.
    const water = readCssVar('--accent-periwinkle', 'transparent');
    const land = readCssVar('--bg-primary', 'transparent');

    return [
      {
        featureType: 'water',
        elementType: 'geometry.fill',
        stylers: [{ color: water }],
      },
      {
        featureType: 'landscape',
        elementType: 'geometry.fill',
        stylers: [{ color: land }],
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeVersion]);

  // Marker icons
  const markerIcons = useMemo(() => {
    void themeVersion; // Recompute when theme changes so CSS token reads stay in sync.
    // Precompute icons per status to avoid recreating for each marker.
    const colorsByStatus = new Map<string, string>();
    const iconByStatus = new Map<string, string | L.DivIcon>();

    for (const m of markers) {
      const token = getStatusColorToken(m.status);
      if (!colorsByStatus.has(token)) colorsByStatus.set(token, readCssVar(token, 'transparent'));
    }

    for (const token of colorsByStatus.keys()) {
      const colorHex = colorsByStatus.get(token)!;
      if (resolvedProvider === 'google') {
        iconByStatus.set(token, createGoogleMarkerIcon(colorHex));
      } else {
        iconByStatus.set(token, createLeafletMarkerIcon(colorHex));
      }
    }

    return iconByStatus;
  }, [markers, resolvedProvider, themeVersion]);

  if (resolvedProvider === 'google') {
    if (!showGoogle) {
      return (
        <div className="w-full h-full bg-[var(--bg-surface-alt)] border border-[var(--border-default)] flex items-center justify-center">
          <div className="text-center px-4">
            <MapPin className="h-10 w-10 text-[var(--accent-periwinkle)] mx-auto mb-2" />
            <p className="text-body text-[var(--text-primary)]">
              Google Maps unavailable. Switch to OpenStreetMap provider for development.
            </p>
          </div>
        </div>
      );
    }

    const mapContainerStyle = { width: '100%', height };
    const options = {
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: googleStyles,
    };

    return (
      <div style={{ width: '100%', height }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={computedCenter}
          zoom={zoom}
          options={options}
        >
          {markers.map((m) => {
            const token = getStatusColorToken(m.status);
            const icon = markerIcons.get(token) as string | undefined;
            return (
              <GoogleMarker
                key={m.id}
                position={{ lat: m.lat, lng: m.lng }}
                icon={icon}
                title={m.label}
                onClick={() => onMarkerClick?.(m)}
              />
            );
          })}
        </GoogleMap>
      </div>
    );
  }

  // OSM / Leaflet
  const containerStyle = { width: '100%', height };
  const isDark = themeVersion === 'dark';
  const lightTileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return (
    <div style={containerStyle}>
      <MapContainer
        center={computedCenter}
        zoom={zoom}
        style={containerStyle}
        scrollWheelZoom={false}
      >
        <LeafletViewSync center={computedCenter} zoom={zoom} />
        <TileLayer
          url={isDark ? darkTileUrl : lightTileUrl}
          attribution={
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' +
            ' &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
        />

        {markers.map((m) => {
          const token = getStatusColorToken(m.status);
          const icon = markerIcons.get(token) as L.DivIcon | undefined;
          return (
            <LeafletMarker
              key={m.id}
              position={{ lat: m.lat, lng: m.lng }}
              icon={icon}
              eventHandlers={{ click: () => onMarkerClick?.(m) }}
            >
              {m.label && <Tooltip direction="top" offset={[0, -10]}>{m.label}</Tooltip>}
            </LeafletMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

