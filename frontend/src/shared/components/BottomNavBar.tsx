import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Compass, Map } from 'lucide-react';

export default function BottomNavBar() {
  const { t } = useTranslation('b2c');
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#D8C9BE] md:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        
        <button 
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            currentPath === '/' || currentPath === '/requirements' || currentPath === '/transport-results' 
            ? 'text-[#26382D]' 
            : 'text-[#A99587] hover:text-[#7C9278]'
          }`}
        >
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-medium">{t('home.nav.planTrip', 'Search')}</span>
        </button>

        <button 
          onClick={() => navigate('/explore/Goa')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            currentPath.startsWith('/explore') || currentPath.startsWith('/listings') || currentPath === '/accommodation-results'
            ? 'text-[#26382D]' 
            : 'text-[#A99587] hover:text-[#7C9278]'
          }`}
        >
          <Compass className="w-6 h-6" />
          <span className="text-[10px] font-medium">{t('home.nav.explore', 'Explore')}</span>
        </button>

        <button 
          onClick={() => navigate('/trip-summary')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            currentPath === '/trip-summary' || currentPath === '/booking-confirmation'
            ? 'text-[#26382D]' 
            : 'text-[#A99587] hover:text-[#7C9278]'
          }`}
        >
          <Map className="w-6 h-6" />
          <span className="text-[10px] font-medium">{t('home.nav.trips', 'Trips')}</span>
        </button>

      </div>
    </div>
  );
}
