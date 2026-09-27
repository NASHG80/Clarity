import React, { useState } from 'react';
import { Train, Clock, ArrowRight, Activity, Users, FileText, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { API_BASE_URL } from '../../../lib/api';

export default function TrainCard({ option, onSelect }: { option: any, onSelect: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [trainDetails, setTrainDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const mainSeg = option.segments.find((s: any) => s.segment_type === 'main');
  const details = mainSeg?.details || {};
  
  const fareBreakdown = details.fareBreakdown;
  const isEstimated = details.is_fare_estimated;

  const handleToggleDetails = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    setIsExpanded(true);
    if (!trainDetails && details.train_number) {
      setLoadingDetails(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/search/transport/train/${details.train_number}/details`);
        const data = await res.json();
        if (data && data.success) {
          setTrainDetails(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

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
           <button onClick={handleToggleDetails} className="flex items-center gap-1 hover:text-[#7C9278] transition-colors underline underline-offset-4 decoration-[#D8C9BE]">
             View details {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
           </button>
           <button className="hover:text-[#7C9278] transition-colors underline underline-offset-4 decoration-[#D8C9BE]">Track live</button>
        </div>
        <button onClick={onSelect} className="bg-[#26382D] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a261f] transition-colors flex items-center gap-2">
          Select <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-[#D8C9BE] bg-white p-5">
          {loadingDetails ? (
            <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-[#7C9278]" /></div>
          ) : trainDetails ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 border border-[#D8C9BE] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[#7C9278] uppercase tracking-wider mb-2">Runs On</div>
                  <div className="flex gap-1.5">
                    {days.map(d => (
                      <span key={d} className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${trainDetails.train?.runDays?.includes(d) ? 'bg-[#2563EB] text-white' : 'bg-[#F8F6F3] text-[#7C9278]'}`}>
                        {d.substring(0,3)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-[#F8F6F3] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[#7C9278] uppercase tracking-wider mb-1">Distance</div>
                  <div className="font-semibold text-[#26382D]">{trainDetails.train?.distance} km</div>
                </div>
                <div className="bg-[#F8F6F3] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[#7C9278] uppercase tracking-wider mb-1">Duration</div>
                  <div className="font-semibold text-[#26382D]">{Math.floor(trainDetails.train?.duration/60)}h {trainDetails.train?.duration%60}m</div>
                </div>
                <div className="bg-[#F8F6F3] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[#7C9278] uppercase tracking-wider mb-1">Halts</div>
                  <div className="font-semibold text-[#26382D]">{trainDetails.train?.totalHalts}</div>
                </div>
                <div className="bg-[#F8F6F3] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[#7C9278] uppercase tracking-wider mb-1">Avg Speed</div>
                  <div className="font-semibold text-[#26382D]">{trainDetails.train?.avgSpeed} km/h</div>
                </div>
                <div className="bg-[#F8F6F3] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[#7C9278] uppercase tracking-wider mb-1">Max Speed</div>
                  <div className="font-semibold text-[#26382D]">{trainDetails.train?.maxSpeed} km/h</div>
                </div>
                <div className="bg-[#F8F6F3] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[#7C9278] uppercase tracking-wider mb-1">Return</div>
                  <div className="font-semibold text-[#26382D]">{trainDetails.train?.returnTrain || '-'}</div>
                </div>
              </div>

              <div className="mt-6 border border-[#D8C9BE] rounded-2xl overflow-hidden">
                <div className="flex justify-between items-center bg-[#F8F6F3] px-5 py-3 text-xs font-bold text-[#7C9278] border-b border-[#D8C9BE]">
                  <span>ARRIVAL</span>
                  <span>TIMELINE</span>
                  <span>DEPARTURE</span>
                </div>
                <div className="px-5 py-4">
                  {trainDetails.route?.map((st: any, idx: number) => (
                    <div key={idx} className="flex relative items-start gap-4 mb-6 last:mb-0 group">
                      {idx !== trainDetails.route.length - 1 && (
                        <div className="absolute left-[88px] sm:left-[118px] top-6 bottom-[-24px] w-1 bg-[#D8C9BE] group-hover:bg-[#7C9278] transition-colors" />
                      )}
                      
                      <div className="w-16 sm:w-24 shrink-0 pt-1 text-right">
                        <div className="text-sm font-semibold text-[#26382D]">{st.arrival || '-'}</div>
                        {st.arrivalDay > 1 && <div className="text-[10px] text-[#7C9278] font-bold">Day {st.arrivalDay}</div>}
                      </div>

                      <div className="relative shrink-0 pt-1.5 z-10">
                        <div className="w-4 h-4 rounded-full bg-white border-4 border-[#FBBF24] shadow-sm" />
                      </div>

                      <div className="flex-1 pb-4">
                        <div className="text-sm font-bold text-[#26382D] leading-none mb-1.5">{st.station.name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-[#7C9278] font-medium">
                          <span>{st.station.code}</span>
                          <span className="w-1 h-1 bg-[#D8C9BE] rounded-full" />
                          <span>{st.distance} km</span>
                          <span className="w-1 h-1 bg-[#D8C9BE] rounded-full" />
                          <span className="bg-[#E0E7FF] text-[#3730A3] px-1.5 py-0.5 rounded border border-[#C7D2FE]">PF {st.platform || '?'}</span>
                        </div>
                      </div>

                      <div className="w-16 sm:w-24 shrink-0 pt-1 text-right">
                        <div className="text-sm font-semibold text-[#26382D]">{st.departure || '-'}</div>
                        {st.departureDay > 1 && <div className="text-[10px] text-[#7C9278] font-bold">Day {st.departureDay}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-[#7C9278] text-center py-4">Failed to load train details.</div>
          )}
        </div>
      )}
    </div>
  );
}
