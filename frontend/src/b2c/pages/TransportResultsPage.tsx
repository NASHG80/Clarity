import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../shared/components/Navbar';
import RouteMap from '../components/RouteMap';
import {
  Train, Plane, Car, Navigation, MapPin,
  Leaf, Sliders, ChevronRight, User, Info, MessageCircle, AlertCircle, Loader, ArrowRight, X,
  Banknote, Bus, Footprints, Coins
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TrainCard from '../components/transport/TrainCard';
import FlightCard from '../components/transport/FlightCard';
import StationAutocomplete from '../components/transport/StationAutocomplete';
import AirportAutocomplete from '../components/transport/AirportAutocomplete';
import FlightPriceInsights from '../components/transport/FlightPriceInsights';
import DigitalTwinPanel from '../components/transport/DigitalTwinPanel';
import { API_BASE_URL } from '../../lib/api';

export default function TransportResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation('b2c');
  // Workflows states
  const [step, setStep] = useState<'TRIP_FORM' | 'MODE_SELECT' | 'MODE_FORM' | 'RESULTS' | 'BREAKDOWN'>('TRIP_FORM');
  const [trip, setTrip] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedSubStep, setSelectedSubStep] = useState<{ polyline: string, label: string } | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<{ role: string, content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showDigitalTwin, setShowDigitalTwin] = useState(false);
  // Handlers
  const handleTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setTrip({
      origin: formData.get('origin'),
      destination: formData.get('destination'),
      date: formData.get('date'),
      time: formData.get('time'),
      adults: formData.get('adults'),
      children: formData.get('children'),
      seniors: formData.get('seniors'),
    });
    setStep('MODE_SELECT');
  };

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode);
    setStep('MODE_FORM');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    setIsLoading(true);
    setStep('RESULTS');

    try {
      const res = await fetch(`${API_BASE_URL}/api/search/transport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: trip?.origin || "Borivali",
          destination: trip?.destination || "Hotel XYZ, Goa",
          mode: selectedMode?.toLowerCase() || "train",
          date: formData.get('date') || trip?.date || "2026-09-27",
          vehicle_preferences: {
            fuel_type: formData.get('fuel_type') || "petrol",
            board_station: formData.get('board_code') || formData.get('board'),
            dest_station: formData.get('dest_code') || formData.get('dest'),
          }
        })
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (opt: any) => {
    setSelectedOption(opt);
    setSelectedSegmentId(opt.segments[0]?.id || null);
    setStep('BREAKDOWN');
  };

  const handleApplyFilters = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const prefs = formData.getAll('routePref') as string[];

    const weights = {
      affordability: prefs.includes('Lowest cost') ? 1.0 : 0.5,
      convenience: (prefs.includes('Fastest') || prefs.includes('Less walking') || prefs.includes('Fewer transfers')) ? 1.0 : 0.5,
      environmental: prefs.includes('Lowest CO₂') ? 1.0 : 0.5,
      accessibility: prefs.includes('Wheelchair accessible') ? 1.0 : 0.5,
    };

    setIsLoading(true);
    setStep('RESULTS');
    try {
      const boardCode = (document.querySelector('input[name="board_code"]') as HTMLInputElement)?.value
        || (document.querySelector('input[name="board"]') as HTMLInputElement)?.value;
      const destCode = (document.querySelector('input[name="dest_code"]') as HTMLInputElement)?.value
        || (document.querySelector('input[name="dest"]') as HTMLInputElement)?.value;
      const res = await fetch(`${API_BASE_URL}/api/search/transport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: trip?.origin || "Borivali",
          destination: trip?.destination || "Hotel XYZ, Goa",
          mode: selectedMode?.toLowerCase() || "train",
          date: trip?.date || "2026-09-27",
          weights: weights,
          budget_max: formData.get('budget') ? parseFloat(formData.get('budget') as string) : undefined,
          vehicle_preferences: {
            fuel_type: (document.querySelector('select[name="fuel_type"]') as HTMLSelectElement)?.value || 'petrol',
            avoid_tolls: formData.get('avoidTolls') === 'on',
            avoid_highways: formData.get('avoidHighways') === 'on',
            eco_friendly: prefs.includes('Lowest CO₂'),
            less_walking: prefs.includes('Less walking'),
            fewer_transfers: prefs.includes('Fewer transfers'),
            fastest: prefs.includes('Fastest'),
            lowest_cost: prefs.includes('Lowest cost'),
            wheelchair_accessible: prefs.includes('Wheelchair accessible'),
            board_station: boardCode,
            dest_station: destCode,
          }
        })
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', content: chatInput.trim() }]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'This recommendation is based on a balanced weighting of your preferences. The train is currently ranked higher because it costs less and has a lower estimated CO₂, even though it requires more travel time.'
      }]);
    }, 800);
  };

  const handleProceedToCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      navigate('/trip-summary', {
        state: {
          transportResult: selectedOption,
        }
      });
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F6F3] font-sans">
      <div className="flex flex-1 max-w-7xl w-full mx-auto relative pt-4 md:pt-6">

        {/* LEFT SIDEBAR: Persistent Filters */}
        <aside className="hidden lg:block w-72 shrink-0 pr-6 pb-12">
          <form onSubmit={handleApplyFilters} className="sticky top-24 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#26382D] uppercase tracking-wider mb-3">Travel Mode</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3"><input type="checkbox" defaultChecked className="w-4 h-4 text-[#7C9278] border-[#D8C9BE] rounded" /><span className="text-[#26382D] text-sm">Car</span></label>
                <label className="flex items-center gap-3"><input type="checkbox" defaultChecked className="w-4 h-4 text-[#7C9278] border-[#D8C9BE] rounded" /><span className="text-[#26382D] text-sm">Train</span></label>
                <label className="flex items-center gap-3"><input type="checkbox" defaultChecked className="w-4 h-4 text-[#7C9278] border-[#D8C9BE] rounded" /><span className="text-[#26382D] text-sm">Flight</span></label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#26382D] uppercase tracking-wider mb-3">Route Preference</h3>
              <div className="space-y-3">
                {[
                  { id: 'Best route', label: 'Best route', desc: 'Balanced journey recommendations' },
                  { id: 'Fastest', label: 'Fastest', desc: 'Direct cabs to minimise travel time' },
                  { id: 'Lowest cost', label: 'Lowest cost', desc: 'Public transit to minimise cost' },
                  { id: 'Lowest CO₂', label: 'Lowest CO₂', desc: 'Public transit to reduce emissions' },
                  { id: 'Less walking', label: 'Less walking', desc: 'Use cabs to avoid walking to transit' },
                  { id: 'Fewer transfers', label: 'Fewer transfers', desc: 'Direct door-to-station cabs' }
                ].map(pref => (
                  <label key={pref.id} className="flex items-start gap-3 cursor-pointer group">
                    <div className="pt-0.5">
                      <input type="checkbox" name="routePref" value={pref.id} defaultChecked={pref.id === 'Best route'} className="w-4 h-4 text-[#7C9278] border-[#D8C9BE] rounded cursor-pointer" />
                    </div>
                    <div>
                      <div className="text-[#26382D] text-sm font-medium">{pref.label}</div>
                      <div className="text-[#7C9278] text-xs leading-tight">{pref.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#26382D] uppercase tracking-wider mb-3">Accessibility</h3>
              <div className="space-y-3">
                {[
                  { id: 'Step-free', label: 'Step-free', desc: 'Requires flat access throughout' },
                  { id: 'Wheelchair accessible', label: 'Wheelchair accessible', desc: 'Routes via cabs and accessible stations' }
                ].map(pref => (
                  <label key={pref.id} className="flex items-start gap-3 cursor-pointer group">
                    <div className="pt-0.5">
                      <input type="checkbox" name="routePref" value={pref.id} className="w-4 h-4 text-[#7C9278] border-[#D8C9BE] rounded cursor-pointer" />
                    </div>
                    <div>
                      <div className="text-[#26382D] text-sm font-medium">{pref.label}</div>
                      <div className="text-[#7C9278] text-xs leading-tight">{pref.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {selectedMode === 'CAR' && (
              <div>
                <h3 className="text-sm font-bold text-[#26382D] uppercase tracking-wider mb-3">Route Options (Car)</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3"><input type="checkbox" name="avoidTolls" className="w-4 h-4 text-[#7C9278] border-[#D8C9BE] rounded" /><span className="text-[#26382D] text-sm">Avoid Tolls</span></label>
                  <label className="flex items-center gap-3"><input type="checkbox" name="avoidHighways" className="w-4 h-4 text-[#7C9278] border-[#D8C9BE] rounded" /><span className="text-[#26382D] text-sm">Avoid Highways</span></label>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-[#26382D] uppercase tracking-wider mb-3">Budget</h3>
              <input type="text" placeholder="₹ ______" className="w-full border border-[#D8C9BE] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#7C9278]" />
            </div>

            <button type="submit" className="w-full bg-[#2563EB] text-white py-3 rounded-xl font-medium mt-4 hover:bg-blue-700 transition-colors">
              Apply Filters
            </button>
          </form>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 px-4 lg:px-0 pb-12 w-full">

          {step === 'TRIP_FORM' && (
            <div className="max-w-2xl bg-white border border-[#D8C9BE] rounded-2xl shadow-sm p-6 sm:p-8">
              <h2 className="font-serif text-2xl text-[#26382D] mb-6">Let's plan your journey</h2>
              <form onSubmit={handleTripSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1.5">From</label>
                  <input name="origin" defaultValue="Borivali, Mumbai" className="w-full border-b-2 border-[#D8C9BE] py-2 focus:border-[#26382D] outline-none text-[#26382D]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1.5">To</label>
                  <input name="destination" defaultValue={location.state?.hotelResult?.city || "Candolim, Goa"} className="w-full border-b-2 border-[#D8C9BE] py-2 focus:border-[#26382D] outline-none text-[#26382D]" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1.5">Travel Date</label>
                    <input type="date" name="date" defaultValue="2026-09-27" className="w-full border-b-2 border-[#D8C9BE] py-2 outline-none text-[#26382D]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1.5">Leave After</label>
                    <input type="time" name="time" defaultValue="06:00" className="w-full border-b-2 border-[#D8C9BE] py-2 outline-none text-[#26382D]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-3">Passengers</label>
                  <div className="flex gap-4">
                    <div className="flex-1"><label className="block text-xs text-[#7C9278] mb-1">Adults</label><input type="number" name="adults" defaultValue={2} className="w-full border-b-2 border-[#D8C9BE] py-2 outline-none" /></div>
                    <div className="flex-1"><label className="block text-xs text-[#7C9278] mb-1">Children</label><input type="number" name="children" defaultValue={0} className="w-full border-b-2 border-[#D8C9BE] py-2 outline-none" /></div>
                    <div className="flex-1"><label className="block text-xs text-[#7C9278] mb-1">Seniors</label><input type="number" name="seniors" defaultValue={1} className="w-full border-b-2 border-[#D8C9BE] py-2 outline-none" /></div>
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#26382D] text-white py-3 rounded-xl font-medium mt-4 hover:bg-[#1a261f]">Continue</button>
              </form>
            </div>
          )}

          {step !== 'TRIP_FORM' && trip && (
            <div className="mb-6 flex items-center justify-between bg-white border border-[#D8C9BE] p-4 rounded-2xl shadow-sm">
              <div>
                <div className="font-medium text-[#26382D]">{trip.origin} &rarr; {trip.destination}</div>
                <div className="text-sm text-[#7C9278] mt-0.5">{trip.date} · {trip.time} · {trip.adults} Adults, {trip.children} Children, {trip.seniors} Senior</div>
              </div>
              <button onClick={() => setStep('TRIP_FORM')} className="text-sm text-[#26382D] underline font-medium">Edit</button>
            </div>
          )}

          {step === 'MODE_SELECT' && (
            <div className="max-w-2xl">
              <h2 className="font-serif text-2xl text-[#26382D] mb-6">How would you like to travel?</h2>
              <div className="grid grid-cols-3 gap-4">
                <button onClick={() => handleModeSelect('CAR')} className="flex flex-col items-center justify-center gap-3 p-8 bg-white border border-[#D8C9BE] rounded-2xl hover:border-[#7C9278] transition-colors shadow-sm">
                  <Car className="w-10 h-10 text-[#26382D]" />
                  <span className="font-semibold text-[#26382D] tracking-wide">CAR</span>
                </button>
                <button onClick={() => handleModeSelect('TRAIN')} className="flex flex-col items-center justify-center gap-3 p-8 bg-white border border-[#D8C9BE] rounded-2xl hover:border-[#7C9278] transition-colors shadow-sm">
                  <Train className="w-10 h-10 text-[#26382D]" />
                  <span className="font-semibold text-[#26382D] tracking-wide">TRAIN</span>
                </button>
                <button onClick={() => handleModeSelect('FLIGHT')} className="flex flex-col items-center justify-center gap-3 p-8 bg-white border border-[#D8C9BE] rounded-2xl hover:border-[#7C9278] transition-colors shadow-sm">
                  <Plane className="w-10 h-10 text-[#26382D]" />
                  <span className="font-semibold text-[#26382D] tracking-wide">FLIGHT</span>
                </button>
              </div>
            </div>
          )}

          {step === 'MODE_FORM' && (
            <div className="max-w-2xl bg-white border border-[#D8C9BE] p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-6 border-b border-[#F8F6F3] pb-4">
                <button onClick={() => setStep('MODE_SELECT')} className="text-[#7C9278] hover:text-[#26382D]">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="font-serif text-2xl text-[#26382D] capitalize">{selectedMode?.toLowerCase()} Journey</h2>
              </div>
              <form onSubmit={handleSearch} className="space-y-6">
                {selectedMode === 'TRAIN' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <StationAutocomplete label="Boarding Station" name="board" defaultValue="LTT" />
                      </div>
                      <div>
                        <StationAutocomplete label="Destination Station" name="dest" defaultValue="MAO" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1">Class</label>
                        <select name="class" className="w-full border-b-2 border-[#D8C9BE] py-2 bg-transparent outline-none">
                          <option>Any</option>
                          <option>2A (AC 2 Tier)</option>
                          <option>SL (Sleeper)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1">Travel Date</label>
                        <input name="date" type="date" defaultValue="2026-09-27" className="w-full border-b-2 border-[#D8C9BE] py-2 outline-none" />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-[#26382D] text-white py-3 rounded-xl font-medium mt-4 hover:bg-[#1a261f]">Search Trains</button>
                  </>
                )}
                {selectedMode === 'FLIGHT' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <AirportAutocomplete label="Departure Airport" name="board" defaultValue="BOM" />
                      </div>
                      <div>
                        <AirportAutocomplete label="Arrival Airport" name="dest" defaultValue="GOI" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1">Departure Preference</label>
                        <select className="w-full border-b-2 border-[#D8C9BE] py-2 bg-transparent outline-none"><option>Morning</option></select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1">Travel Date</label>
                        <input name="date" type="date" defaultValue="2026-09-27" className="w-full border-b-2 border-[#D8C9BE] py-2 outline-none" />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-[#26382D] text-white py-3 rounded-xl font-medium mt-4 hover:bg-[#1a261f]">Search Flights</button>
                  </>
                )}
                {selectedMode === 'CAR' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1">Vehicle</label>
                        <select className="w-full border-b-2 border-[#D8C9BE] py-2 bg-transparent outline-none"><option>Private car</option></select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1">Fuel Type</label>
                        <select name="fuel_type" onChange={(e) => e.currentTarget.form?.requestSubmit()} className="w-full border-b-2 border-[#D8C9BE] py-2 bg-transparent outline-none"><option value="petrol">Petrol</option><option value="ev">EV</option></select>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-[#26382D] text-white py-3 rounded-xl font-medium mt-4 hover:bg-[#1a261f]">Calculate Route</button>
                  </>
                )}
              </form>
            </div>
          )}

          {step === 'RESULTS' && (
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setStep('MODE_FORM')} className="text-[#7C9278] hover:text-[#26382D]">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="font-serif text-2xl text-[#26382D] capitalize">{selectedMode?.toLowerCase()} Results</h2>
              </div>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-[#7C9278] animate-spin mb-4" />
                  <p className="text-[#26382D] font-medium">Building your door-to-door journeys...</p>
                </div>
              ) : (
                <>
                  {(() => {
                    const flightWithInsights = results.find(r => r.mode === 'flight' && r.provider_details?.price_insights);
                    const priceInsights = flightWithInsights?.provider_details?.price_insights;
                    if (priceInsights) {
                      return <FlightPriceInsights insights={priceInsights} destination={trip?.destination} />;
                    }
                    return null;
                  })()}
                  {results.length === 0 ? (
                    <div className="bg-white border border-[#D8C9BE] rounded-2xl p-8 text-center text-[#7C9278]">
                      No routes found.
                    </div>
                  ) : results.map(opt => {
                    if (opt.mode === 'train') {
                      return <TrainCard key={opt.id} option={opt} onSelect={() => handleSelectOption(opt)} />;
                    } else if (opt.mode === 'flight') {
                      return <FlightCard key={opt.id} option={opt} onSelect={() => handleSelectOption(opt)} />;
                    }

                    // Fallback for car or others
                    return (
                      <div key={opt.id} className="bg-white border border-[#D8C9BE] rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                        <div className="flex-1 p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Car className="w-5 h-5 text-[#26382D]" />
                              <h4 className="font-bold text-[#26382D] text-lg">{opt.provider_details?.train_number || opt.provider_details?.flight_number || (opt.mode + " Route")}</h4>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-xl font-semibold text-[#26382D]">{"Departure"}</span>
                              <span className="text-sm text-[#7C9278]">{opt.segments?.[0]?.origin?.name?.split(' ')[0] || "Origin"}</span>
                            </div>
                            <div className="flex-1 px-4 flex flex-col items-center justify-center relative">
                              <span className="text-xs text-[#7C9278] mb-1">{Math.floor(opt.duration_minutes / 60)}h {opt.duration_minutes % 60}m</span>
                              <div className="w-full border-t-2 border-dashed border-[#D8C9BE] relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] text-[#A99587]">
                                  {opt.segments?.find((s: any) => s.details)?.details?.train_name || opt.segments?.find((s: any) => s.details)?.details?.airline || 'Transfers: ' + opt.transfer_count}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xl font-semibold text-[#26382D]">{"Arrival"}</span>
                              <span className="text-sm text-[#7C9278]">{opt.segments?.[opt.segments?.length - 1]?.destination?.name?.split(' ')[0] || "Dest"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="w-full md:w-48 bg-[#F8F6F3] p-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#D8C9BE]">
                          <div>
                            <div className="text-xl font-bold text-[#26382D] mb-1">₹{opt.cost_inr?.toFixed(2) || '0.00'}</div>
                            <div className="text-xs text-[#7C9278] flex items-center gap-1"><Leaf className="w-3 h-3" /> {opt.emissions?.co2e_kg?.toFixed(1) || 0} kg CO₂e</div>
                          </div>
                          <button onClick={() => handleSelectOption(opt)} className="w-full mt-4 bg-[#26382D] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#1a261f]">
                            View Journey
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {step === 'BREAKDOWN' && selectedOption && (
            <div className="w-full">
              {/* Digital Twin Panel overlay */}
              {showDigitalTwin && selectedOption.mode === 'car' && (
                <DigitalTwinPanel
                  carOption={selectedOption}
                  onClose={() => setShowDigitalTwin(false)}
                />
              )}

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep('RESULTS')} className="text-[#7C9278] hover:text-[#26382D]">
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <h2 className="font-serif text-2xl text-[#26382D]">Complete Journey</h2>
                </div>
                <div className="flex items-center gap-3">
                  {selectedOption.mode === 'car' && (
                    <button
                      onClick={() => setShowDigitalTwin(true)}
                      className="flex items-center gap-2 bg-white border border-[#D8C9BE] text-[#26382D] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#EAF0EB] hover:border-[#7C9278] transition-colors shadow-sm"
                    >
                      ☁️ <span>Weather Analysis</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Recommendation Analysis Box */}
              {(() => {
                const co2 = selectedOption.emissions?.co2e_kg ?? 0;
                const cost = selectedOption.cost_inr ?? 0;
                const walkKm = (selectedOption.total_walking_m ?? 0) / 1000;
                const transfers = selectedOption.transfer_count ?? 0;
                const durationH = Math.floor(selectedOption.duration_minutes / 60);
                const durationM = selectedOption.duration_minutes % 60;
                const reasons = selectedOption.recommendation_reasons || [];
                const tradeoffs = selectedOption.trade_off_summary || [];
                const firstMile = selectedOption.segments?.find((s: any) => s.segment_type === 'first_mile');
                const lastMile = selectedOption.segments?.find((s: any) => s.segment_type === 'last_mile');
                const usesTransit = firstMile?.mode === 'TRANSIT' || lastMile?.mode === 'TRANSIT';
                return (
                  <div className="bg-[#EAF0EB] border border-[#C5D9CB] rounded-2xl p-5 sm:p-6 mb-8 flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                      <h3 className="flex items-center gap-2 font-bold text-[#1F4029] mb-3"><Info className="w-5 h-5" /> Why this route?</h3>
                      <ul className="space-y-1.5 text-sm">
                        {usesTransit && <li className="flex items-start gap-2 text-[#1F4029]"><span className="text-green-600 font-bold">✓</span> Uses public transit for first/last mile — lower emissions</li>}
                        {co2 < 30 && <li className="flex items-start gap-2 text-[#1F4029]"><span className="text-green-600 font-bold">✓</span> Low estimated CO₂: {co2.toFixed(1)} kg total journey</li>}
                        {cost < 3000 && <li className="flex items-start gap-2 text-[#1F4029]"><span className="text-green-600 font-bold">✓</span> Budget-friendly: ₹{cost.toFixed(0)} door-to-door</li>}
                        {walkKm > 0 && <li className="flex items-start gap-2 text-[#1F4029]"><span className="text-[#A99587] font-bold">ℹ</span> ~{walkKm.toFixed(1)} km walking total</li>}
                        {transfers > 2 && <li className="flex items-start gap-2 text-[#1F4029]"><span className="text-amber-600 font-bold">⚠</span> {transfers} transfers — more than a direct option</li>}
                        {reasons.map((r: string, i: number) => <li key={i} className="flex items-start gap-2 text-[#3A5043]"><span className="text-green-600 font-bold">✓</span>{r}</li>)}
                        {tradeoffs.map((t: string, i: number) => <li key={i} className="flex items-start gap-2 text-[#3A5043]"><span className="text-amber-600 font-bold">⚠</span>{t}</li>)}
                      </ul>
                    </div>
                    <div className="w-full sm:w-44 shrink-0 space-y-2 text-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between text-[#1F4029]"><span>Total Time</span><strong>{durationH}h {durationM}m</strong></div>
                        <div className="flex justify-between text-[#1F4029] border-t border-[#C5D9CB] pt-2"><span>Total Cost</span><strong>₹{cost.toFixed(0)}</strong></div>
                        <div className="flex justify-between text-[#1F4029] border-t border-[#C5D9CB] pt-2"><span>CO₂</span><strong>{co2.toFixed(1)} kg</strong></div>
                        <div className="flex justify-between text-[#1F4029] border-t border-[#C5D9CB] pt-2"><span>Walking</span><strong>{walkKm.toFixed(1)} km</strong></div>
                        <div className="flex justify-between text-[#1F4029] border-t border-[#C5D9CB] pt-2"><span>Transfers</span><strong>{transfers}</strong></div>
                      </div>
                      <button
                        onClick={handleProceedToCheckout}
                        disabled={isCheckingOut}
                        className="mt-4 w-full bg-[#26382D] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1a261f] transition-colors disabled:opacity-50"
                      >
                        {isCheckingOut ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm">
                              {selectedOption?.mode === 'flight' ? 'Confirming price with airline...' : 'Confirming price...'}
                            </span>
                          </>
                        ) : (
                          <>Proceed to Book <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Door-to-door layout with Map */}
              <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
                {/* Timeline */}
                <div className="flex-1 w-full xl:max-w-md bg-white border border-[#D8C9BE] rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 bg-[#F8F6F3] border-b border-[#D8C9BE]">
                    <h3 className="font-bold text-[#26382D] uppercase tracking-wider text-xs">Your Journey</h3>
                  </div>
                  <div className="p-4 lg:p-6">
                    {(() => {
                      const firstMile = selectedOption.segments.find((s: any) => s.segment_type === 'first_mile');
                      const mainSeg = selectedOption.segments.find((s: any) => s.segment_type === 'main');
                      const lastMile = selectedOption.segments.find((s: any) => s.segment_type === 'last_mile');

                      const renderSubSteps = (segment: any, title: string) => {
                        if (!segment) return null;

                        // MAIN TRAIN
                        if (segment.segment_type === 'main' && segment.mode === 'TRAIN') {
                          return (
                            <div className="mb-6 relative">
                              <div className="bg-[#26382D] text-white px-5 py-2 text-sm font-bold tracking-wider rounded-t-xl flex justify-between items-center">
                                <span className="flex items-center gap-2"><Train className="w-4 h-4" /> {segment.origin?.name?.split(' ')[0] || 'START'} &rarr; {segment.destination?.name?.split(' ')[0] || 'END'}</span>
                              </div>
                              <div className={`bg-white border-x border-b p-5 rounded-b-xl shadow-sm cursor-pointer transition-colors ${selectedSegmentId === segment.id ? 'border-[#7C9278] ring-1 ring-[#7C9278]' : 'border-[#D8C9BE] hover:border-[#7C9278]'}`} onClick={() => setSelectedSegmentId(segment.id)}>
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h4 className="font-bold text-[#26382D] text-lg">{segment.details?.train_number || ''} {segment.details?.train_name || 'Train'}</h4>
                                    <div className="text-xs text-[#7C9278]">{segment.details?.classes?.join(' • ')}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-[#26382D] text-lg">₹{segment.cost_inr}</div>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium text-[#26382D] mb-4">
                                  <div className="text-left w-20">
                                    <div className="text-lg">{segment.details?.departure_time || segment.origin?.time || ''}</div>
                                    <div className="text-xs text-[#7C9278]">{segment.origin?.name}</div>
                                  </div>
                                  <div className="flex-1 px-2 text-center">
                                    <div className="text-xs text-[#7C9278] mb-1">{Math.floor(segment.duration_minutes / 60)}h {segment.duration_minutes % 60}m</div>
                                    <div className="w-full border-t border-dashed border-[#D8C9BE]"></div>
                                    <div className="text-xs text-[#A99587] mt-1">{segment.distance_km?.toFixed(0)} km</div>
                                  </div>
                                  <div className="text-right w-20">
                                    <div className="text-lg">{segment.details?.arrival_time || segment.destination?.time || ''}</div>
                                    <div className="text-xs text-[#7C9278]">{segment.destination?.name}</div>
                                  </div>
                                </div>
                                <div className="flex gap-4 pt-3 border-t border-[#F8F6F3]">
                                  <button className="text-sm font-semibold text-[#2563EB] hover:underline">View train details</button>
                                  {segment.details?.live_status && <button className="text-sm font-semibold text-green-600 hover:underline">Track live</button>}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // MAIN DRIVE (car-only journey — single segment covering origin → destination)
                        if (segment.segment_type === 'main' && segment.mode === 'DRIVE') {
                          const dh = Math.floor(segment.duration_minutes / 60);
                          const dm = segment.duration_minutes % 60;
                          return (
                            <div className="mb-6">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C9278] uppercase tracking-wider mb-3">
                                <Car className="w-4 h-4" /> Your Route
                              </div>
                              <div
                                onClick={() => { setSelectedSegmentId(segment.id); setSelectedSubStep(null); }}
                                className={`relative pl-14 pr-4 py-5 cursor-pointer rounded-2xl transition-all border shadow-sm ${selectedSegmentId === segment.id ? 'bg-[#FEF3C7] border-[#f59e0b] ring-1 ring-[#f59e0b]' : 'bg-white border-[#D8C9BE] hover:bg-[#FEF9EE]'}`}
                              >
                                <div className="absolute left-4 top-5 text-[#26382D]">
                                  <Car className="w-6 h-6" />
                                </div>
                                <div className="font-bold text-[#26382D] text-base">{segment.origin?.name}</div>
                                <div className="flex items-center gap-2 my-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#D8C9BE]" />
                                  <div className="flex-1 border-t border-dashed border-[#D8C9BE]" />
                                  <span className="text-xs font-semibold text-[#7C9278] px-2">{dh > 0 ? `${dh}h ` : ''}{dm}m · {segment.distance_km?.toFixed(0)} km</span>
                                  <div className="flex-1 border-t border-dashed border-[#D8C9BE]" />
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#26382D]" />
                                </div>
                                <div className="font-bold text-[#26382D] text-base">{segment.destination?.name}</div>
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F8F6F3] text-xs text-[#7C9278]">
                                  <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5 text-[#A99587]" /> Est. ₹{segment.cost_inr?.toFixed(0) || (segment.distance_km * 12).toFixed(0)}</span>
                                  <span>·</span>
                                  <span className="flex items-center gap-1"><Leaf className="w-3.5 h-3.5 text-[#7C9278]" /> {segment.co2_kg?.toFixed(1)} kg CO₂ (estimated)</span>
                                </div>
                                {selectedSegmentId === segment.id && <div className="mt-2 flex items-center gap-1 text-xs text-[#f59e0b] font-medium"><Navigation className="w-3.5 h-3.5" /> Route shown on map</div>}
                              </div>
                            </div>
                          );
                        }

                        // FLIGHT MAIN
                        if (segment.segment_type === 'main' && segment.mode === 'FLIGHT') {
                          return (
                            <div className="mb-6 relative" onClick={() => setSelectedSegmentId(segment.id)}>
                              <div className={`bg-white border p-5 rounded-xl shadow-sm cursor-pointer transition-colors ${selectedSegmentId === segment.id ? 'border-[#7C9278] ring-1 ring-[#7C9278] bg-[#F8F6F3]' : 'border-[#D8C9BE] hover:border-[#7C9278]'}`}>
                                <div className="flex items-center gap-2 font-bold text-[#26382D] text-lg mb-2">
                                  <Plane className="w-5 h-5 text-[#2563EB]" /> Flight {segment.details?.flight_number || ''}
                                </div>
                                <div className="text-sm text-[#7C9278]">{segment.origin?.name} &rarr; {segment.destination?.name}</div>
                                <div className="text-sm font-semibold text-[#26382D] mt-2">{Math.floor(segment.duration_minutes / 60)}h {segment.duration_minutes % 60}m</div>
                              </div>
                            </div>
                          );
                        }

                        // FIRST MILE / LAST MILE / DRIVE
                        const hasSubsteps = segment.sub_steps && segment.sub_steps.length > 0;
                        const isDrive = segment.mode === 'DRIVE';
                        const modeIcon = isDrive ? <Car className="w-5 h-5" /> : segment.mode === 'TRANSIT' ? <Bus className="w-5 h-5" /> : <Footprints className="w-5 h-5" />;
                        const modeLabel = isDrive ? 'Cab / Car' : segment.mode === 'TRANSIT' ? 'Public Transit' : 'Walk';

                        return (
                          <div className="mb-6">
                            <div className="text-xs font-bold text-[#7C9278] uppercase tracking-wider mb-3">{title}</div>

                            {/* DRIVE: single clean summary card — no sub-steps */}
                            {isDrive && (
                              <div
                                onClick={() => { setSelectedSegmentId(segment.id); setSelectedSubStep(null); }}
                                className={`relative pl-12 pr-4 py-4 cursor-pointer rounded-xl transition-all border ${selectedSegmentId === segment.id && !selectedSubStep ? 'bg-[#FEF3C7] border-[#f59e0b] shadow-sm' : 'bg-white border-[#D8C9BE] hover:bg-[#FEF9EE]'}`}
                              >
                                <div className="absolute left-4 top-5 text-[#26382D]">
                                  <Car className="w-5 h-5" />
                                </div>
                                <div className="font-semibold text-[#26382D]">Cab / Car</div>
                                <div className="text-sm text-[#3A5043] mt-0.5">{segment.origin?.name} → {segment.destination?.name}</div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-[#7C9278]">
                                  <span>{Math.floor(segment.duration_minutes / 60) > 0 ? `${Math.floor(segment.duration_minutes / 60)}h ` : ''}{segment.duration_minutes % 60}m</span>
                                  <span>•</span>
                                  <span>{segment.distance_km?.toFixed(1)} km</span>
                                  {segment.co2_kg != null && <><span>•</span><span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> {segment.co2_kg.toFixed(1)} kg CO₂</span></>}
                                </div>
                                {segment.co2_kg != null && (
                                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 font-medium">
                                    <Info className="w-3.5 h-3.5" /> Emissions estimated · Switch to Lowest CO₂ for greener options
                                  </div>
                                )}
                              </div>
                            )}

                            {/* TRANSIT: expandable sub-steps with per-step map focus */}
                            {!isDrive && !hasSubsteps && (
                              <div
                                onClick={() => { setSelectedSegmentId(segment.id); setSelectedSubStep(null); }}
                                className={`relative pl-12 pr-4 py-4 cursor-pointer rounded-xl transition-all border ${selectedSegmentId === segment.id ? 'bg-[#EAF0EB] border-[#7C9278]' : 'bg-white border-[#D8C9BE] hover:bg-[#F8F6F3]'}`}
                              >
                                <div className="absolute left-4 top-5 text-[#26382D]">{modeIcon}</div>
                                <div className="font-medium text-[#26382D]">{modeLabel}</div>
                                <div className="text-sm text-[#3A5043]">{segment.origin?.name} → {segment.destination?.name}</div>
                                <div className="text-xs text-[#7C9278] mt-1">{Math.floor(segment.duration_minutes / 60) > 0 ? `${Math.floor(segment.duration_minutes / 60)}h ` : ''}{segment.duration_minutes % 60}m • {segment.distance_km?.toFixed(1)} km</div>
                              </div>
                            )}

                            {!isDrive && hasSubsteps && (
                              <div
                                className="relative rounded-xl border border-[#D8C9BE] bg-white overflow-hidden"
                                onClick={() => { setSelectedSegmentId(segment.id); setSelectedSubStep(null); }}
                              >
                                {/* Connector line */}
                                <div className="absolute top-10 bottom-10 left-[28px] w-[2px] bg-[#D8C9BE]" />

                                {/* Origin dot */}
                                <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                                  <div className="w-3 h-3 rounded-full bg-[#26382D] border-2 border-white shadow z-10 shrink-0" />
                                  <span className="text-sm font-semibold text-[#26382D]">{segment.origin?.name}</span>
                                </div>

                                {segment.sub_steps.map((step: any, i: number) => {
                                  const isWalk = step.travelMode === 'WALK';
                                  const vType = step.transitDetails?.transitLine?.vehicle?.type || 'Transit';
                                  const lineName = step.transitDetails?.transitLine?.name || '';
                                  const modeTitle = isWalk ? 'Walk' : lineName ? `${vType} ${lineName}` : vType;
                                  const instruction = step.navigationInstruction?.instructions || modeTitle;
                                  const duration = step.localizedValues?.staticDuration?.text || '';
                                  const dist = step.localizedValues?.distance?.text || '';
                                  const stepPolyline = step.polyline?.encodedPolyline || '';
                                  const isStepSelected = selectedSubStep?.polyline === stepPolyline && stepPolyline;

                                  return (
                                    <div
                                      key={i}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSegmentId(segment.id);
                                        if (stepPolyline) {
                                          setSelectedSubStep({ polyline: stepPolyline, label: modeTitle });
                                        } else {
                                          setSelectedSubStep(null);
                                        }
                                      }}
                                      className={`relative pl-12 pr-4 py-3 cursor-pointer transition-colors border-t border-[#F8F6F3] ${isStepSelected ? (isWalk ? 'bg-[#F0FDF4]' : 'bg-[#EFF6FF]') : 'hover:bg-[#F8F6F3]'
                                        }`}
                                    >
                                      <div className={`absolute left-[22px] top-[18px] w-3 h-3 rounded-full border-2 border-white z-10 ${isWalk ? 'bg-[#22c55e]' : 'bg-[#2563EB]'
                                        }`} />
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <div className="font-semibold text-[#26382D] capitalize text-sm">{modeTitle}</div>
                                          <div className="text-xs text-[#3A5043] mt-0.5" dangerouslySetInnerHTML={{ __html: instruction }} />
                                        </div>
                                        <div className="text-right shrink-0">
                                          <div className="text-sm font-semibold text-[#26382D]">{duration}</div>
                                          <div className="text-xs text-[#7C9278]">{dist}</div>
                                        </div>
                                      </div>
                                      {isStepSelected && (
                                        <div className="mt-1.5 text-xs text-[#2563EB] font-medium">↑ Focused on map</div>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Destination dot */}
                                <div className="flex items-center gap-3 px-4 pb-4 pt-2">
                                  <div className="w-3 h-3 rounded-full bg-[#7C9278] border-2 border-white shadow z-10 shrink-0" />
                                  <span className="text-sm font-semibold text-[#26382D]">{segment.destination?.name}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      };

                      // For car-only journey (no first/last mile), initialize map on main segment
                      const isCarOnly = selectedOption.mode === 'car' && !firstMile && !lastMile;
                      if (isCarOnly && mainSeg && selectedSegmentId === null) {
                        // Auto-select the main segment on first render so the map shows it
                        setTimeout(() => setSelectedSegmentId(mainSeg.id), 50);
                      }

                      return (
                        <>
                          {renderSubSteps(firstMile, "First Mile")}
                          {renderSubSteps(mainSeg, "Main Transport")}
                          {renderSubSteps(lastMile, "Last Mile")}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Map — focuses on selected sub-step polyline OR full segment geometry */}
                <div className="flex-1 w-full xl:w-auto h-[420px] xl:h-[auto] xl:min-h-[640px] bg-[#EAF0EB] rounded-2xl overflow-hidden border border-[#D8C9BE] sticky top-24 flex flex-col">
                  {selectedSubStep && (
                    <div className="flex items-center justify-between px-4 py-2 bg-[#26382D] text-white text-xs font-semibold">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedSubStep.label}</span>
                      <button onClick={() => setSelectedSubStep(null)} className="text-white/70 hover:text-white underline">Show full journey</button>
                    </div>
                  )}
                  <div className="flex-1">
                    <RouteMap
                      center={(() => {
                        const firstSeg = selectedOption.segments?.[0];
                        if (firstSeg?.origin?.lat && firstSeg?.origin?.lng) {
                          return { lat: firstSeg.origin.lat, lng: firstSeg.origin.lng };
                        }
                        return { lat: 19.229, lng: 72.857 }; // fallback Mumbai
                      })()}
                      zoom={selectedOption.mode === 'car' ? 6 : 10}
                      routes={
                        selectedSubStep
                          ? [{ id: 'substep', encodedPolyline: selectedSubStep.polyline, color: '#2563EB', weight: 6, isSelected: true }]
                          : selectedOption.segments.filter((s: any) => s.geometry).map((s: any) => {
                            const modeColor =
                              s.mode === 'TRAIN' ? '#1e3a5f' :
                                s.mode === 'WALK' ? '#22c55e' :
                                  s.mode === 'TRANSIT' ? '#8b5cf6' :
                                    s.mode === 'DRIVE' ? '#2563EB' : '#7C9278';
                            return {
                              id: s.id,
                              encodedPolyline: typeof s.geometry === 'string' ? s.geometry : undefined,
                              geoJson: typeof s.geometry === 'object' ? s.geometry : undefined,
                              color: modeColor,
                              weight: s.segment_type === 'main' ? 7 : 5,
                              isSelected: selectedSegmentId === s.id || selectedOption.mode === 'car'
                            };
                          })
                      }
                      markers={selectedSubStep ? [] : [
                        ...(selectedOption.segments?.[0]?.origin?.lat && selectedOption.segments?.[0]?.origin?.lng ? [{
                          id: 'start',
                          position: { lat: selectedOption.segments[0].origin.lat, lng: selectedOption.segments[0].origin.lng },
                          label: 'A'
                        }] : []),
                        ...(selectedOption.segments?.[selectedOption.segments.length - 1]?.destination?.lat && selectedOption.segments?.[selectedOption.segments.length - 1]?.destination?.lng ? [{
                          id: 'end',
                          position: { lat: selectedOption.segments[selectedOption.segments.length - 1].destination.lat, lng: selectedOption.segments[selectedOption.segments.length - 1].destination.lng },
                          label: 'B'
                        }] : [])
                      ]}
                      selectedSegmentId={selectedSubStep ? 'substep' : (selectedSegmentId || undefined)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}


        </main>
      </div>

      {/* FLOATING CHAT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Window */}
        {isChatOpen && (
          <div className="bg-white w-[350px] sm:w-[400px] h-[500px] max-h-[70vh] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#D8C9BE] flex flex-col mb-4 overflow-hidden">
            {/* Header */}
            <div className="bg-[#26382D] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <div className="font-semibold text-sm">Clarity AI Guide</div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#F8F6F3] space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-[#7C9278] text-sm mt-8">
                  Ask me anything about your journey options!
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed border shadow-sm ${msg.role === 'user'
                      ? 'bg-[#26382D] text-white border-[#26382D] rounded-br-sm'
                      : 'bg-white text-[#26382D] border-[#D8C9BE] rounded-bl-sm'
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Suggestions */}
            <div className="bg-white px-3 pt-3 pb-2 border-t border-[#D8C9BE] shrink-0 overflow-x-auto scrollbar-hide whitespace-nowrap flex gap-2">
              <button onClick={() => setChatInput("Why did you recommend the train?")} className="bg-[#F8F6F3] border border-[#D8C9BE] text-[#7C9278] px-3 py-1.5 rounded-full text-xs hover:bg-[#EAF0EB] transition-colors shrink-0">Why the train?</button>
              <button onClick={() => setChatInput("How did you calculate CO₂?")} className="bg-[#F8F6F3] border border-[#D8C9BE] text-[#7C9278] px-3 py-1.5 rounded-full text-xs hover:bg-[#EAF0EB] transition-colors shrink-0">How is CO₂ calc?</button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleChatSubmit} className="bg-white p-3 shrink-0">
              <div className="relative w-full">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about this journey..."
                  className="w-full bg-[#F8F6F3] border border-[#D8C9BE] rounded-full pl-4 pr-12 py-3 text-[#26382D] placeholder-[#A99587] focus:outline-none focus:border-[#7C9278] text-sm"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-[#26382D] text-white rounded-full flex items-center justify-center hover:bg-[#1a261f] disabled:opacity-50 transition-colors"
                >
                  <Navigation className="w-4 h-4 transform rotate-45" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Floating Toggle Button */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-[#26382D] text-white rounded-full shadow-[0_4px_14px_rgba(38,56,45,0.4)] flex items-center justify-center hover:bg-[#1a261f] hover:scale-105 transition-all active:scale-95"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
