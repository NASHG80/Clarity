import React, { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

/* ─── Keys ─── */
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const PLACES_KEY = import.meta.env.VITE_GOOGLE_ROUTES_API_KEY as string;

/* ─── Types ─── */
interface Place {
  placeId: string;
  name: string;
  distance: string;
  duration: string;
  lat: number;
  lng: number;
  category: 'attraction' | 'airport' | 'bus_station';
}

interface Props {
  address?: string;
  city?: string;
}

/* ─── Load Google Maps JS (using the Routes key which has Maps JS API enabled) ─── */
let mapsPromise: Promise<void> | null = null;
function loadMapsScript(): Promise<void> {
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps) { resolve(); return; }
    const existing = document.querySelector('script[data-gmaps]');
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    const s = document.createElement('script');
    s.setAttribute('data-gmaps', '1');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${PLACES_KEY}&libraries=geometry&v=weekly`;
    s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { mapsPromise = null; reject(new Error('Maps failed')); };
    document.head.appendChild(s);
  });
  return mapsPromise;
}

/* ─── REST: Geocode an address → lat/lng (via backend proxy) ─── */
async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/proxy/geocode?address=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    if (data.status === 'OK' && data.results[0]) {
      const loc = data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch (e) { console.error('Geocode error', e); }
  return null;
}

/* ─── REST: Nearby Places via Places API (legacy, no billing wall) ─── */
async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  type: string,
  radius = 10000
): Promise<Array<{ place_id: string; name: string; geometry: { location: { lat: number; lng: number } } }>> {
  try {
    // We use a backend proxy to avoid CORS — fall back to direct if needed
    // Google Places Nearby Search (legacy v1) supports CORS from browser
    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=${radius}&type=${type}&key=${PLACES_KEY}`;

    // Fetch via a CORS proxy since Google Places doesn't support browser direct calls
    // Use our backend proxy endpoint
    const proxyUrl = `${import.meta.env.VITE_BACKEND_URL}/proxy/places?` +
      `lat=${lat}&lng=${lng}&radius=${radius}&type=${type}`;

    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`proxy ${res.status}`);
    const data = await res.json();
    return (data.results || []).slice(0, 10);
  } catch {
    return [];
  }
}

/* ─── REST: Distance Matrix via Routes API key ─── */
async function getDistances(
  originLat: number,
  originLng: number,
  destinations: Array<{ lat: number; lng: number }>,
  mode: 'walking' | 'driving'
): Promise<Array<{ distance: string; duration: string }>> {
  if (!destinations.length) return [];
  try {
    const destStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');
    const proxyUrl = `${import.meta.env.VITE_BACKEND_URL}/proxy/distancematrix?` +
      `origins=${originLat},${originLng}&destinations=${encodeURIComponent(destStr)}&mode=${mode}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('dist proxy failed');
    const data = await res.json();
    const elements = data.rows?.[0]?.elements || [];
    return elements.map((e: any) => ({
      distance: e.distance?.text || '',
      duration: e.duration?.text || '',
    }));
  } catch {
    return destinations.map(() => ({ distance: '', duration: '' }));
  }
}

/* ─── REST: Directions via Routes API key ─── */
async function getDirections(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: 'walking' | 'driving'
): Promise<any | null> {
  try {
    const proxyUrl = `${import.meta.env.VITE_BACKEND_URL}/proxy/directions?` +
      `origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=${mode}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('dir proxy failed');
    return await res.json();
  } catch { return null; }
}

/* ═══════════════════════════════════════════════════════════ */
/* Component                                                   */
/* ═══════════════════════════════════════════════════════════ */
export function LocationMapSection({ address, city }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const hotelMarkerRef = useRef<google.maps.Marker | null>(null);
  const hotelLatRef = useRef<number>(0);
  const hotelLngRef = useRef<number>(0);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const routeMarkersRef = useRef<google.maps.Marker[]>([]);
  const nearbyMarkersRef = useRef<google.maps.Marker[]>([]);

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [tab, setTab] = useState<'landmarks' | 'transport'>('landmarks');
  const [landmarks, setLandmarks] = useState<Place[]>([]);
  const [transport, setTransport] = useState<Place[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ dist: string; dur: string } | null>(null);
  const [nearbyHotels, setNearbyHotels] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [loadError, setLoadError] = useState('');

  const locationQuery = address || city || 'Mumbai, India';

  /* ── 1. Load Maps script ── */
  useEffect(() => {
    loadMapsScript()
      .then(() => setMapsLoaded(true))
      .catch(() => setLoadError('Google Maps failed to load'));
  }, []);

  /* ── 2. Geocode + init map + fetch places ── */
  useEffect(() => {
    if (!mapsLoaded || !mapDivRef.current) return;
    initEverything();
  }, [mapsLoaded]);

  const initEverything = async () => {
    setLoadingPlaces(true);
    setLoadError('');

    // Geocode
    let coord = await geocodeAddress(locationQuery);
    if (!coord) coord = { lat: 19.2183, lng: 72.9781 }; // Borivali fallback

    hotelLatRef.current = coord.lat;
    hotelLngRef.current = coord.lng;

    // Build map
    const map = new google.maps.Map(mapDivRef.current!, {
      center: coord,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
    });
    mapRef.current = map;

    // Hotel marker
    hotelMarkerRef.current = new google.maps.Marker({
      position: coord,
      map,
      title: 'This Hotel',
      zIndex: 999,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="28"><rect width="90" height="28" rx="4" fill="#1a73e8"/><text x="45" y="18" text-anchor="middle" fill="white" font-size="12" font-family="Arial" font-weight="bold">This Hotel</text></svg>`
        ),
        scaledSize: new google.maps.Size(90, 28),
        anchor: new google.maps.Point(45, 28),
      },
    });

    // Fetch all place types in parallel via backend proxy
    await Promise.all([
      fetchAndSetAttractions(coord.lat, coord.lng),
      fetchAndSetTransport(coord.lat, coord.lng),
    ]);

    setLoadingPlaces(false);
  };

  const fetchAndSetAttractions = async (lat: number, lng: number) => {
    const raw = await fetchNearbyPlaces(lat, lng, 'tourist_attraction', 8000);
    if (!raw.length) return;
    const places: Place[] = raw.map(r => ({
      placeId: r.place_id,
      name: r.name,
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      distance: '',
      duration: '',
      category: 'attraction',
    }));

    const dists = await getDistances(lat, lng, places.map(p => ({ lat: p.lat, lng: p.lng })), 'walking');
    setLandmarks(places.map((p, i) => ({ ...p, distance: dists[i]?.distance || '', duration: dists[i]?.duration || '' })));
  };

  const fetchAndSetTransport = async (lat: number, lng: number) => {
    const [airports, buses] = await Promise.all([
      fetchNearbyPlaces(lat, lng, 'airport', 50000),
      fetchNearbyPlaces(lat, lng, 'bus_station', 10000),
    ]);

    const airportPlaces: Place[] = airports.map(r => ({
      placeId: r.place_id, name: r.name,
      lat: r.geometry.location.lat, lng: r.geometry.location.lng,
      distance: '', duration: '', category: 'airport',
    }));
    const busPlaces: Place[] = buses.map(r => ({
      placeId: r.place_id, name: r.name,
      lat: r.geometry.location.lat, lng: r.geometry.location.lng,
      distance: '', duration: '', category: 'bus_station',
    }));

    const all = [...airportPlaces, ...busPlaces];
    const dists = await getDistances(lat, lng, all.map(p => ({ lat: p.lat, lng: p.lng })), 'driving');
    setTransport(all.map((p, i) => ({ ...p, distance: dists[i]?.distance || '', duration: dists[i]?.duration || '' })));
  };

  /* ── 3. Select a place → draw route ── */
  const handleSelect = async (place: Place, checked: boolean) => {
    // Clear previous route
    polylineRef.current?.setMap(null);
    routeMarkersRef.current.forEach(m => m.setMap(null));
    routeMarkersRef.current = [];

    if (!checked) {
      setSelectedId(null);
      setRouteInfo(null);
      return;
    }
    setSelectedId(place.placeId);

    // Always use driving — WALK data is sparse in India; backend also falls back to DRIVE
    const data = await getDirections(hotelLatRef.current, hotelLngRef.current, place.lat, place.lng, 'driving');

    if (!data?.routes?.[0]) {
      setRouteInfo({ dist: '–', dur: 'Route unavailable' });
      return;
    }
    const route = data.routes[0];
    const leg = route.legs[0];
    setRouteInfo({ dist: leg.distance?.text || '', dur: leg.duration?.text || '' });

    // Decode polyline and draw
    let path: google.maps.LatLng[] = [];
    const encoded = route.overview_polyline?.points;
    if (encoded && encoded.length > 0 && mapRef.current) {
      path = google.maps.geometry.encoding.decodePath(encoded);
      polylineRef.current = new google.maps.Polyline({
        path,
        map: mapRef.current,
        strokeColor: '#4285F4',
        strokeWeight: 6,
        strokeOpacity: 1.0,
        zIndex: 50,
      });

      // Fit bounds
      const bounds = new google.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      mapRef.current.fitBounds(bounds);
    }

    // Destination marker & floating route info
    if (mapRef.current) {
      const isAttr = place.category === 'attraction';
      
      // Destination marker with label
      const iconUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        isAttr 
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#f97316"/><path d="M15.5 9h-7A1.5 1.5 0 007 10.5v4A1.5 1.5 0 008.5 16h7a1.5 1.5 0 001.5-1.5v-4A1.5 1.5 0 0015.5 9z M12 14.5a2 2 0 110-4 2 2 0 010 4z" fill="white"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1a73e8"/><path d="M8 10v4h8v-4H8zm0-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4a2 2 0 012-2z" fill="white"/></svg>`
      );

      routeMarkersRef.current.push(
        new google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map: mapRef.current,
          title: place.name,
          label: { 
            text: place.name, 
            color: '#4B5563', 
            fontSize: '11px', 
            fontWeight: '700',
            className: 'bg-white/95 px-1.5 py-0.5 rounded shadow-sm border border-gray-200 mt-6'
          },
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(28, 28),
            anchor: new google.maps.Point(14, 14),
            labelOrigin: new google.maps.Point(14, 32)
          }
        })
      );

      // Midpoint Info Pill — "5 min / 1.5 km" style matching screenshot
      if (path.length > 0) {
        const midPoint = path[Math.floor(path.length / 2)];
        const dur = leg.duration?.text || '';
        const dist = leg.distance?.text || '';
        const infoText = dur && dist ? `${dur} / ${dist}` : dur || dist;
        
        const padding = 16;
        const charWidth = 7;
        const svgW = Math.max(infoText.length * charWidth + padding * 2, 80);
        const svgH = 28;
        
        routeMarkersRef.current.push(
          new google.maps.Marker({
            position: midPoint,
            map: mapRef.current,
            zIndex: 1000,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}">` +
                `<rect width="${svgW}" height="${svgH}" rx="5" fill="#1a1a2e" opacity="0.92"/>` +
                `<text x="${svgW/2}" y="${svgH/2 + 4.5}" text-anchor="middle" fill="white" font-size="12" font-family="-apple-system, Arial, sans-serif" font-weight="700" letter-spacing="0.2">${infoText}</text>` +
                `</svg>`
              ),
              scaledSize: new google.maps.Size(svgW, svgH),
              anchor: new google.maps.Point(svgW/2, svgH/2),
            }
          })
        );
      }
    }
  };

  /* ── 4. Nearby hotels toggle ── */
  const handleNearbyHotels = async (show: boolean) => {
    setNearbyHotels(show);
    nearbyMarkersRef.current.forEach(m => m.setMap(null));
    nearbyMarkersRef.current = [];
    if (!show || !mapRef.current) return;

    const raw = await fetchNearbyPlaces(hotelLatRef.current, hotelLngRef.current, 'lodging', 5000);
    nearbyMarkersRef.current = raw.map(r =>
      new google.maps.Marker({
        position: r.geometry.location,
        map: mapRef.current!,
        title: r.name,
        icon: { url: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png' },
      })
    );
  };

  /* ── Filter list ── */
  const rawList = tab === 'landmarks' ? landmarks : transport;
  const list = searchVal.trim()
    ? rawList.filter(p => p.name.toLowerCase().includes(searchVal.toLowerCase()))
    : rawList;
  const airports = list.filter(p => p.category === 'airport');
  const buses = list.filter(p => p.category === 'bus_station');
  const attractions = list.filter(p => p.category === 'attraction');

  /* ── Row ── */
  const Row = ({ place }: { place: Place }) => {
    const isSel = selectedId === place.placeId;
    // Show distance (km) as primary — matches screenshot style
    const display = place.distance || place.duration;
    return (
      <label className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${isSel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
        <input
          type="checkbox"
          checked={isSel}
          onChange={e => handleSelect(place, e.target.checked)}
          className="w-4 h-4 shrink-0 accent-[#1a73e8] rounded"
        />
        <span className={`flex-1 text-sm leading-tight ${isSel ? 'font-semibold text-[#1a73e8]' : 'font-medium text-[#26382D]'}`}>
          {place.name}
        </span>
        {display && <span className={`text-xs whitespace-nowrap shrink-0 font-medium ${isSel ? 'text-[#1a73e8]' : 'text-[#26382D]/60'}`}>{display}</span>}
        <span className="text-gray-300 shrink-0">›</span>
      </label>
    );
  };

  return (
    <div className="flex rounded-2xl overflow-hidden border border-[#D8C9BE] shadow-sm bg-white" style={{ height: 520 }}>
      {/* ── Left Panel ── */}
      <div className="flex flex-col border-r border-[#D8C9BE] bg-white shrink-0" style={{ width: 340 }}>
        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white focus-within:border-[#1a73e8] transition-colors">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              className="flex-1 text-sm text-[#26382D] outline-none placeholder:text-gray-400 bg-transparent"
              placeholder={`Search distance from any location in ${city || 'this area'}`}
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
            />
          </div>
        </div>
        {/* Route info banner — shown when a place is selected */}
        {routeInfo && (
          <div className="px-3 py-2 bg-[#1a73e8]/8 border-b border-[#1a73e8]/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#1a73e8] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#1a73e8]">Route to selected</p>
              <p className="text-sm font-semibold text-[#1C2B22]">{routeInfo.dur} &nbsp;·&nbsp; {routeInfo.dist}</p>
            </div>
            <button
              onClick={() => { handleSelect({ placeId: selectedId! } as any, false); }}
              className="text-[#1a73e8]/50 hover:text-[#1a73e8] text-lg font-bold shrink-0"
            >×</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 shrink-0">
          {(['landmarks', 'transport'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${tab === t ? 'border-[#1a73e8] text-[#1a73e8]' : 'border-transparent text-[#26382D]/60 hover:text-[#26382D]'}`}
            >
              {t === 'landmarks' ? 'Key Landmarks' : 'Transport'}
            </button>
          ))}
        </div>

        {/* List body */}
        <div className="flex-1 overflow-y-auto">
          {loadingPlaces && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-6 h-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Finding nearby places…</p>
            </div>
          )}
          {!loadingPlaces && loadError && (
            <div className="flex items-center justify-center py-10 px-4 text-center">
              <p className="text-sm text-red-500">{loadError}</p>
            </div>
          )}

          {!loadingPlaces && !loadError && tab === 'landmarks' && (
            <>
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Top Attractions</p>
              </div>
              {attractions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No attractions found nearby</p>
              ) : (
                attractions.map(p => <Row key={p.placeId} place={p} />)
              )}
            </>
          )}

          {!loadingPlaces && !loadError && tab === 'transport' && (
            <>
              {airports.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Airports</p>
                  </div>
                  {airports.map(p => <Row key={p.placeId} place={p} />)}
                </>
              )}
              {buses.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Bus Terminals</p>
                  </div>
                  {buses.map(p => <Row key={p.placeId} place={p} />)}
                </>
              )}
              {airports.length === 0 && buses.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No transport found nearby</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        <div ref={mapDivRef} className="w-full h-full" />

        {!mapsLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#E5DFD6]">
            <p className="text-[#26382D]/60 text-sm">Loading map…</p>
          </div>
        )}

        {/* Nearby Hotels */}
        <div className="absolute top-3 right-3 bg-white border border-gray-200 shadow-md rounded-md px-3 py-2 flex items-center gap-2 z-10">
          <input
            type="checkbox"
            id="nearby-hotels"
            checked={nearbyHotels}
            onChange={e => handleNearbyHotels(e.target.checked)}
            className="w-4 h-4 accent-[#1a73e8]"
          />
          <label htmlFor="nearby-hotels" className="text-xs font-medium text-[#26382D] cursor-pointer select-none">
            Nearby Hotels
          </label>
        </div>

        {/* Selected chip */}
        {selectedId && (
          <div className="absolute top-3 left-3 bg-blue-100 border border-[#1a73e8]/30 rounded-full px-3 py-1 flex items-center gap-1.5 z-10 shadow-sm max-w-[180px]">
            <span className="text-xs font-semibold text-[#1a73e8] truncate">
              {rawList.find(p => p.placeId === selectedId)?.name}
            </span>
            <button
              onClick={() => { handleSelect({ placeId: selectedId } as any, false); }}
              className="text-[#1a73e8] font-bold text-sm shrink-0 leading-none hover:text-blue-800"
            >×</button>
          </div>
        )}

      {/* Route info pill — styled like image 4 */}
      </div>
    </div>
  );
}
