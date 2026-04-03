import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';

import { MapPin } from 'lucide-react';

import { useJsApiLoader, GoogleMap } from '@react-google-maps/api';

import type { FeatureCollection } from 'geojson';
import type { LeafletMouseEvent } from 'leaflet';
import { MapContainer, TileLayer, GeoJSON as LeafletGeoJSON, useMap } from 'react-leaflet';

import type { AtlasMapProvider, MapLatLng } from './AtlasMap';

const DEFAULT_CENTER: MapLatLng = { lat: -25.4753, lng: 30.9694 };

// Minimal placeholder GeoJSON so the component is functional
// until the backend/DevOps provides the official Province -> Department boundaries.
const DEFAULT_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { regionId: 'placeholder', status: 'active' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            // Intentional square placeholder shape.
            [29.85, -26.05],
            [31.15, -26.05],
            [31.15, -24.65],
            [29.85, -24.65],
            [29.85, -26.05],
          ],
        ],
      },
    },
  ],
};

function readCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

interface ProvinceGeoJsonMapProps {
  provider?: AtlasMapProvider;
  geoJson?: FeatureCollection;
  center?: MapLatLng;
  zoom?: number;
  height?: string;
  onRegionClick?: (regionId: string | null) => void;
}

export default function ProvinceGeoJsonMap({
  provider,
  geoJson = DEFAULT_GEOJSON,
  center = DEFAULT_CENTER,
  zoom = 7,
  height = '100%',
  onRegionClick,
}: ProvinceGeoJsonMapProps) {
  const leafletContainerRef = useRef<HTMLDivElement | null>(null);

  function LeafletInvalidateOnResize({
    containerRef,
  }: {
    containerRef: RefObject<HTMLDivElement | null>;
  }) {
    const map = useMap();

    useEffect(() => {
      map.invalidateSize?.();
    }, [map]);

    useEffect(() => {
      const el = containerRef.current;
      if (!el || typeof ResizeObserver === 'undefined') return;

      const ro = new ResizeObserver(() => map.invalidateSize?.());
      ro.observe(el);
      return () => ro.disconnect();
    }, [containerRef, map]);

    return null;
  }

  const resolvedProvider: AtlasMapProvider = useMemo(() => {
    if (provider) return provider;
    const envProvider = (import.meta.env.VITE_MAP_PROVIDER as AtlasMapProvider | undefined) ?? undefined;
    if (envProvider) return envProvider;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return apiKey ? 'google' : 'osm';
  }, [provider]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const shouldUseGoogle = resolvedProvider === 'google' && Boolean(apiKey);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    id: 'google-maps-script',
    libraries: ['maps'],
  });

  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') ?? 'dark' : 'dark'
  );
  const fillColor = readCssVar('--accent-periwinkle', 'transparent');
  const strokeColor = readCssVar('--accent-sand', 'transparent');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') ?? 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const commonStyle = useMemo(
    () => ({
      fillColor,
      fillOpacity: 0.24,
      strokeColor,
      strokeOpacity: 0.9,
      strokeWeight: 1.5,
    }),
    [fillColor, strokeColor]
  );

  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleDataClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  useEffect(() => {
    if (!shouldUseGoogle) return;
    if (!isLoaded || loadError) return;
    const map = googleMapRef.current;
    if (!map) return;

    map.data.forEach((f) => map.data.remove(f));
    map.data.addGeoJson(geoJson as object);

    map.data.setStyle(() => ({
      fillColor: commonStyle.fillColor,
      fillOpacity: commonStyle.fillOpacity,
      strokeColor: commonStyle.strokeColor,
      strokeOpacity: commonStyle.strokeOpacity,
      strokeWeight: commonStyle.strokeWeight,
    }));

    if (googleDataClickListenerRef.current) {
      googleDataClickListenerRef.current.remove();
    }

    googleDataClickListenerRef.current = map.data.addListener(
      'click',
      (e: google.maps.Data.MouseEvent) => {
        const props = e.feature?.getProperty('regionId');
        const regionId = typeof props === 'string' ? props : null;
        onRegionClick?.(regionId);
      }
    );

    return () => {
      if (googleDataClickListenerRef.current) {
        googleDataClickListenerRef.current.remove();
        googleDataClickListenerRef.current = null;
      }
    };
  }, [shouldUseGoogle, isLoaded, loadError, geoJson, commonStyle, onRegionClick]);

  // Leaflet sizing is handled by LeafletInvalidateOnResize to avoid react-leaflet typing edge cases.
  useEffect(() => {
    void shouldUseGoogle;
    void geoJson;
    void commonStyle;
    void center;
    void zoom;
  }, [shouldUseGoogle, geoJson, commonStyle, center, zoom]);

  if (shouldUseGoogle) {
    if (!isLoaded || loadError) {
      return (
        <div className="w-full h-full bg-[var(--bg-surface-alt)] border border-[var(--border-default)] flex items-center justify-center">
          <div className="text-center px-4">
            <MapPin className="h-10 w-10 text-[var(--accent-periwinkle)] mx-auto mb-2" />
            <p className="text-body text-[var(--text-muted)]">Google Maps unavailable. Using map placeholder.</p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ width: '100%', height }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height }}
          center={center}
          zoom={zoom}
          options={{ disableDefaultUI: true, zoomControl: true, clickableIcons: false }}
          onLoad={(map) => {
            googleMapRef.current = map;
          }}
        >
        </GoogleMap>
      </div>
    );
  }

  // OSM / Leaflet mode
  return (
    <div ref={leafletContainerRef} style={{ width: '100%', height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url={
            theme === 'light'
              ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          }
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <LeafletInvalidateOnResize containerRef={leafletContainerRef} />

        <LeafletGeoJSON
          data={geoJson}
          style={() => commonStyle}
          eventHandlers={{
            click: (e: LeafletMouseEvent) => {
              const layer = e.target as { feature?: { properties?: Record<string, unknown> } };
              const props = layer.feature?.properties;
              const regionId =
                props && typeof props.regionId === 'string' ? props.regionId : null;
              onRegionClick?.(regionId);
            },
          }}
        />
      </MapContainer>
    </div>
  );
}

