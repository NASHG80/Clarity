import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../../lib/api';

interface Station {
  code: string;
  name: string;
  city: string;
}

interface Props {
  label: string;
  name: string;
  defaultValue?: string;
  onSelect?: (station: Station) => void;
}

export default function StationAutocomplete({ label, name, defaultValue = "", onSelect }: Props) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Station[]>([]);
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

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/search/autocomplete/station?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, showDropdown]);

  const handleSelect = (station: Station) => {
    setQuery(`${station.name} (${station.code})`);
    setShowDropdown(false);
    if (onSelect) onSelect(station);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1">{label}</label>
      <div className="relative">
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
          placeholder="Search station or city (e.g., LTT)"
        />
        {loading ? (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C9278] animate-spin" />
        ) : (
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C9278]" />
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D8C9BE] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map(s => (
            <div 
              key={s.code} 
              onClick={() => handleSelect(s)}
              className="px-4 py-3 hover:bg-[#F8F6F3] cursor-pointer border-b border-[#F8F6F3] last:border-0"
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold text-[#26382D]">{s.code}</div>
                <div className="text-xs text-[#7C9278]">{s.city}</div>
              </div>
              <div className="text-sm text-[#26382D] truncate">{s.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
