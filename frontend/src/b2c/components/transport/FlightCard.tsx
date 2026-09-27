import React, { useState } from 'react';
import { Plane, ArrowRight, ChevronDown, ChevronUp, Leaf, Clock, Wifi, Info } from 'lucide-react';

export default function FlightCard({ option, onSelect }: { option: any, onSelect: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const mainSeg = option.segments.find((s: any) => s.segment_type === 'main');
  const details = mainSeg?.details || {};
  const providerDetails = option.provider_details || {};

  const legs = providerDetails.legs || [];
  const layovers = providerDetails.layovers || [];
  const co2 = providerDetails.carbon_emissions || {};

  return (
    <div className={`bg-white border ${isExpanded ? 'border-[#7C9278]' : 'border-[#D8C9BE]'} rounded-2xl shadow-sm hover:border-[#7C9278] transition-colors`}>
      <div
        className="p-4 flex flex-row items-center gap-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >

        {/* Airline logo + name */}
        <div className="flex items-center gap-3 w-[130px] shrink-0">
          {details.airline_logo ? (
            <img src={details.airline_logo} alt={details.airline} className="w-9 h-9 object-contain rounded-full bg-[#F8F6F3] p-1 border border-[#D8C9BE]" />
          ) : (
            <div className="w-9 h-9 bg-[#EAF0EB] rounded-full flex items-center justify-center shrink-0">
              <Plane className="w-4 h-4 text-[#26382D] -rotate-45" />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-bold text-[#26382D] text-sm leading-tight truncate">{details.airline || 'Airline'}</div>
            <div className="text-xs text-[#7C9278] mt-0.5 truncate">{details.flight_number}</div>
          </div>
        </div>

        {/* Departure */}
        <div className="flex flex-col text-left shrink-0 w-[90px]">
          <span className="text-[10px] text-[#A99587] font-medium leading-none mb-1">
            {details.departure_time ? new Date(details.departure_time).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-[#26382D] leading-none">
              {details.departure_time ? new Date(details.departure_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '10:00'}
            </span>
            <span className="text-xs font-semibold text-[#7C9278] uppercase">{mainSeg?.origin?.code || 'BOM'}</span>
          </div>
        </div>

        {/* Duration / stops — flexible center */}
        <div className="flex flex-col items-center flex-1 min-w-0 px-2">
          <span className="text-[10px] font-medium text-[#A99587] mb-1">
            {Math.floor(mainSeg?.duration_minutes / 60)}h {mainSeg?.duration_minutes % 60}m
          </span>
          <div className="w-full h-[2px] bg-[#D8C9BE] relative">
            {details.stops > 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white border-2 border-[#26382D] rounded-full" />
            )}
          </div>
          <span className="text-[10px] font-bold text-[#26382D] uppercase mt-1">
            {details.stops === 0 ? 'Nonstop' : `${details.stops} Stop${details.stops > 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Arrival */}
        <div className="flex flex-col text-right items-end shrink-0 w-[90px]">
          <span className="text-[10px] text-[#A99587] font-medium leading-none mb-1">
            {details.arrival_time ? new Date(details.arrival_time).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-semibold text-[#7C9278] uppercase">{mainSeg?.destination?.code || 'GOI'}</span>
            <span className="text-xl font-bold text-[#26382D] leading-none">
              {details.arrival_time ? new Date(details.arrival_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '12:30'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-12 bg-[#D8C9BE] mx-1 shrink-0" />

        {/* Price & Action — always fully visible */}
        <div className="flex flex-col items-end shrink-0 pl-1 min-w-[120px]">
          <span className="text-lg font-bold text-[#26382D] whitespace-nowrap">₹{option.cost_inr?.toLocaleString('en-IN') || option.cost_inr}</span>
          {option.emissions?.co2e_kg && (
            <span className={`text-[10px] font-medium mt-0.5 flex items-center gap-1 ${co2.difference_percent < 0 ? 'text-green-600' : 'text-[#7C9278]'}`}>
              {co2.difference_percent < 0 && <Leaf className="w-3 h-3" />}
              {option.emissions.co2e_kg.toFixed(0)} kg CO₂
              {co2.difference_percent < 0 && ` (${Math.abs(co2.difference_percent)}% less)`}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="mt-2 bg-[#26382D] text-white px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-[#1a261f] transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            Select <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expand toggle */}
        <div className="shrink-0 ml-1">
          {isExpanded ? <ChevronUp className="w-4 h-4 text-[#7C9278]" /> : <ChevronDown className="w-4 h-4 text-[#7C9278]" />}
        </div>
      </div>

      {/* Expanded State */}
      {isExpanded && (
        <div className="bg-[#F8F6F3] border-t border-[#D8C9BE] p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="font-bold text-[#26382D] text-sm uppercase tracking-wider">Flight Details</h4>
            <div className="flex-1 border-t border-[#D8C9BE]" />
          </div>

          <div className="space-y-6">
            {legs.map((leg: any, idx: number) => {
              const ext = leg.extensions || [];
              const hasUsb = ext.some((e: string) => e.toLowerCase().includes('usb'));
              const hasWifi = ext.some((e: string) => e.toLowerCase().includes('wifi'));
              const co2Est = ext.find((e: string) => e.toLowerCase().includes('carbon'))?.split(': ')[1];

              return (
                <div key={idx} className="flex flex-col md:flex-row gap-6 relative">
                  {/* Timeline line */}
                  {idx !== legs.length - 1 && (
                    <div className="absolute left-[3px] top-[24px] bottom-[-24px] w-px bg-[#D8C9BE] md:hidden" />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-[#26382D]" />
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-[#26382D] text-sm">
                          {leg.departure_airport?.time ? new Date(leg.departure_airport.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'Time'}
                        </span>
                        <span className="text-xs text-[#A99587] font-medium">
                          {leg.departure_airport?.time ? new Date(leg.departure_airport.time).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date'}
                        </span>
                      </div>
                      <span className="text-sm text-[#7C9278] font-medium">{leg.departure_airport?.name} ({leg.departure_airport?.id})</span>
                    </div>

                    <div className="pl-5 border-l-[2px] border-dashed border-[#D8C9BE] ml-[3px] py-4 space-y-3">
                      <div className="flex items-start gap-4">
                        <img src={leg.airline_logo} className="w-6 h-6 object-contain" alt="" />
                        <div>
                          <div className="text-sm font-semibold text-[#26382D]">
                            {leg.airline} <span className="text-[#7C9278] font-normal">{leg.flight_number}</span>
                          </div>
                          <div className="text-xs text-[#7C9278] mt-1 flex items-center flex-wrap gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor(leg.duration / 60)}h {leg.duration % 60}m</span>
                            <span>{leg.airplane}</span>
                            <span>{leg.travel_class}</span>
                            <span>{leg.legroom}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap text-xs text-[#7C9278] pt-1">
                        {hasUsb && <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-[#D8C9BE]"><Info className="w-3 h-3" /> USB Power</span>}
                        {hasWifi && <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-[#D8C9BE]"><Wifi className="w-3 h-3" /> Wi-Fi</span>}
                        {co2Est && <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-[#D8C9BE]"><Leaf className="w-3 h-3 text-green-600" /> {co2Est}</span>}
                        {leg.often_delayed_by_over_30_min && (
                          <span className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded border border-red-200">
                            Often delayed 30m+
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#7C9278]" />
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-[#26382D] text-sm">
                          {leg.arrival_airport?.time ? new Date(leg.arrival_airport.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'Time'}
                        </span>
                        <span className="text-xs text-[#A99587] font-medium">
                          {leg.arrival_airport?.time ? new Date(leg.arrival_airport.time).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date'}
                        </span>
                      </div>
                      <span className="text-sm text-[#7C9278] font-medium">{leg.arrival_airport?.name} ({leg.arrival_airport?.id})</span>
                    </div>
                  </div>

                  {/* Layover */}
                  {idx < layovers.length && (
                    <div className="bg-[#EAF0EB] rounded-xl px-4 py-3 md:py-2 flex items-center gap-3 text-sm font-medium text-[#26382D] md:self-center md:my-0 my-2">
                      <Clock className="w-4 h-4 text-[#7C9278]" />
                      Layover: {Math.floor(layovers[idx].duration / 60)}h {layovers[idx].duration % 60}m in {layovers[idx].name} ({layovers[idx].id})
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
