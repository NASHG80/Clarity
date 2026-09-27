import React from 'react';
import { useTranslation } from 'react-i18next';
import { AnalyticsFunnel } from '../../lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TravelerFunnelProps {
  funnel: AnalyticsFunnel;
}

export default function TravelerFunnel({ funnel }: TravelerFunnelProps) {
  const { t } = useTranslation();

  const stages = [
    { key: 'listing_impressions', label: t('analytics.views', 'Impressions'), value: funnel.listing_impressions ?? 0 },
    { key: 'listing_opens', label: t('analytics.opens', 'Property Opens'), value: funnel.listing_opens ?? 0 },
    { key: 'detail_opens', label: t('analytics.detailOpens', 'Detail Views'), value: funnel.detail_opens ?? 0 },
    { key: 'saves', label: t('analytics.saves', 'Saves'), value: funnel.saves ?? 0 },
    { key: 'booking_starts', label: t('analytics.bookingStarts', 'Booking Starts'), value: funnel.booking_starts ?? 0 },
    { key: 'bookings', label: t('analytics.bookings', 'Bookings'), value: funnel.bookings ?? 0 },
  ];



  return (
    <div className="bg-white rounded-2xl border border-[#E5DFD6] p-8 lg:p-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col min-h-[400px]">
      <div className="mb-8">
        <h2 className="text-2xl font-serif font-bold text-[#1C2B22]">{t('dashboard.customerJourney', 'Customer Journey')}</h2>
        <p className="text-[#3E5245] text-[15px] mt-1">{t('dashboard.journeyDesc', 'How travelers move from discovery to booking.')}</p>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C9278" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7C9278" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBE1" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5B6D62' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5B6D62' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #E5DFD6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ color: '#1C2B22', fontWeight: 'bold' }}
              labelStyle={{ color: '#5B6D62', marginBottom: '4px', fontSize: '13px' }}
            />
            <Area type="monotone" dataKey="value" stroke="#7C9278" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
