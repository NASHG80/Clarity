import React from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

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

export default function RouteMap({ center, zoom, markers, routes, selectedSegmentId }: RouteMapProps) {
  // Use VITE_GOOGLE_MAPS_API_KEY from env, fallback to empty string if not provided
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: ['geometry', 'places']
  });

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
        options={{
          disableDefaultUI: false,
          zoomControl: true,
        }}
      >
        {markers?.map(marker => (
          <Marker 
            key={marker.id} 
            position={marker.position} 
            label={marker.label} 
          />
        ))}
        {routes?.map(route => {
          const isHighlighted = selectedSegmentId ? route.id === selectedSegmentId : route.isSelected;
          const strokeColor = isHighlighted ? (route.color || '#26382D') : '#A9B8A3';
          const strokeWeight = isHighlighted ? (route.weight || 6) : 3;
          const strokeOpacity = isHighlighted ? 1.0 : 0.6;
          
          let path = route.coordinates;
          if (route.encodedPolyline && window.google) {
            path = window.google.maps.geometry.encoding.decodePath(route.encodedPolyline);
          }
          
          return (
            <Polyline
              key={route.id}
              path={path}
              options={{
                strokeColor,
                strokeWeight,
                strokeOpacity,
              }}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
}
