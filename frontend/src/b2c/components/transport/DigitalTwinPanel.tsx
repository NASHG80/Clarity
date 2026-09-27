import React, { useState, useEffect, useCallback } from 'react';
import { CloudRain, Wind, Thermometer, ChevronRight, Loader, AlertTriangle, Info } from 'lucide-react';
import { API_BASE_URL } from '../../../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CurrentWeather {
  temperature_c: number;
  rain_mm: number;
  precipitation_mm: number;
  weather_code: number;
  label: string;
  emoji: string;
  wind_speed_kmh: number;
}

interface HourlySlot {
  time: string;
  temperature_c: number;
  rain_mm: number;
  label: string;
  emoji: string;
  precipitation_probability: number;
  wind_speed_kmh: number;
}

interface RoutePoint {
  point_index: number;
  lat: number;
  lng: number;
  route_fraction: number;
  risk: string;
  impact_color: string;
  rain_mm: number;
  wind_kmh: number;
  current_weather: CurrentWeather;
  forecast_at_eta: HourlySlot;
  eta_offset_minutes: number;
  time_penalty_fraction: number;
}

interface WeatherImpact {
  delay_minutes: number;
  adjusted_duration_minutes: number;
  adjusted_cost_inr: number;
  adjusted_co2_kg: number;
  risk: string;
  overall_rain_mm: number;
  method: string;
}

interface WeatherResponse {
  origin: { current: CurrentWeather; hourly: HourlySlot[] };
  destination: { current: CurrentWeather; hourly: HourlySlot[] };
  route_points: RoutePoint[];
  impact: WeatherImpact;
  base: { duration_minutes: number; distance_km: number; cost_inr: number; co2_kg: number };
}

interface Props {
  carOption: any;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmtTime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtHour = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch {
    return iso.slice(11, 16);
  }
};

const riskColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  LOW:    { bg: 'bg-[#EAF0EB]', text: 'text-[#1F4029]', border: 'border-[#C5D9CB]', dot: '🟢' },
  MEDIUM: { bg: 'bg-amber-50',  text: 'text-amber-800',  border: 'border-amber-200',  dot: '🟠' },
  HIGH:   { bg: 'bg-red-50',    text: 'text-red-800',    border: 'border-red-200',    dot: '🔴' },
};

const riskLineColor: Record<string, string> = {
  LOW:    '#7C9278',
  MEDIUM: '#f59e0b',
  HIGH:   '#ef4444',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DigitalTwinPanel({ carOption, onClose }: Props) {
  const seg = carOption?.segments?.[0];
  const originName  = seg?.origin?.name  || 'Origin';
  const destName    = seg?.destination?.name || 'Destination';
  const originLat   = seg?.origin?.lat   as number | undefined;
  const originLng   = seg?.origin?.lng   as number | undefined;
  const destLat     = seg?.destination?.lat as number | undefined;
  const destLng     = seg?.destination?.lng as number | undefined;
  const polyline    = seg?.geometry || '';
  const baseDuration = carOption?.duration_minutes || 0;
  const baseDistance = seg?.distance_km || 0;
  const baseCost     = carOption?.cost_inr || 0;
  const baseCo2      = carOption?.emissions?.co2e_kg || (baseDistance * 0.12);

  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading]         = useState(true);  // auto-fetch on mount
  const [error, setError]             = useState<string | null>(null);

  // Stage: 'weather' = showing current weather only, 'forecast' = full journey impact
  const [stage, setStage]         = useState<'weather' | 'forecast'>('weather');
  const [forecastLoading, setForecastLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Step 1: fetch current weather + route data automatically on open
  // ---------------------------------------------------------------------------
  const fetchWeather = useCallback(async () => {
    if (!originLat || !originLng || !destLat || !destLng) {
      setError('Route coordinates not available.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/weather/journey-impact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_lat: originLat, origin_lng: originLng,
          dest_lat: destLat, dest_lng: destLng,
          encoded_polyline: polyline,
          base_duration_minutes: baseDuration,
          base_distance_km: baseDistance,
          base_cost_inr: baseCost,
          base_co2_kg: baseCo2,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: WeatherResponse = await res.json();
      setWeatherData(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch weather.');
    } finally {
      setLoading(false);
    }
  }, [originLat, originLng, destLat, destLng, polyline, baseDuration, baseDistance, baseCost, baseCo2]);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  // ---------------------------------------------------------------------------
  // Step 2: user clicks "Check Forecast During Journey" — reveal impact section
  // ---------------------------------------------------------------------------
  const handleCheckForecast = () => {
    setForecastLoading(true);
    // data is already loaded — just animate the transition
    setTimeout(() => {
      setStage('forecast');
      setForecastLoading(false);
    }, 600);
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const WeatherCard = ({
    label, current, short,
  }: { label: string; current: CurrentWeather; short: string }) => (
    <div className="flex-1 bg-[#F8F6F3] border border-[#D8C9BE] rounded-2xl p-4">
      <div className="text-[11px] font-bold text-[#7C9278] uppercase tracking-wider mb-2 truncate">{short}</div>
      <div className="text-4xl mb-2">{current.emoji}</div>
      <div className="font-bold text-[#26382D] text-xl">{current.temperature_c?.toFixed(0)}°C</div>
      <div className="text-sm text-[#7C9278] mb-2">{current.label}</div>
      <div className="space-y-1">
        {current.rain_mm > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#3A5043]">
            <CloudRain className="w-3 h-3" />
            <span>{current.rain_mm} mm rain</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-[#7C9278]">
          <Wind className="w-3 h-3" />
          <span>{current.wind_speed_kmh?.toFixed(0)} km/h wind</span>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Panel
  // ---------------------------------------------------------------------------
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm h-full bg-white border-l border-[#D8C9BE] shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D8C9BE] bg-[#F8F6F3]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF0EB] border border-[#C5D9CB] flex items-center justify-center text-lg">
              ☁️
            </div>
            <div>
              <h2 className="font-bold text-[#26382D] text-base">Weather Analysis</h2>
              <p className="text-xs text-[#7C9278]">
                {originName.split(',')[0]} → {destName.split(',')[0]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-[#D8C9BE] flex items-center justify-center text-[#7C9278] hover:text-[#26382D] hover:border-[#7C9278] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ---- Body ---- */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-4 border-[#D8C9BE] border-t-[#7C9278] rounded-full animate-spin" />
              <p className="text-sm text-[#7C9278]">Fetching live weather…</p>
              <p className="text-xs text-[#A99587]">via Open-Meteo</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Could not load weather</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
                <button
                  onClick={fetchWeather}
                  className="text-xs font-semibold text-[#26382D] underline mt-2"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* ======================================================
              STAGE 1 — Current weather at both ends
          ====================================================== */}
          {!loading && weatherData && (
            <>
              {/* Section label */}
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-[#7C9278]" />
                <span className="text-xs font-bold text-[#7C9278] uppercase tracking-wider">Current Conditions</span>
              </div>

              {/* Origin + Destination cards */}
              <div className="flex gap-3">
                <WeatherCard
                  label={originName}
                  short={originName.split(',')[0]}
                  current={weatherData.origin.current}
                />
                <WeatherCard
                  label={destName}
                  short={destName.split(',')[0]}
                  current={weatherData.destination.current}
                />
              </div>

              {/* Next 6 hours at origin */}
              <div className="bg-[#F8F6F3] border border-[#D8C9BE] rounded-2xl p-4">
                <div className="text-[11px] font-bold text-[#7C9278] uppercase tracking-wider mb-3">
                  Hourly — {originName.split(',')[0]}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {weatherData.origin.hourly.slice(0, 6).map((h, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 text-center bg-white border border-[#D8C9BE] rounded-xl px-3 py-2.5 min-w-[60px]"
                    >
                      <div className="text-[10px] text-[#A99587] mb-1">{fmtHour(h.time)}</div>
                      <div className="text-xl">{h.emoji}</div>
                      <div className="text-xs font-bold text-[#26382D] mt-1">{h.temperature_c?.toFixed(0)}°</div>
                      {h.precipitation_probability != null && (
                        <div className="text-[9px] text-[#7C9278] mt-0.5">{h.precipitation_probability}%</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ---- Check Forecast Button ---- */}
              {stage === 'weather' && (
                <button
                  onClick={handleCheckForecast}
                  disabled={forecastLoading}
                  className="w-full flex items-center justify-between bg-[#26382D] text-white px-5 py-3.5 rounded-2xl font-semibold hover:bg-[#1a261f] transition-colors disabled:opacity-60 group"
                >
                  <span className="flex items-center gap-2 text-sm">
                    {forecastLoading ? (
                      <><Loader className="w-4 h-4 animate-spin" /> Analysing route…</>
                    ) : (
                      <>☁️ Check Forecast During Journey</>
                    )}
                  </span>
                  {!forecastLoading && (
                    <ChevronRight className="w-4 h-4 text-white/60 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </button>
              )}

              {/* ======================================================
                  STAGE 2 — Journey forecast impact
              ====================================================== */}
              {stage === 'forecast' && (
                <>
                  {/* Divider */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 h-px bg-[#D8C9BE]" />
                    <span className="text-[10px] font-bold text-[#A99587] uppercase tracking-wider px-2">Journey Forecast</span>
                    <div className="flex-1 h-px bg-[#D8C9BE]" />
                  </div>

                  {/* Impact summary */}
                  {(() => {
                    const { impact, base } = weatherData;
                    const rc = riskColors[impact.risk] || riskColors.LOW;
                    const delayPositive = impact.delay_minutes > 0;
                    return (
                      <div className={`${rc.bg} border ${rc.border} rounded-2xl p-4`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Info className="w-4 h-4 text-[#7C9278]" />
                          <span className="text-xs font-bold text-[#7C9278] uppercase tracking-wider">Digital Twin Estimate</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] text-[#7C9278] uppercase">Base ETA</div>
                            <div className="font-bold text-[#26382D] text-lg">{fmtTime(base.duration_minutes)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#7C9278] uppercase">Weather Delay</div>
                            <div className={`font-bold text-lg ${delayPositive ? 'text-amber-700' : 'text-[#1F4029]'}`}>
                              {delayPositive ? `+${impact.delay_minutes} min` : 'None'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#7C9278] uppercase">Expected ETA</div>
                            <div className="font-bold text-[#26382D] text-lg">{fmtTime(impact.adjusted_duration_minutes)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#7C9278] uppercase">Disruption Risk</div>
                            <div className={`font-bold text-lg ${rc.text}`}>{rc.dot} {impact.risk}</div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-[#C5D9CB] flex justify-between text-xs text-[#7C9278]">
                          <span>CO₂ unchanged (same route)</span>
                          <span className="font-semibold text-[#26382D]">{base.co2_kg?.toFixed(1)} kg</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Route weather segments */}
                  {weatherData.route_points.length > 0 && (
                    <div className="bg-white border border-[#D8C9BE] rounded-2xl p-4">
                      <div className="text-[11px] font-bold text-[#7C9278] uppercase tracking-wider mb-3">
                        Along Your Route
                      </div>
                      <div className="relative pl-5">
                        {/* Connector line */}
                        <div className="absolute left-1.5 top-3 bottom-3 w-0.5 bg-[#D8C9BE]" />
                        {weatherData.route_points.map((pt, i) => {
                          const isFirst = i === 0;
                          const isLast  = i === weatherData.route_points.length - 1;
                          const name = isFirst
                            ? originName.split(',')[0]
                            : isLast
                            ? destName.split(',')[0]
                            : `${Math.round(pt.route_fraction * 100)}% along route`;
                          const etaLabel = pt.eta_offset_minutes === 0
                            ? 'Now'
                            : `+${Math.round(pt.eta_offset_minutes / 60 * 10) / 10}h`;
                          return (
                            <div key={i} className="relative mb-4 last:mb-0">
                              {/* Dot on connector line */}
                              <div
                                className="absolute -left-5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: riskLineColor[pt.risk] || '#7C9278' }}
                              />
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-[#26382D]">{name}</div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-base">{pt.forecast_at_eta?.emoji || pt.current_weather.emoji}</span>
                                    <span className="text-xs text-[#7C9278]">
                                      {pt.forecast_at_eta?.label || pt.current_weather.label}
                                    </span>
                                    {pt.rain_mm > 0 && (
                                      <span className="text-xs text-[#7C9278]">· {pt.rain_mm.toFixed(1)} mm</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-[10px] text-[#A99587]">{etaLabel}</div>
                                  <span
                                    className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5"
                                    style={{
                                      backgroundColor: `${riskLineColor[pt.risk]}18`,
                                      color: riskLineColor[pt.risk],
                                      borderColor: `${riskLineColor[pt.risk]}40`,
                                    }}
                                  >
                                    {pt.risk}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Legend */}
                      <div className="flex gap-4 mt-3 pt-3 border-t border-[#F8F6F3] text-xs text-[#7C9278]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#7C9278] inline-block" />Low</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Medium</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />High impact</span>
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  {(() => {
                    const { impact } = weatherData;
                    if (impact.risk === 'LOW' && impact.delay_minutes === 0) {
                      return (
                        <div className="bg-[#EAF0EB] border border-[#C5D9CB] rounded-2xl p-4 flex items-start gap-3">
                          <span className="text-xl">✅</span>
                          <div>
                            <p className="text-sm font-bold text-[#1F4029]">Good conditions for travel</p>
                            <p className="text-xs text-[#3A5043] mt-0.5">
                              No significant weather delays expected along this route. Your estimated arrival is on time.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    if (impact.risk === 'MEDIUM') {
                      return (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                          <span className="text-xl">⚠️</span>
                          <div>
                            <p className="text-sm font-bold text-amber-800">Moderate weather along route</p>
                            <p className="text-xs text-amber-700 mt-0.5">
                              Expect some rain and slower traffic in parts of your journey.
                              Consider departing earlier to absorb the +{impact.delay_minutes} min delay.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                        <span className="text-xl">🔴</span>
                        <div>
                          <p className="text-sm font-bold text-red-800">High weather disruption risk</p>
                          <p className="text-xs text-red-700 mt-0.5">
                            Heavy rain or storms expected along your route. The Digital Twin estimates a +{impact.delay_minutes} min delay.
                            Consider an alternative departure time or route.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Disclaimer */}
                  <div className="flex items-start gap-2 px-1">
                    <Info className="w-3 h-3 text-[#A99587] shrink-0 mt-0.5" />
                    <p className="text-[10px] text-[#A99587]">
                      {weatherData.impact.method}. Weather data from Open-Meteo.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
