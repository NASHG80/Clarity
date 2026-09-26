import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Building2, MapPin, Star, Eye, Edit2, Camera, Info, Check, 
  Map as MapIcon, BookOpen, StarHalf, MessageSquare, Image as ImageIcon 
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { getListingDetail, ListingDetailResponse } from '../../lib/api';
import { PropertyDetailTemplate } from '../components/property/PropertyDetailTemplate';

// Import rich editing components from onboarding
import { AccessibilityStep, AccessibilityData } from '../components/onboarding/AccessibilityStep';
import { SustainabilityStep, SustainabilityData } from '../components/onboarding/SustainabilityStep';
import { AmenitiesStep, AmenitiesData } from '../components/onboarding/AmenitiesStep';
import { RoomsStep, RoomData } from '../components/onboarding/RoomsStep';
import { RulesStep, RulesData } from '../components/onboarding/RulesStep';

export default function ListingPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [listing, setListing] = useState<ListingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Inline editing state
  const [activeEditModal, setActiveEditModal] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const handleOpenEdit = (modalName: string, initialData: any) => {
    let form = { ...initialData };
    if (['accessibility', 'sustainability', 'amenities', 'rules'].includes(modalName)) {
      const obj: Record<string, boolean> = {};
      if (modalName === 'accessibility') {
        listing?.accessibility_items?.forEach((i: any) => { obj[i.label] = true });
        form.accessibility = obj;
      } else if (modalName === 'sustainability') {
        listing?.sustainability_items?.forEach((i: any) => { obj[i.label] = true });
        form.sustainability = obj;
      } else if (modalName === 'amenities') {
        listing?.amenities?.forEach((a: string) => { obj[a] = true });
        form.amenities = obj;
      } else if (modalName === 'rules') {
        listing?.property_rules?.forEach((r: string) => { obj[r] = true });
        form.rules = obj;
      }
    } else if (modalName === 'rooms') {
      form.rooms = listing?.rooms || [];
    } else if (modalName === 'location') {
      form.city = listing?.city || '';
    } else if (modalName === 'photos') {
      form.uploadedPhotos = listing?.photos || [];
    }
    setEditForm(form);
    setActiveEditModal(modalName);
  };

  const handleSaveEdit = () => {
    if (!listing) return;
    const updatedListing = { ...listing };

    if (activeEditModal === 'about') {
      if (!updatedListing.translations) updatedListing.translations = { en: { name: updatedListing.id } };
      if (!updatedListing.translations.en) updatedListing.translations.en = { name: updatedListing.id };
      updatedListing.translations.en.description = editForm.description;
    } else if (activeEditModal === 'photos') {
      updatedListing.photos = editForm.uploadedPhotos || [];
    } else if (activeEditModal === 'accessibility') {
      updatedListing.accessibility_items = Object.entries(editForm.accessibility || {}).filter(([_, v]) => v).map(([k, _]) => ({ label: k, value: true, data_state: 'reported' as any }));
    } else if (activeEditModal === 'sustainability') {
      updatedListing.sustainability_items = Object.entries(editForm.sustainability || {}).filter(([_, v]) => v).map(([k, _]) => ({ label: k, value: true, data_state: 'reported' as any }));
    } else if (activeEditModal === 'amenities') {
      updatedListing.amenities = Object.keys(editForm.amenities || {}).filter(k => editForm.amenities[k]);
    } else if (activeEditModal === 'rules') {
      updatedListing.property_rules = Object.keys(editForm.rules || {}).filter(k => editForm.rules[k]);
    } else if (activeEditModal === 'rooms') {
      updatedListing.rooms = editForm.rooms || [];
    } else if (activeEditModal === 'location') {
      updatedListing.city = editForm.city || '';
    }
    
    setListing(updatedListing);
    setActiveEditModal(null);
  };

  useEffect(() => {
    if (!id) return;
    async function fetchDetail() {
      try {
        const data = await getListingDetail(id!);
        setListing(data);
      } catch (err) {
        console.error("Failed to fetch listing details", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EDE9] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#26382D] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#26382D] font-medium">{t('preview.loading', 'Loading preview...')}</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#F1EDE9] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl border border-[#D8C9BE] text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-[#26382D] mb-2">{t('preview.errorTitle', 'Listing Not Found')}</h2>
          <p className="text-[#26382D]/70 mb-6">{t('preview.errorMsg', 'We could not load the preview for this listing.')}</p>
          <Button variant="primary" onClick={() => navigate('/b2b/listings')}>
            {t('preview.backToListings', 'Back to Listings')}
          </Button>
        </div>
      </div>
    );
  }

  const name = listing.translations?.en?.name || 'Unnamed Property';

  return (
    <div className="min-h-screen bg-white font-sans text-[#26382D] pb-24">

      <PropertyDetailTemplate 
        listing={listing} 
        mode="business" 
        onEdit={handleOpenEdit} 
      />

      {/* Inline Editing Modal */}
      <Modal 
        isOpen={!!activeEditModal} 
        onClose={() => setActiveEditModal(null)}
        title={`Edit ${activeEditModal ? activeEditModal.charAt(0).toUpperCase() + activeEditModal.slice(1) : ''}`}
        footer={
          ['about', 'photos', 'location'].includes(activeEditModal || '') ? (
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setActiveEditModal(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-4">
          {activeEditModal === 'about' && (
            <div>
              <label className="block text-sm font-medium text-[#26382D] mb-1">Property Description</label>
              <textarea 
                className="w-full h-32 p-3 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-1 focus:ring-[#7C9278] outline-none"
                value={editForm.description || ''}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                placeholder="Write a compelling description for your property..."
              />
            </div>
          )}
          
          {activeEditModal === 'photos' && (
            <div>
              <label className="block text-sm font-medium text-[#26382D] mb-1">Upload Photos</label>
              <div className="border-2 border-dashed border-[#D8C9BE] rounded-xl p-6 text-center hover:bg-[#F8F6F3] transition-colors relative cursor-pointer">
                <input 
                  type="file"
                  multiple
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const newPhotos = files.map(f => URL.createObjectURL(f));
                    setEditForm({...editForm, uploadedPhotos: [...(editForm.uploadedPhotos || []), ...newPhotos]});
                  }}
                />
                <Camera className="w-8 h-8 mx-auto text-[#7C9278] mb-2" />
                <p className="text-sm text-[#26382D] font-medium">Click or drag photos to upload</p>
                <p className="text-xs text-[#26382D]/60 mt-1">Supports JPG, PNG, WEBP</p>
              </div>
              <div className="flex gap-2 flex-wrap mt-4">
                {(editForm.uploadedPhotos || []).map((p: string, i: number) => (
                  <div key={i} className="w-20 h-20 bg-[#F5F3ED] rounded-lg overflow-hidden border border-[#E5DFD6]">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeEditModal === 'accessibility' && (
            <AccessibilityStep 
              value={editForm.accessibility || {}} 
              onChange={(val) => setEditForm({...editForm, accessibility: val})} 
              onBack={() => setActiveEditModal(null)} 
              onContinue={handleSaveEdit} 
            />
          )}

          {activeEditModal === 'sustainability' && (
            <SustainabilityStep 
              value={editForm.sustainability || {}} 
              onChange={(val) => setEditForm({...editForm, sustainability: val})} 
              onBack={() => setActiveEditModal(null)} 
              onContinue={handleSaveEdit} 
            />
          )}

          {activeEditModal === 'amenities' && (
            <AmenitiesStep 
              value={editForm.amenities || {}} 
              onChange={(val) => setEditForm({...editForm, amenities: val})} 
              onBack={() => setActiveEditModal(null)} 
              onContinue={handleSaveEdit} 
            />
          )}

          {activeEditModal === 'rules' && (
            <RulesStep 
              value={editForm.rules || {}} 
              onChange={(val) => setEditForm({...editForm, rules: val})} 
              onBack={() => setActiveEditModal(null)} 
              onContinue={handleSaveEdit} 
            />
          )}
          
          {activeEditModal === 'rooms' && (
            <RoomsStep 
              value={editForm.rooms || []} 
              onChange={(val) => setEditForm({...editForm, rooms: val})} 
              onBack={() => setActiveEditModal(null)} 
              onContinue={handleSaveEdit} 
            />
          )}

          {['location'].includes(activeEditModal || '') && (
            <div>
              <label className="block text-sm font-medium text-[#26382D] mb-1">City</label>
              <input 
                type="text"
                className="w-full p-3 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-1 focus:ring-[#7C9278] outline-none"
                value={editForm.city || ''}
                onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                placeholder="E.g. Goa, Mumbai..."
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
