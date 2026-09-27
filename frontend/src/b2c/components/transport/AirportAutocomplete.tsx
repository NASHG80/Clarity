import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Plane } from 'lucide-react';
import { API_BASE_URL } from '../../../lib/api';

interface PlaceSuggestion {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
}

interface Props {
  label: string;
  name: string;
  defaultValue?: string;
  onSelect?: (place: any) => void;
}

const AIRPORTS = [
  { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai' },
  { iata: 'DEL', name: 'Indira Gandhi International', city: 'Delhi' },
  { iata: 'GOI', name: 'Goa International Airport, Dabolim', city: 'Goa' },
  { iata: 'GOX', name: 'Manohar International Airport, Mopa', city: 'Goa' },
  { iata: 'BLR', name: 'Kempegowda International', city: 'Bangalore' },
  { iata: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad' },
  { iata: 'MAA', name: 'Chennai International', city: 'Chennai' },
  { iata: 'CCU', name: 'Netaji Subhash Chandra Bose International', city: 'Kolkata' },
];

export default function AirportAutocomplete({ label, name, defaultValue = "", onSelect }: Props) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2 || !showDropdown) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const q = query.toLowerCase();
    const matches = AIRPORTS.filter(a => 
      a.city.toLowerCase().includes(q) || 
      a.name.toLowerCase().includes(q) || 
      a.iata.toLowerCase().includes(q)
    );
    setSuggestions(matches);
    setLoading(false);
  }, [query, showDropdown]);

  const handleSelect = (s: any) => {
    setQuery(`${s.city} (${s.iata})`);
    setShowDropdown(false);
    
    if (onSelect) {
      onSelect({
        code: s.iata,
        name: s.name,
        city: s.city
      });
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1">{label}</label>
      <div className="relative">
        <input 
          type="hidden" 
          name={`${name}_code`} 
          value={query.includes('(') ? query.split('(')[1].replace(')', '') : query} 
        />
        <input 
          type="text"
          name={name}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          autoComplete="off"
          className="w-full border-b-2 border-[#D8C9BE] py-2 bg-transparent outline-none text-[#26382D] pr-8 focus:border-[#7C9278]"
          placeholder="Search airport or city (e.g., BOM)"
        />
        {loading ? (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C9278] animate-spin" />
        ) : (
          <Plane className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C9278] -rotate-45" />
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D8C9BE] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map(s => (
            <div 
              key={s.iata} 
              onClick={() => handleSelect(s)}
              className="px-4 py-3 hover:bg-[#F8F6F3] cursor-pointer border-b border-[#F8F6F3] last:border-0"
            >
              <div className="font-semibold text-[#26382D] flex items-center gap-2 truncate">
                <span>{s.city}</span>
                <span className="text-[10px] bg-[#E88D67]/10 text-[#E88D67] px-1 rounded font-bold">{s.iata}</span>
              </div>
              <div className="text-xs text-[#7C9278] truncate mt-0.5">{s.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
