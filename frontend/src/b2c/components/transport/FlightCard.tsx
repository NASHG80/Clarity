import React from 'react';
import { Plane, ArrowRight } from 'lucide-react';

export default function FlightCard({ option, onSelect }: { option: any, onSelect: () => void }) {
  const mainSeg = option.segments.find((s: any) => s.segment_type === 'main');
  const details = mainSeg?.details || {};

  return (
    <div className="bg-white border border-[#D8C9BE] rounded-2xl shadow-sm overflow-hidden hover:border-[#7C9278] transition-colors">
      <div className="p-5 flex flex-col md:flex-row items-center gap-6">
        
        {/* Airline & Timing */}
        <div className="flex-1 w-full flex items-center justify-between md:justify-start md:gap-8">
          <div className="flex items-center gap-4 min-w-[140px]">
             {details.airline_logo ? (
               <img src={details.airline_logo} alt={details.airline} className="w-10 h-10 object-contain rounded-full bg-[#F8F6F3] p-1 border border-[#D8C9BE]" />
             ) : (
               <div className="w-10 h-10 bg-[#EAF0EB] rounded-full flex items-center justify-center">
                 <Plane className="w-5 h-5 text-[#26382D] -rotate-45" />
               </div>
             )}
             <div>
               <div className="font-bold text-[#26382D] text-sm leading-tight">{details.airline || 'Airline'}</div>
               <div className="text-xs text-[#7C9278] mt-0.5">{details.flight_number}</div>
             </div>
          </div>
          
          <div className="flex flex-1 items-center justify-between md:justify-center md:gap-8">
            <div className="flex flex-col text-right md:text-left">
              <span className="text-lg font-bold text-[#26382D]">{details.departure_time || '10:00 AM'}</span>
              <span className="text-xs font-semibold text-[#7C9278] uppercase mt-0.5">{mainSeg?.origin?.code || 'BOM'}</span>
            </div>
            
            <div className="flex flex-col items-center justify-center px-4 md:px-8 relative">
              <span className="text-xs font-medium text-[#A99587] mb-1">
                {Math.floor(mainSeg?.duration_minutes/60)}h {mainSeg?.duration_minutes%60}m
              </span>
              <div className="w-16 md:w-32 h-[2px] bg-[#D8C9BE] relative">
                {details.stops > 0 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white border-2 border-[#26382D] rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-bold text-[#26382D] uppercase mt-1">
                {details.stops === 0 ? 'Nonstop' : `${details.stops} Stop${details.stops > 1 ? 's' : ''}`}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#26382D]">{details.arrival_time || '12:30 PM'}</span>
              <span className="text-xs font-semibold text-[#7C9278] uppercase mt-0.5">{mainSeg?.destination?.code || 'GOI'}</span>
            </div>
          </div>
        </div>

        {/* Price & Action */}
        <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between md:pl-6 md:border-l border-[#D8C9BE]">
          <div className="flex flex-col md:items-end">
             <span className="text-xl font-bold text-[#26382D]">₹{option.cost_inr}</span>
             {option.emissions?.co2e_kg && (
               <span className="text-xs font-medium text-[#7C9278] mt-1">
                 {option.emissions.co2e_kg.toFixed(0)} kg CO₂
               </span>
             )}
          </div>
          <button onClick={onSelect} className="mt-0 md:mt-3 bg-[#26382D] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#1a261f] transition-colors flex items-center gap-2">
            Select <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
