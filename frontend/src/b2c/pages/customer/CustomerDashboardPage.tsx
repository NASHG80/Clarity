import React from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../../../shared/components/Navbar';

export default function CustomerDashboardPage() {
  const { t } = useTranslation('b2c');

  return (
    <div className="min-h-screen bg-[#F1EDE9] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-32">
        <div className="bg-[#F8F6F3] rounded-2xl p-8 border border-[#D8C9BE] shadow-sm">
          <h1 className="font-serif text-3xl text-[#26382D] mb-4">Customer Dashboard</h1>
          <p className="text-[#26382D]/70 font-light">
            This page is currently under construction.
          </p>
        </div>
      </main>
    </div>
  );
}
