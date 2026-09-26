import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChevronDown } from 'lucide-react';

interface TrendDataPoint {
  date: string;
  impressions: number;
  opens: number;
  saves: number;
}

interface ActivityTrendChartProps {
  data?: TrendDataPoint[];
}

export function ActivityTrendChart({ data = [] }: ActivityTrendChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5DFD6] p-8 lg:p-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] h-[520px] flex flex-col">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#1C2B22]">Customer Activity</h2>
          <p className="text-[#3E5245] text-[15px] mt-1">How travelers interacted with your property.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select className="appearance-none bg-[#F8F6F3] border border-[#E5DFD6] text-[#26382D] text-sm font-medium py-2 pl-4 pr-10 rounded-lg focus:outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed" disabled={data.length === 0}>
              <option>Impressions</option>
              <option>Property Opens</option>
              <option>Detail Views</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#26382D]/50 pointer-events-none" />
          </div>
          <div className="relative">
            <select className="appearance-none bg-[#F8F6F3] border border-[#E5DFD6] text-[#26382D] text-sm font-medium py-2 pl-4 pr-10 rounded-lg focus:outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed" disabled>
              <option>This week</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#26382D]/50 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-[340px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C9278" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#7C9278" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBE1" />
              <XAxis 
                dataKey="date" 
                axisLine={{ stroke: '#E5DFD6' }}
                tickLine={false} 
                tick={{ fill: '#5B6D62', fontSize: 12, fontWeight: 500 }} 
                dy={15} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#5B6D62', fontSize: 12, fontWeight: 500 }} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5DFD6', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.08)', padding: '12px 16px' }}
                itemStyle={{ color: '#1C2B22', fontWeight: 700, fontSize: '15px' }}
                labelStyle={{ color: '#5B6D62', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="impressions" 
                name="Impressions"
                stroke="#7C9278" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorImpressions)" 
                activeDot={{ r: 6, fill: '#1C2B22', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-[#E5DFD6] rounded-xl bg-[#F5F3ED]/50 m-2">
            <svg className="w-12 h-12 text-[#A69C8E] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <p className="text-[#5B6D62] text-[15px] font-medium text-center max-w-sm px-4">
              Trend data will appear as more time-based activity is collected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
