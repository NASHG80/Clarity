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
    setEditForm(initialData);
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
      updatedListing.photos = editForm.photos.split('\n').filter((p: string) => p.trim() !== '');
    } else if (activeEditModal === 'accessibility') {
      // Just a mock save for prototype
      alert("Saved accessibility features locally.");
    } else if (activeEditModal === 'sustainability') {
      alert("Saved sustainability features locally.");
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
      {/* Persistent Business Toolbar */}
      <div className="sticky top-16 z-40 w-full bg-[#26382D] text-white px-4 py-3 shadow-md border-b border-[#26382D]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-md">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider">{t('preview.businessPreview', 'Business Preview')}</p>
              <p className="text-xs text-white/80">{t('preview.previewMsg', 'You are viewing this listing exactly as a traveler sees it.')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Removed global Manage Photos and Edit Listing buttons as per requirements. Editing is now inline. */}
          </div>
        </div>
      </div>
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
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setActiveEditModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
          </div>
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
              <label className="block text-sm font-medium text-[#26382D] mb-1">Photo URLs (One per line)</label>
              <textarea 
                className="w-full h-48 p-3 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-1 focus:ring-[#7C9278] outline-none text-sm"
                value={editForm.photos || ''}
                onChange={(e) => setEditForm({...editForm, photos: e.target.value})}
                placeholder="https://example.com/photo1.jpg"
              />
              <p className="text-xs text-[#26382D]/60 mt-2">Enter direct image URLs.</p>
            </div>
          )}

          {['accessibility', 'sustainability', 'amenities', 'rooms', 'location', 'rules'].includes(activeEditModal || '') && (
            <div className="text-center py-8">
              <Edit2 className="w-12 h-12 text-[#26382D]/20 mx-auto mb-4" />
              <p className="text-[#26382D]/70 font-medium">Please edit {activeEditModal} details from your dashboard or during onboarding.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
