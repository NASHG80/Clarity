import React from 'react';
import { TrendingDown, TrendingUp, Info } from 'lucide-react';

interface Props {
  insights: any;
}

export default function FlightPriceInsights({ insights }: Props) {
  if (!insights) return null;

  return (
    <div className="bg-white border border-[#D8C9BE] rounded-xl p-5 mb-6">
      <h3 className="font-bold text-[#26382D] mb-4 flex items-center gap-2">
        Price Insights <Info className="w-4 h-4 text-[#7C9278]" />
      </h3>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1">
          <p className="text-sm text-[#26382D] font-medium leading-relaxed">
            Prices are currently <span className="font-bold text-[#1a261f]">typical</span> for your search.
            The cheapest flights for similar trips to {insights.destination || "this destination"} usually cost between 
            <span className="font-bold"> ₹{insights.low || 4500}</span> and <span className="font-bold">₹{insights.high || 6500}</span>.
          </p>
        </div>
        
        <div className="w-full md:w-64 bg-[#F8F6F3] p-4 rounded-lg relative">
          <div className="flex justify-between text-xs text-[#7C9278] font-semibold mb-2">
            <span>Low</span>
            <span>Typical</span>
            <span>High</span>
          </div>
          <div className="h-2 w-full bg-[#EAF0EB] rounded-full overflow-hidden flex">
            <div className="h-full bg-green-500 w-1/3" />
            <div className="h-full bg-yellow-400 w-1/3" />
            <div className="h-full bg-red-400 w-1/3" />
          </div>
          {/* Indicator triangle */}
          <div 
            className="absolute -bottom-2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#26382D]"
            style={{ left: `calc(50% - 6px)` }}
          />
        </div>
      </div>
    </div>
  );
}
