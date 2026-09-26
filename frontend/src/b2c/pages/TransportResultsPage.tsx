import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../shared/components/Navbar';
import RouteMap from '../components/RouteMap';
import { 
  Train, Plane, Car, Navigation, MapPin, 
  Leaf, Sliders, ChevronRight, User, Info, MessageCircle, AlertCircle, Loader
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TransportResultsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('b2c');

  // Workflows states
  const [step, setStep] = useState<'TRIP_FORM' | 'MODE_SELECT' | 'MODE_FORM' | 'RESULTS' | 'BREAKDOWN'>('TRIP_FORM');
  const [trip, setTrip] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    setStep('RESULTS');
    
    try {
      const res = await fetch('/api/search/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: trip?.origin || "Borivali",
          destination: trip?.destination || "Hotel XYZ, Goa",
          mode: selectedMode?.toLowerCase() || "train",
          date: trip?.date || "2026-09-27"
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

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F6F3] font-sans">
      <Navbar />

      <div className="flex flex-1 max-w-7xl w-full mx-auto relative pt-4 md:pt-6">
        
        {/* LEFT SIDEBAR: Persistent Filters */}
        <aside className="hidden lg:block w-72 shrink-0 pr-6 pb-24">
          <div className="sticky top-24 space-y-6">
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
              <div className="space-y-2">
                {['Best route', 'Fastest', 'Lowest cost', 'Lowest CO₂', 'Less walking', 'Fewer transfers', 'Wheelchair accessible'].map(pref => (
                  <label key={pref} className="flex items-center gap-3"><input type="radio" name="routePref" defaultChecked={pref==='Best route'} className="w-4 h-4 text-[#7C9278] border-[#D8C9BE]" /><span className="text-[#26382D] text-sm">{pref}</span></label>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-[#26382D] uppercase tracking-wider mb-3">Accessibility</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4 text-[#7C9278] border-[#D8C9BE] rounded" /><span className="text-[#26382D] text-sm">Step-free</span></label>
                <label className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4 text-[#7C9278] border-[#D8C9BE] rounded" /><span className="text-[#26382D] text-sm">Less walking</span></label>
                <label className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4 text-[#7C9278] border-[#D8C9BE] rounded" /><span className="text-[#26382D] text-sm">Accessible transfers</span></label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#26382D] uppercase tracking-wider mb-3">Budget</h3>
              <input type="text" placeholder="₹ ______" className="w-full border border-[#D8C9BE] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#7C9278]" />
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 px-4 lg:px-0 pb-48 w-full">
          
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
                  <input name="destination" defaultValue="Hotel XYZ, Goa" className="w-full border-b-2 border-[#D8C9BE] py-2 focus:border-[#26382D] outline-none text-[#26382D]" />
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
                        <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1">Boarding Station</label>
                        <select name="board" className="w-full border-b-2 border-[#D8C9BE] py-2 bg-transparent outline-none">
                          <option>Borivali (BVI)</option>
                          <option>Bandra Terminus (BDTS)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1">Destination Station</label>
                        <select name="dest" className="w-full border-b-2 border-[#D8C9BE] py-2 bg-transparent outline-none">
                          <option>Madgaon (MAO)</option>
                          <option>Thivim (THVM)</option>
                        </select>
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
                        <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1">Departure Airport</label>
                        <select className="w-full border-b-2 border-[#D8C9BE] py-2 bg-transparent outline-none"><option>BOM / Mumbai</option></select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#7C9278] uppercase mb-1">Arrival Airport</label>
                        <select className="w-full border-b-2 border-[#D8C9BE] py-2 bg-transparent outline-none"><option>GOI / Goa</option></select>
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
                        <select className="w-full border-b-2 border-[#D8C9BE] py-2 bg-transparent outline-none"><option>Petrol</option><option>EV</option></select>
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
              ) : results.length === 0 ? (
                <div className="bg-white border border-[#D8C9BE] rounded-2xl p-8 text-center text-[#7C9278]">
                  No routes found.
                </div>
              ) : results.map(opt => (
                <div key={opt.id} className="bg-white border border-[#D8C9BE] rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                  <div className="flex-1 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {opt.mode === 'train' && <Train className="w-5 h-5 text-[#26382D]" />}
                        {opt.mode === 'flight' && <Plane className="w-5 h-5 text-[#26382D]" />}
                        {opt.mode === 'car' && <Car className="w-5 h-5 text-[#26382D]" />}
                        <h4 className="font-bold text-[#26382D] text-lg">{opt.provider_metadata?.train_number || opt.provider_metadata?.flight_number || (opt.mode + " Route")}</h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xl font-semibold text-[#26382D]">{"Departure"}</span>
                        <span className="text-sm text-[#7C9278]">{opt.segments?.[0]?.origin?.name?.split(' ')[0] || "Origin"}</span>
                      </div>
                      <div className="flex-1 px-4 flex flex-col items-center justify-center relative">
                        <span className="text-xs text-[#7C9278] mb-1">{Math.floor(opt.duration_minutes/60)}h {opt.duration_minutes%60}m</span>
                        <div className="w-full border-t-2 border-dashed border-[#D8C9BE] relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] text-[#A99587]">
                            {opt.segments?.find((s:any) => s.details)?.details?.train_name || opt.segments?.find((s:any) => s.details)?.details?.airline || 'Transfers: ' + opt.transfer_count}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xl font-semibold text-[#26382D]">{"Arrival"}</span>
                        <span className="text-sm text-[#7C9278]">{opt.segments?.[opt.segments?.length-1]?.destination?.name?.split(' ')[0] || "Dest"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-48 bg-[#F8F6F3] p-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#D8C9BE]">
                    <div>
                      <div className="text-xl font-bold text-[#26382D] mb-1">₹{opt.cost_inr}</div>
                      <div className="text-xs text-[#7C9278] flex items-center gap-1"><Leaf className="w-3 h-3"/> {opt.emissions?.co2e_kg?.toFixed(1) || 0} kg CO₂e</div>
                    </div>
                    <button onClick={() => handleSelectOption(opt)} className="w-full mt-4 bg-[#26382D] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#1a261f]">
                      View Journey
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 'BREAKDOWN' && selectedOption && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep('RESULTS')} className="text-[#7C9278] hover:text-[#26382D]">
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <h2 className="font-serif text-2xl text-[#26382D]">Complete Journey</h2>
                </div>
                <button 
                  onClick={() => navigate('/journey', { state: { result: selectedOption } })}
                  className="bg-[#26382D] text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-[#1a261f]"
                >
                  Select & Continue
                </button>
              </div>

              {/* Recommendation Analysis Box */}
              <div className="bg-[#EAF0EB] border border-[#C5D9CB] rounded-2xl p-5 sm:p-6 mb-8 flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="flex items-center gap-2 font-bold text-[#1F4029] mb-2"><Info className="w-5 h-5"/> Why this route is recommended</h3>
                  <p className="text-sm text-[#3A5043] leading-relaxed mb-4">
                    This option stays within your transport budget and has a lower estimated CO₂ impact than the available flight options.
                    <br/><br/>
                    <strong>Trade-off:</strong> It takes longer and requires additional transfers.
                  </p>
                </div>
                <div className="w-full sm:w-48 shrink-0 space-y-2 text-sm">
                  <div className="flex justify-between text-[#1F4029]"><span>Time</span><strong>{Math.floor(selectedOption.duration_minutes/60)}h {selectedOption.duration_minutes%60}m</strong></div>
                  <div className="flex justify-between text-[#1F4029]"><span>Cost</span><strong>₹{selectedOption.cost_inr}</strong></div>
                  <div className="flex justify-between text-[#1F4029]"><span>CO₂e</span><strong>{selectedOption.emissions?.co2e_kg?.toFixed(1)} kg</strong></div>
                  <div className="flex justify-between text-[#1F4029]"><span>Walking</span><strong>{(selectedOption.total_walking_m/1000).toFixed(1)} km</strong></div>
                  <div className="flex justify-between text-[#1F4029]"><span>Transfers</span><strong>{selectedOption.transfer_count}</strong></div>
                </div>
              </div>

              {/* Door-to-door layout with Map */}
              <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
                {/* Timeline */}
                <div className="flex-1 w-full xl:max-w-md bg-white border border-[#D8C9BE] rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 bg-[#F8F6F3] border-b border-[#D8C9BE]">
                    <h3 className="font-bold text-[#26382D] uppercase tracking-wider text-xs">Door-to-door Segments</h3>
                  </div>
                  <div className="p-4 lg:p-6 space-y-0 relative">
                    <div className="absolute top-8 bottom-8 left-[39px] lg:left-[47px] w-[2px] bg-[#D8C9BE]" />
                    
                    {selectedOption.segments.map((seg: any) => (
                      <div 
                        key={seg.id} 
                        onClick={() => setSelectedSegmentId(seg.id)}
                        className={`relative pl-14 pr-2 py-5 cursor-pointer rounded-xl transition-all border ${selectedSegmentId === seg.id ? 'bg-[#F8F6F3] border-[#7C9278] shadow-sm' : 'border-transparent hover:bg-[#F8F6F3]/50'}`}
                      >
                        <div className={`absolute left-4 lg:left-6 top-[26px] w-[14px] h-[14px] rounded-full border-2 border-white ${seg.mode === 'WALK' ? 'bg-[#A9B8A3]' : 'bg-[#26382D]'}`} />
                        
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[#7C9278] uppercase tracking-widest">{seg.mode} • {seg.provider}</span>
                        </div>
                        <div className="font-medium text-[#26382D] text-lg leading-tight mb-2">
                          <div className="mb-0.5 text-[#7C9278] text-sm font-normal">START &rarr; <span className="font-medium text-[#26382D]">{seg.origin?.name}</span></div>
                          <div className="text-[#7C9278] text-sm font-normal">END &rarr; <span className="font-medium text-[#26382D]">{seg.destination?.name}</span></div>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#7C9278] mt-3 bg-white p-3 rounded-lg border border-[#D8C9BE]">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-[#A99587]">Time</span>
                            <span className="font-medium text-[#26382D]">{seg.duration_minutes >= 60 ? `${Math.floor(seg.duration_minutes/60)}h ${seg.duration_minutes%60}m` : `${seg.duration_minutes} min`}</span>
                          </div>
                          {seg.distance_km > 0 && (
                            <div className="flex flex-col border-l border-[#D8C9BE] pl-4">
                              <span className="text-[10px] uppercase font-bold text-[#A99587]">Distance</span>
                              <span className="font-medium text-[#26382D]">{seg.distance_km.toFixed(1)} km</span>
                            </div>
                          )}
                          {seg.cost_inr > 0 && (
                            <div className="flex flex-col border-l border-[#D8C9BE] pl-4">
                              <span className="text-[10px] uppercase font-bold text-[#A99587]">Cost</span>
                              <span className="font-medium text-[#26382D]">₹{seg.cost_inr}</span>
                            </div>
                          )}
                          <div className="flex flex-col border-l border-[#D8C9BE] pl-4">
                            <span className="text-[10px] uppercase font-bold text-[#A99587]">Est. CO₂</span>
                            <span className="font-medium text-[#26382D]">{seg.co2_kg?.toFixed(1) || 0} kg</span>
                          </div>
                        </div>

                        {selectedSegmentId === seg.id && seg.geometry && (
                          <div className="mt-4 flex items-start gap-3 p-3 bg-[#EAF0EB] rounded-lg">
                             <MapPin className="w-4 h-4 text-[#3A5043] shrink-0 mt-0.5" />
                             <div>
                               <div className="text-sm font-bold text-[#1F4029] mb-1">Why this segment matters</div>
                               <div className="text-xs text-[#3A5043]">This is the {seg.mode} portion connecting you through your journey. Route focused on the right.</div>
                             </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Map */}
                <div className="flex-1 w-full xl:w-auto h-[400px] xl:h-[auto] xl:min-h-[600px] bg-[#EAF0EB] rounded-2xl overflow-hidden border border-[#D8C9BE] sticky top-24">
                  <RouteMap 
                    center={{ lat: 19.229, lng: 72.857 }} 
                    zoom={10} 
                    routes={selectedOption.segments.filter((s:any) => s.geometry).map((s:any) => ({
                      id: s.id,
                      encodedPolyline: typeof s.geometry === 'string' ? s.geometry : undefined,
                      geoJson: typeof s.geometry === 'object' ? s.geometry : undefined,
                      color: s.mode === 'WALK' ? '#A9B8A3' : '#26382D',
                      isSelected: selectedSegmentId === s.id
                    }))} 
                    selectedSegmentId={selectedSegmentId || undefined} 
                  />
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* FIXED CONTEXTUAL CHAT INPUT AT BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#F8F6F3]/95 backdrop-blur-md border-t border-[#D8C9BE] z-40 pb-safe shadow-[0_-4px_24px_rgba(38,56,45,0.05)]">
        <div className="max-w-7xl mx-auto px-4 lg:px-0 lg:pl-72 flex flex-col pb-4 pt-4">
          
          {/* Chat History Container (only visible if there are messages) */}
          {chatMessages.length > 0 && (
            <div className="flex flex-col gap-3 mb-4 max-h-[30vh] overflow-y-auto px-2 scrollbar-hide">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed border ${
                    msg.role === 'user' 
                      ? 'bg-[#26382D] text-white border-[#26382D] rounded-br-sm' 
                      : 'bg-white text-[#26382D] border-[#D8C9BE] rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="relative w-full max-w-4xl mx-auto">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about this journey... (e.g. 'Why is this route cheaper?')" 
              className="w-full bg-white border border-[#D8C9BE] rounded-full pl-6 pr-14 py-4 text-[#26382D] placeholder-[#A99587] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7C9278] text-base"
            />
            <button 
              type="submit"
              disabled={!chatInput.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-[#26382D] text-white rounded-full flex items-center justify-center hover:bg-[#1a261f] disabled:opacity-50 transition-colors"
            >
              <Navigation className="w-5 h-5 transform rotate-45" />
            </button>
          </form>
          
          {/* Contextual Chips */}
          <div className="hidden sm:flex gap-2 mt-3 max-w-4xl mx-auto overflow-x-auto scrollbar-hide text-xs w-full">
            <button onClick={() => setChatInput("Why did you recommend the train?")} className="bg-white border border-[#D8C9BE] text-[#7C9278] px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-[#F8F6F3]">Why did you recommend the train?</button>
            <button onClick={() => setChatInput("How did you calculate CO₂?")} className="bg-white border border-[#D8C9BE] text-[#7C9278] px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-[#F8F6F3]">How did you calculate CO₂?</button>
            <button onClick={() => setChatInput("Why is the flight faster?")} className="bg-white border border-[#D8C9BE] text-[#7C9278] px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-[#F8F6F3]">Why is the flight faster?</button>
          </div>
        </div>
      </div>
    </div>
  );
}