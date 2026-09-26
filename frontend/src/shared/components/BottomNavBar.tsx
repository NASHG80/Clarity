import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Search, Compass, Map } from 'lucide-react';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

export interface BottomNavBarProps {
  items?: BottomNavItem[];
}

export function BottomNavBar({ items }: BottomNavBarProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#F8F6F3] border-t border-[#D8C9BE]/50 pb-safe md:hidden shadow-[0_-4px_16px_rgba(38,56,45,0.05)]">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.href}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-[#7C9278]' : 'text-[#26382D]/60 hover:text-[#26382D]'
              }`
            }
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {item.icon}
            </div>
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function B2CBottomNavBar() {
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
