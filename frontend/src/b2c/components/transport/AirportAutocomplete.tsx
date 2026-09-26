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

export default function AirportAutocomplete({ label, name, defaultValue = "", onSelect }: Props) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
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
        const res = await fetch(`${API_BASE_URL}/api/search/autocomplete/places?q=${encodeURIComponent(query + " airport")}`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((d: any) => ({
            placeId: d.placeId,
            text: d.placePrediction?.text?.text || d.text,
            mainText: d.placePrediction?.structuredFormat?.mainText?.text || d.text,
            secondaryText: d.placePrediction?.structuredFormat?.secondaryText?.text || ""
          }));
          setSuggestions(mapped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, showDropdown]);

  const handleSelect = async (s: PlaceSuggestion) => {
    setQuery(s.mainText);
    setShowDropdown(false);
    
    // Fetch details
    if (onSelect) {
      try {
        const res = await fetch(`/api/search/place/${s.placeId}`);
        const data = await res.json();
        onSelect({
          name: data.displayName?.text || s.mainText,
          lat: data.location?.latitude,
          lng: data.location?.longitude,
          place_id: data.id,
          address: data.formattedAddress
        });
      } catch (err) {
        console.error(err);
      }
    }
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
              key={s.placeId} 
              onClick={() => handleSelect(s)}
              className="px-4 py-3 hover:bg-[#F8F6F3] cursor-pointer border-b border-[#F8F6F3] last:border-0"
            >
              <div className="font-semibold text-[#26382D] truncate">{s.mainText}</div>
              <div className="text-xs text-[#7C9278] truncate mt-0.5">{s.secondaryText}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
