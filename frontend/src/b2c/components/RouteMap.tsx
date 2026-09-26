import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

export interface RouteMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers?: {
    id: string;
    position: { lat: number; lng: number };
    label?: string;
  }[];
  routes?: {
    id: string;
    coordinates?: { lat: number; lng: number }[];
    encodedPolyline?: string;
    color?: string;
    weight?: number;
    isSelected?: boolean;
    travelMode?: string;
  }[];
  selectedSegmentId?: string;
}

const libraries: ('geometry' | 'places' | 'marker')[] = ['geometry', 'places', 'marker'];

export default function RouteMap({ center, zoom, markers, routes, selectedSegmentId }: RouteMapProps) {
  // Use VITE_GOOGLE_MAPS_API_KEY from env, fallback to empty string if not provided
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: libraries
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map || !window.google) return;
    
    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;
    
    if (markers) {
      markers.forEach(m => {
        if (m.position && m.position.lat && m.position.lng) {
          bounds.extend(m.position);
          hasPoints = true;
        }
      });
    }
    
    if (routes) {
      routes.forEach(route => {
        let path = route.coordinates;
        if (route.encodedPolyline) {
          path = window.google.maps.geometry.encoding.decodePath(route.encodedPolyline);
        }
        if (path) {
          path.forEach((p: any) => {
            // p might be LatLng object or LatLngLiteral. bounds.extend handles both.
            if (typeof p.lat === 'function') {
               bounds.extend(p);
               hasPoints = true;
            } else if (p.lat && p.lng) {
              bounds.extend(p);
              hasPoints = true;
            }
          });
        }
      });
    }
    
    if (hasPoints) {
      map.fitBounds(bounds);
      const listener = window.google.maps.event.addListener(map, "idle", () => {
         if (map.getZoom()! > 14) map.setZoom(14);
         window.google.maps.event.removeListener(listener);
      });
    }

    // Cleanup previous overlays
    markersRef.current.forEach(m => {
      if (m.map) m.map = null; // AdvancedMarkerElement map property
      if (m.setMap) m.setMap(null); // Fallback
    });
    markersRef.current = [];
    
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    // Draw markers using AdvancedMarkerElement
    if (markers && window.google.maps.marker) {
      markers.forEach(markerData => {
        const pinView = new window.google.maps.marker.PinElement({
          glyphText: markerData.label || '',
          background: '#2563EB',
          borderColor: '#ffffff',
          glyphColor: '#ffffff'
        });

        const newMarker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: markerData.position,
          content: pinView,
          title: markerData.label
        });
        markersRef.current.push(newMarker);
      });
    }

    // Draw polylines
    if (routes) {
      routes.forEach(route => {
        const isHighlighted = selectedSegmentId ? route.id === selectedSegmentId : route.isSelected;
        const strokeColor = isHighlighted ? (route.color || '#2563EB') : '#93C5FD';
        const strokeWeight = isHighlighted ? (route.weight || 6) : 4;
        const strokeOpacity = isHighlighted ? 1.0 : 0.6;
        
        let path = route.coordinates;
        if (route.encodedPolyline) {
          path = window.google.maps.geometry.encoding.decodePath(route.encodedPolyline);
        }

        const newPolyline = new window.google.maps.Polyline({
          path,
          strokeColor,
          strokeWeight,
          strokeOpacity,
          map
        });
        polylinesRef.current.push(newPolyline);
      });
    }

    return () => {
      markersRef.current.forEach(m => {
        if (m.map) m.map = null;
        if (m.setMap) m.setMap(null);
      });
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [map, markers, routes, selectedSegmentId]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-[#F1EDE9] flex flex-col items-center justify-center border border-[#D8C9BE] rounded-lg">
        <div className="w-8 h-8 border-4 border-[#D8C9BE] border-t-[#7C9278] rounded-full animate-spin mb-4" />
        <span className="text-sm font-medium text-[#A99587]">Loading Interactive Map...</span>
        {!apiKey && <span className="text-[10px] mt-2 text-orange-500">Google Maps API key is missing in .env</span>}
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-[#D8C9BE] shadow-sm">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={setMap}
        onUnmount={() => setMap(null)}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapId: 'DEMO_MAP_ID',
        }}
      />
    </div>
  );
}
