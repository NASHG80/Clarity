import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/Button';
import { Plus, Trash2, BedDouble, Users, Camera, Image as ImageIcon } from 'lucide-react';

export interface RoomData {
  id: string;
  name: string;
  capacity: string;
  bedType: string;
  size: string;
  photoUrl: string;
}

interface RoomsStepProps {
  value: RoomData[];
  onChange: (value: RoomData[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function RoomsStep({ value, onChange, onContinue, onBack }: RoomsStepProps) {
  const { t } = useTranslation();

  const addRoom = () => {
    onChange([
      ...value,
      { id: Date.now().toString(), name: '', capacity: '2', bedType: '1 Queen Bed', size: '', photoUrl: '' }
    ]);
  };

  const removeRoom = (id: string) => {
    onChange(value.filter(r => r.id !== id));
  };

  const updateRoom = (id: string, field: keyof RoomData, val: string) => {
    onChange(value.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#26382D] mb-2">Rooms</h2>
          <p className="text-sm sm:text-base text-[#26382D]/70">Add the types of rooms available at your property.</p>
        </div>
        <Button variant="outline" onClick={addRoom} className="hidden sm:flex gap-2">
          <Plus className="w-4 h-4" /> Add Room
        </Button>
      </div>

      <div className="space-y-6">
        {value.length === 0 ? (
          <div className="bg-[#F8F6F3] p-12 rounded-2xl border-2 border-dashed border-[#D8C9BE] text-center">
            <BedDouble className="w-12 h-12 text-[#26382D]/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#26382D] mb-2">No rooms added yet</h3>
            <p className="text-[#26382D]/60 mb-6 max-w-sm mx-auto">Add at least one room type so travelers know what to expect when booking.</p>
            <Button onClick={addRoom}>Add Your First Room</Button>
          </div>
        ) : (
          value.map((room, index) => (
            <div key={room.id} className="bg-white p-6 rounded-2xl shadow-sm border border-[#D8C9BE] relative group">
              <button 
                onClick={() => removeRoom(room.id)}
                className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Remove room"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              
              <h3 className="text-lg font-medium text-[#26382D] mb-4">Room {index + 1}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Photo Upload Area */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#26382D] mb-1.5">Room Photo</label>
                  {room.photoUrl ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-[#D8C9BE]">
                      <img src={room.photoUrl} alt="Room" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => updateRoom(room.id, 'photoUrl', '')}
                        className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg text-red-500 hover:text-red-700 transition-colors shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#D8C9BE] rounded-xl hover:bg-[#F8F6F3] hover:border-[#7C9278]/50 cursor-pointer transition-colors bg-white">
                      <Camera className="w-8 h-8 text-[#26382D]/30 mb-2" />
                      <span className="text-sm font-medium text-[#26382D]/70">Click to upload room photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            updateRoom(room.id, 'photoUrl', URL.createObjectURL(e.target.files[0]));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm font-medium text-[#26382D]">Room Name</label>
                  <input
                    type="text"
                    className="w-full h-11 px-4 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278] focus:outline-none focus:ring-1 bg-[#F8F6F3] text-[#26382D]"
                    placeholder="e.g., Deluxe Ocean View Suite"
                    value={room.name}
                    onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#26382D]">Max Guests</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#26382D]/40" />
                    <select
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278] focus:outline-none focus:ring-1 bg-[#F8F6F3] text-[#26382D] appearance-none"
                      value={room.capacity}
                      onChange={(e) => updateRoom(room.id, 'capacity', e.target.value)}
                    >
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="3">3 Guests</option>
                      <option value="4">4 Guests</option>
                      <option value="5">5 Guests</option>
                      <option value="6+">6+ Guests</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#26382D]">Bed Type</label>
                  <select
                    className="w-full h-11 px-4 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278] focus:outline-none focus:ring-1 bg-[#F8F6F3] text-[#26382D] appearance-none"
                    value={room.bedType}
                    onChange={(e) => updateRoom(room.id, 'bedType', e.target.value)}
                  >
                    <option value="">Select bed type...</option>
                    <option value="1 King Bed">1 King Bed</option>
                    <option value="1 Queen Bed">1 Queen Bed</option>
                    <option value="2 Twin Beds">2 Twin Beds</option>
                    <option value="2 Queen Beds">2 Queen Beds</option>
                    <option value="1 Double Bed">1 Double Bed</option>
                  </select>
                </div>
                
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm font-medium text-[#26382D]">Room Size (sq.ft / m²)</label>
                  <input
                    type="text"
                    className="w-full h-11 px-4 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278] focus:outline-none focus:ring-1 bg-[#F8F6F3] text-[#26382D]"
                    placeholder="e.g., 450 sq.ft"
                    value={room.size}
                    onChange={(e) => updateRoom(room.id, 'size', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))
        )}
        
        {value.length > 0 && (
          <Button variant="outline" onClick={addRoom} className="w-full sm:hidden">
            <Plus className="w-4 h-4 mr-2" /> Add Another Room
          </Button>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-4 border-t border-[#D8C9BE]/40">
        <Button variant="ghost" onClick={onBack} className="w-full sm:w-auto">
          {t('onboarding.back', 'Back')}
        </Button>
        <Button variant="primary" onClick={onContinue} className="w-full sm:w-auto">
          {t('onboarding.continue', 'Continue')}
        </Button>
      </div>
    </div>
  );
}
