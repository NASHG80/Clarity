import React, { useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../lib/api';

interface WeatherPoint {
  lat: number;
  lng: number;
  route_fraction: number;
  risk: string;
  impact_color: string;
  rain_mm: number;
  wind_kmh: number;
  current_weather: {
    temperature_c: number;
    rain_mm: number;
    label: string;
    emoji: string;
    wind_speed_kmh: number;
  };
  forecast_at_eta: {
    temperature_c: number;
    rain_mm: number;
    label: string;
    emoji: string;
    wind_speed_kmh: number;
    time: string;
  };
  eta_offset_minutes: number;
  time_penalty_fraction: number;
}

interface HourlyForecast {
  time: string;
  temperature_c: number;
  rain_mm: number;
  label: string;
  emoji: string;
  precipitation_probability: number;
}

interface WeatherImpact {
  delay_minutes: number;
  adjusted_duration_minutes: number;
  adjusted_cost_inr: number;
  adjusted_co2_kg: number;
  risk: string;
  overall_rain_mm: number;
  total_penalty_fraction: number;
  method: string;
}

interface SimulateResult {
  rainfall_mm_per_hour: number;
  risk: string;
  delay_minutes: number;
  adjusted_duration_minutes: number;
  adjusted_cost_inr: number;
  adjusted_co2_kg: number;
  method: string;
  alternative_route: {
    distance_km: number;
    duration_minutes: number;
    cost_inr: number;
    co2_kg: number;
    risk: string;
    extra_distance_km: number;
    extra_minutes: number;
  };
}

interface DigitalTwinPanelProps {
  /** The selected car journey option */
  carOption: any;
  onClose: () => void;
}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------
const riskBadge = (risk: string) => {
  if (risk === 'HIGH') return 'bg-red-100 text-red-700 border-red-200';
  if (risk === 'MEDIUM') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-green-100 text-green-700 border-green-200';
};

const riskDot = (risk: string) => {
  if (risk === 'HIGH') return '🔴';
  if (risk === 'MEDIUM') return '🟠';
  return '🟢';
};

const fmtTime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtHour = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return iso.slice(11, 16);
  }
};

// -------------------------------------------------------------------------
// Main component
// -------------------------------------------------------------------------
export default function DigitalTwinPanel({ carOption, onClose }: DigitalTwinPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live data from /api/weather/journey-impact
  const [weatherData, setWeatherData] = useState<{
    origin: { current: any; hourly: HourlyForecast[] };
    destination: { current: any; hourly: HourlyForecast[] };
    route_points: WeatherPoint[];
    impact: WeatherImpact;
    base: { duration_minutes: number; distance_km: number; cost_inr: number; co2_kg: number };
  } | null>(null);

  // What-if simulation
  const [simRain, setSimRain] = useState(5);
  const [simWind, setSimWind] = useState(20);
  const [simDuration, setSimDuration] = useState(2);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<SimulateResult | null>(null);

  // -----------------------------------------------------------------------
  // Extract coords from car segment
  // -----------------------------------------------------------------------
  const seg = carOption?.segments?.[0];
  const originLat = seg?.origin?.lat;
  const originLng = seg?.origin?.lng;
  const destLat = seg?.destination?.lat;
  const destLng = seg?.destination?.lng;
  const polyline = seg?.geometry || '';
  const baseDuration = carOption?.duration_minutes || 0;
  const baseDistance = seg?.distance_km || 0;
  const baseCost = carOption?.cost_inr || 0;
  const baseCo2 = carOption?.emissions?.co2e_kg || (baseDistance * 0.12);

  // -----------------------------------------------------------------------
  // Fetch live weather impact
  // -----------------------------------------------------------------------
  const fetchImpact = useCallback(async () => {
    if (!originLat || !originLng || !destLat || !destLng) {
      setError('Route coordinates not available — please select a car journey first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/weather/journey-impact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_lat: originLat,
          origin_lng: originLng,
          dest_lat: destLat,
          dest_lng: destLng,
          encoded_polyline: polyline,
          base_duration_minutes: baseDuration,
          base_distance_km: baseDistance,
          base_cost_inr: baseCost,
          base_co2_kg: baseCo2,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWeatherData(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  }, [originLat, originLng, destLat, destLng, polyline, baseDuration, baseDistance, baseCost, baseCo2]);

  // -----------------------------------------------------------------------
  // Run what-if simulation
  // -----------------------------------------------------------------------
  const runSimulation = useCallback(async () => {
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/weather/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_duration_minutes: baseDuration,
          base_distance_km: baseDistance,
          base_cost_inr: baseCost,
          base_co2_kg: baseCo2,
          rainfall_mm_per_hour: simRain,
          wind_kmh: simWind,
          storm_duration_hours: simDuration,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSimResult(data);
    } catch (e: any) {
      setError(e.message || 'Simulation failed.');
    } finally {
      setSimLoading(false);
    }
  }, [baseDuration, baseDistance, baseCost, baseCo2, simRain, simWind, simDuration]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md h-full bg-[#F8F6F3] border-l border-[#D8C9BE] shadow-2xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#26382D] to-[#1a261f] text-white px-5 py-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">🌐</span>
              <h2 className="font-bold text-base tracking-wide">Weather Digital Twin</h2>
            </div>
            <p className="text-xs text-green-300/80">
              {seg?.origin?.name?.split(',')[0]} → {seg?.destination?.name?.split(',')[0]}
            </p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl leading-none mt-0.5">✕</button>
        </div>

        <div className="flex-1 p-4 space-y-4">

          {/* ---- Check Weather Button ---- */}
          {!weatherData && !loading && (
            <div className="bg-white border border-[#D8C9BE] rounded-2xl p-5 text-center">
              <div className="text-4xl mb-3">☁️</div>
              <h3 className="font-bold text-[#26382D] mb-1">Check Live Weather Impact</h3>
              <p className="text-sm text-[#7C9278] mb-4">
                Fetches real-time weather from Open-Meteo for your origin, destination, and intermediate route points.
              </p>
              <button
                onClick={fetchImpact}
                className="w-full bg-[#26382D] text-white py-3 rounded-xl font-semibold hover:bg-[#1a261f] transition-colors"
              >
                ☁ Analyse Weather Impact
              </button>
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
          )}

          {/* ---- Loading ---- */}
          {loading && (
            <div className="bg-white border border-[#D8C9BE] rounded-2xl p-8 text-center">
              <div className="w-10 h-10 border-4 border-[#D8C9BE] border-t-[#7C9278] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#7C9278]">Fetching live weather from Open-Meteo…</p>
            </div>
          )}

          {/* ---- Weather Data ---- */}
          {weatherData && (
            <>
              {/* Digital Twin Impact Summary */}
              <div className="bg-gradient-to-br from-[#26382D] to-[#1a4030] text-white rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span>🌐</span>
                  <span className="font-bold text-sm tracking-wider uppercase">Digital Twin — Journey State</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="text-xs text-green-200 mb-1">Base ETA</div>
                    <div className="text-xl font-bold">{fmtTime(weatherData.base.duration_minutes)}</div>
                  </div>
                  <div className={`rounded-xl p-3 ${weatherData.impact.delay_minutes > 0 ? 'bg-amber-500/20' : 'bg-white/10'}`}>
                    <div className="text-xs text-green-200 mb-1">Weather Delay</div>
                    <div className="text-xl font-bold">
                      {weatherData.impact.delay_minutes > 0 ? `+${weatherData.impact.delay_minutes} min` : 'None'}
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="text-xs text-green-200 mb-1">Expected ETA</div>
                    <div className="text-xl font-bold">{fmtTime(weatherData.impact.adjusted_duration_minutes)}</div>
                  </div>
                  <div className={`rounded-xl p-3 ${
                    weatherData.impact.risk === 'HIGH' ? 'bg-red-500/25' :
                    weatherData.impact.risk === 'MEDIUM' ? 'bg-amber-500/25' : 'bg-green-500/20'
                  }`}>
                    <div className="text-xs text-green-200 mb-1">Disruption Risk</div>
                    <div className="text-lg font-bold">{riskDot(weatherData.impact.risk)} {weatherData.impact.risk}</div>
                  </div>
                </div>
                <div className="text-[10px] text-green-300/60 text-center">{weatherData.impact.method}</div>
              </div>

              {/* Route segment weather colours */}
              {weatherData.route_points.length > 0 && (
                <div className="bg-white border border-[#D8C9BE] rounded-2xl p-4">
                  <h4 className="font-bold text-[#26382D] text-sm mb-3 flex items-center gap-2">
                    <span>🗺️</span> Route Weather Conditions
                  </h4>
                  <div className="space-y-2">
                    {weatherData.route_points.map((pt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-white shadow"
                          style={{ backgroundColor: pt.impact_color }}
                        />
                        <div className="flex-1 text-sm text-[#26382D]">
                          {i === 0 ? seg?.origin?.name?.split(',')[0] :
                           i === weatherData.route_points.length - 1 ? seg?.destination?.name?.split(',')[0] :
                           `Segment ${i}`}
                        </div>
                        <div className="text-sm">
                          {pt.current_weather.emoji}
                          <span className="text-xs text-[#7C9278] ml-1">{pt.current_weather.label}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskBadge(pt.risk)}`}>
                          {pt.risk}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-3 text-xs text-[#7C9278]">
                    <span>🟢 Low</span>
                    <span>🟠 Medium</span>
                    <span>🔴 High impact</span>
                  </div>
                </div>
              )}

              {/* Origin + Destination weather */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: seg?.origin?.name?.split(',')[0] || 'Origin', data: weatherData.origin },
                  { label: seg?.destination?.name?.split(',')[0] || 'Destination', data: weatherData.destination },
                ].map(({ label, data }, idx) => (
                  <div key={idx} className="bg-white border border-[#D8C9BE] rounded-2xl p-4">
                    <div className="text-xs font-bold text-[#7C9278] uppercase mb-2 truncate">{label}</div>
                    <div className="text-3xl mb-1">{data.current.emoji}</div>
                    <div className="font-bold text-[#26382D]">{data.current.temperature_c?.toFixed(0)}°C</div>
                    <div className="text-xs text-[#7C9278]">{data.current.label}</div>
                    {data.current.rain_mm > 0 && (
                      <div className="text-xs text-blue-600 mt-1">💧 {data.current.rain_mm} mm</div>
                    )}
                    <div className="text-xs text-[#A99587] mt-1">💨 {data.current.wind_speed_kmh?.toFixed(0)} km/h</div>
                  </div>
                ))}
              </div>

              {/* Hourly forecast — origin */}
              <div className="bg-white border border-[#D8C9BE] rounded-2xl p-4">
                <h4 className="font-bold text-[#26382D] text-sm mb-3">⏱ Next 6 Hours — {seg?.origin?.name?.split(',')[0]}</h4>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {weatherData.origin.hourly.slice(0, 6).map((h, i) => (
                    <div key={i} className="flex-shrink-0 text-center bg-[#F8F6F3] rounded-xl px-3 py-2 min-w-[64px]">
                      <div className="text-[10px] text-[#7C9278] mb-1">{fmtHour(h.time)}</div>
                      <div className="text-lg">{h.emoji}</div>
                      <div className="text-xs font-semibold text-[#26382D]">{h.temperature_c?.toFixed(0)}°</div>
                      {h.precipitation_probability != null && (
                        <div className="text-[9px] text-blue-500">{h.precipitation_probability}%</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ======================================================
              WHAT-IF SIMULATION
          ====================================================== */}
          <div className="bg-white border border-[#D8C9BE] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🧪</span>
              <div>
                <h4 className="font-bold text-[#26382D] text-sm">What-If Simulation</h4>
                <p className="text-[10px] text-[#7C9278]">Adjust conditions to see how weather changes your journey</p>
              </div>
            </div>

            {/* Rain slider */}
            <div className="mb-4">
              <label className="flex justify-between text-xs font-semibold text-[#7C9278] uppercase mb-2">
                <span>🌧 Rainfall Intensity</span>
                <span className="text-[#26382D] font-bold">{simRain} mm/h</span>
              </label>
              <input
                type="range" min={0} max={60} step={1} value={simRain}
                onChange={e => setSimRain(Number(e.target.value))}
                className="w-full accent-[#26382D]"
              />
              <div className="flex justify-between text-[9px] text-[#A99587] mt-1">
                <span>0 — Clear</span><span>10 — Light</span><span>30 — Heavy</span><span>60 — Storm</span>
              </div>
            </div>

            {/* Wind slider */}
            <div className="mb-4">
              <label className="flex justify-between text-xs font-semibold text-[#7C9278] uppercase mb-2">
                <span>💨 Wind Speed</span>
                <span className="text-[#26382D] font-bold">{simWind} km/h</span>
              </label>
              <input
                type="range" min={0} max={100} step={5} value={simWind}
                onChange={e => setSimWind(Number(e.target.value))}
                className="w-full accent-[#26382D]"
              />
            </div>

            {/* Duration slider */}
            <div className="mb-4">
              <label className="flex justify-between text-xs font-semibold text-[#7C9278] uppercase mb-2">
                <span>⏳ Storm Duration</span>
                <span className="text-[#26382D] font-bold">{simDuration}h</span>
              </label>
              <input
                type="range" min={0} max={8} step={0.5} value={simDuration}
                onChange={e => setSimDuration(Number(e.target.value))}
                className="w-full accent-[#26382D]"
              />
            </div>

            <button
              onClick={runSimulation}
              disabled={simLoading}
              className="w-full bg-gradient-to-r from-[#26382D] to-[#3A5043] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {simLoading ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Running…</>
              ) : (
                <>🧪 Run Simulation</>
              )}
            </button>
          </div>

          {/* Simulation Result */}
          {simResult && (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2 px-1">
                <div className="flex-1 h-px bg-[#D8C9BE]" />
                <span className="text-xs font-bold text-[#7C9278] uppercase tracking-wider">Simulation Result</span>
                <div className="flex-1 h-px bg-[#D8C9BE]" />
              </div>

              {/* Base vs Simulated */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F8F6F3] border border-[#D8C9BE] rounded-2xl p-4">
                  <div className="text-xs font-bold text-[#7C9278] uppercase mb-2">Base Route</div>
                  <div className="font-bold text-[#26382D] text-lg">{fmtTime(baseDuration)}</div>
                  <div className="text-xs text-[#7C9278]">₹{baseCost?.toFixed(0)}</div>
                  <div className="text-xs text-[#7C9278]">{baseCo2?.toFixed(1)} kg CO₂</div>
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-green-100 text-green-700 border-green-200">LOW risk</span>
                </div>
                <div className={`border rounded-2xl p-4 ${
                  simResult.risk === 'HIGH' ? 'bg-red-50 border-red-200' :
                  simResult.risk === 'MEDIUM' ? 'bg-amber-50 border-amber-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="text-xs font-bold text-[#7C9278] uppercase mb-2">Simulated</div>
                  <div className="font-bold text-[#26382D] text-lg">{fmtTime(simResult.adjusted_duration_minutes)}</div>
                  <div className="text-xs text-[#7C9278]">₹{simResult.adjusted_cost_inr?.toFixed(0)}</div>
                  <div className="text-xs text-[#7C9278]">{simResult.adjusted_co2_kg?.toFixed(1)} kg CO₂</div>
                  <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskBadge(simResult.risk)}`}>
                    {simResult.risk} risk
                  </span>
                </div>
              </div>

              {/* Delay highlight */}
              {simResult.delay_minutes > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <div className="font-bold text-amber-800">+{simResult.delay_minutes} min weather delay</div>
                    <div className="text-xs text-amber-700">at {simResult.rainfall_mm_per_hour} mm/h rainfall</div>
                  </div>
                </div>
              )}

              {/* Alternative route */}
              {simResult.alternative_route && (
                <div className="bg-white border border-[#D8C9BE] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span>🔀</span>
                    <h4 className="font-bold text-[#26382D] text-sm">Alternative Route</h4>
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskBadge(simResult.alternative_route.risk)}`}>
                      {simResult.alternative_route.risk} risk
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                    <div>
                      <div className="text-[10px] text-[#7C9278] uppercase">Duration</div>
                      <div className="font-bold text-[#26382D]">{fmtTime(simResult.alternative_route.duration_minutes)}</div>
                      <div className="text-[10px] text-amber-600">+{simResult.alternative_route.extra_minutes}m</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#7C9278] uppercase">Cost</div>
                      <div className="font-bold text-[#26382D]">₹{simResult.alternative_route.cost_inr?.toFixed(0)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#7C9278] uppercase">CO₂</div>
                      <div className="font-bold text-[#26382D]">{simResult.alternative_route.co2_kg?.toFixed(1)} kg</div>
                      <div className="text-[10px] text-amber-600">+{simResult.alternative_route.extra_distance_km} km</div>
                    </div>
                  </div>
                  <div className="bg-[#EAF0EB] border border-[#C5D9CB] rounded-xl p-3 text-xs text-[#1F4029]">
                    <strong>Twin Recommendation:</strong> At {simResult.rainfall_mm_per_hour} mm/h, the alternative route adds{' '}
                    +{simResult.alternative_route.extra_minutes} min and +{simResult.alternative_route.extra_distance_km} km
                    but reduces weather risk from <strong>{simResult.risk}</strong> to{' '}
                    <strong>{simResult.alternative_route.risk}</strong>.
                  </div>
                </div>
              )}

              {/* Method disclaimer */}
              <div className="text-center text-[10px] text-[#A99587] px-2">
                {simResult.method}
              </div>
            </div>
          )}

          {/* Re-check button */}
          {weatherData && (
            <button
              onClick={() => { setWeatherData(null); setSimResult(null); }}
              className="w-full border border-[#D8C9BE] text-[#7C9278] py-2.5 rounded-xl text-sm hover:bg-[#F8F6F3] transition-colors"
            >
              ↺ Refresh Weather Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
