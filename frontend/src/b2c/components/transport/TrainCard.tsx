import React from 'react';
import { Train, Clock, ArrowRight, Activity, Users, FileText } from 'lucide-react';

export default function TrainCard({ option, onSelect }: { option: any, onSelect: () => void }) {
  const mainSeg = option.segments.find((s: any) => s.segment_type === 'main');
  const details = mainSeg?.details || {};
  
  const fareBreakdown = details.fareBreakdown;
  const isEstimated = details.is_fare_estimated;

  return (
    <div className="bg-white border border-[#D8C9BE] rounded-2xl shadow-sm overflow-hidden hover:border-[#7C9278] transition-colors">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EAF0EB] rounded-full flex items-center justify-center">
              <Train className="w-5 h-5 text-[#26382D]" />
            </div>
            <div>
              <h4 className="font-bold text-[#26382D] text-lg leading-tight">
                {details.train_number} {details.train_name || "Express"}
              </h4>
              <div className="text-xs text-[#7C9278] font-medium mt-0.5">
                {details.classes?.join(' • ') || 'Various Classes'} {details.run_days?.length ? ' · Runs: ' + details.run_days.map((d:any) => d.substring(0, 3)).join(' ') : ''}
              </div>
            </div>
          </div>
          {details.live_status && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 px-3 py-1 rounded-full uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              Running
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col">
            <span className="text-2xl font-semibold text-[#26382D]">{details.departure_time || mainSeg?.origin?.time || '10:15 PM'}</span>
            <span className="text-sm font-medium text-[#7C9278] mt-1">{mainSeg?.origin?.name || 'CSMT'}</span>
          </div>
          
          <div className="flex-1 px-8 flex flex-col items-center justify-center relative">
            <span className="text-xs font-semibold text-[#7C9278] mb-2 bg-white px-2 z-10">
              {Math.floor(mainSeg?.duration_minutes/60)}h {mainSeg?.duration_minutes%60}m
            </span>
            <div className="w-full border-t-2 border-dashed border-[#D8C9BE] absolute top-1/2 -translate-y-1/2" />
            <span className="text-xs text-[#A99587] mt-2 font-medium">{mainSeg?.distance_km?.toFixed(0)} km</span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-2xl font-semibold text-[#26382D]">{details.arrival_time || mainSeg?.destination?.time || '2:05 AM'}</span>
            <span className="text-sm font-medium text-[#7C9278] mt-1">{mainSeg?.destination?.name || 'GAYA'}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm mb-5 overflow-x-auto pb-2 scrollbar-hide">
           {/* Replace with actual available classes later */}
           <div className="shrink-0 border border-[#26382D] bg-[#26382D] text-white px-4 py-2 rounded-xl text-center min-w-[80px]">
             <div className="font-bold text-xs uppercase opacity-80 mb-0.5">3A</div>
             <div className="font-semibold">₹{mainSeg?.cost_inr || option.cost_inr}</div>
           </div>
           <div className="shrink-0 border border-[#D8C9BE] text-[#26382D] hover:border-[#7C9278] cursor-pointer px-4 py-2 rounded-xl text-center min-w-[80px]">
             <div className="font-bold text-xs uppercase opacity-60 mb-0.5">SL</div>
             <div className="font-semibold">Check</div>
           </div>
           <div className="shrink-0 border border-[#D8C9BE] text-[#26382D] hover:border-[#7C9278] cursor-pointer px-4 py-2 rounded-xl text-center min-w-[80px]">
             <div className="font-bold text-xs uppercase opacity-60 mb-0.5">2A</div>
             <div className="font-semibold">Check</div>
           </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
           {option.emissions?.co2e_kg && (
             <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7C9278] bg-[#F8F6F3] px-2.5 py-1 rounded-md">
               CO₂: {option.emissions.co2e_kg.toFixed(1)} kg
             </span>
           )}
           {isEstimated && (
             <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A99587] bg-[#F8F6F3] px-2.5 py-1 rounded-md">
               Estimated Fare
             </span>
           )}
        </div>
      </div>
      
      <div className="bg-[#F8F6F3] p-4 flex items-center justify-between border-t border-[#D8C9BE]">
        <div className="flex items-center gap-4 text-sm font-medium text-[#26382D]">
           <button className="hover:text-[#7C9278] transition-colors underline underline-offset-4 decoration-[#D8C9BE]">View details</button>
           <button className="hover:text-[#7C9278] transition-colors underline underline-offset-4 decoration-[#D8C9BE]">Track live</button>
        </div>
        <button onClick={onSelect} className="bg-[#26382D] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a261f] transition-colors flex items-center gap-2">
          Select <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
