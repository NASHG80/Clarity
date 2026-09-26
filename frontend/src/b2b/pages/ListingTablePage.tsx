import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Plus, Edit2, Camera, Eye } from 'lucide-react';
import { DataStateBadge } from '../../shared/components/DataStateBadge';

export default function ListingTablePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Mock list of properties
  const properties = [
    {
      id: 'hotel_014',
      name: 'Andaz Delhi Aerocity',
      city: 'Delhi',
      status: 'Active',
      dataState: 'reported',
      completion: '85%'
    }
  ];

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[#D8C9BE]/50 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#26382D]">
            {t('listings.title', 'Properties')}
          </h1>
          <p className="text-[#26382D]/70 mt-1">
            {t('listings.subtitle', 'Manage your properties, photos, and amenities')}
          </p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/b2b/listings/editor')}
        >
          {t('listings.addProperty', 'Add Property')}
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#D8C9BE] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F6F3] border-b border-[#D8C9BE]">
              <th className="px-6 py-4 font-medium text-[#26382D]">{t('listings.tableProperty', 'Property')}</th>
              <th className="px-6 py-4 font-medium text-[#26382D]">{t('listings.tableLocation', 'Location')}</th>
              <th className="px-6 py-4 font-medium text-[#26382D]">{t('listings.tableStatus', 'Data State')}</th>
              <th className="px-6 py-4 font-medium text-[#26382D]">{t('listings.tableCompletion', 'Completion')}</th>
              <th className="px-6 py-4 font-medium text-[#26382D] text-right">{t('listings.tableActions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8C9BE]">
            {properties.map((prop) => (
              <tr key={prop.id} className="hover:bg-[#F8F6F3]/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-[#26382D]">{prop.name}</p>
                  <p className="text-xs text-[#26382D]/60">ID: {prop.id}</p>
                </td>
                <td className="px-6 py-4 text-[#26382D]">{prop.city}</td>
                <td className="px-6 py-4">
                  <DataStateBadge state={prop.dataState as any} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-[#E5DFD6] rounded-full h-2 max-w-[80px]">
                      <div className="bg-[#7C9278] h-2 rounded-full" style={{ width: prop.completion }}></div>
                    </div>
                    <span className="text-sm text-[#26382D]/70">{prop.completion}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/b2b/photos?id=${prop.id}`)}>
                      <Camera className="w-4 h-4 text-[#26382D]/70" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/b2b/listings/editor?id=${prop.id}`)}>
                      <Edit2 className="w-4 h-4 text-[#26382D]/70" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
