import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { 
  Building2, MapPin, Edit2, ShieldCheck, CheckCircle2, 
  ChevronLeft, Star, Camera, Phone, Mail, Globe, Leaf, 
  Users, Coffee, Wifi, Car, Activity, Anchor, Home, Settings
} from 'lucide-react';

// ============================================================================
// HARD-CODED DEMO DATA
// ============================================================================
const DEMO_BUSINESS_PROFILE = {
  id: "6ab88a5e20ec3c81c51f21bb", // using a real id from DB so navigation works if needed
  name: "Aranya Grand Retreat",
  category: "Luxury Eco Resort",
  location: "Wayanad, Kerala, India",
  rating: 4.8,
  reviews: 324,
  rooms: 24,
  established: 2018,
  status: "Verified Business",
  tagline: "An accessible eco-retreat surrounded by the forests of Wayanad.",
  pricePerNight: 8500,

  description:
    "Aranya Grand Retreat is a nature-forward luxury retreat in Wayanad, designed for travelers seeking a quieter stay surrounded by forests, local culture and thoughtful hospitality.",

  contact: {
    company: "Aranya Hospitality Pvt. Ltd.",
    phone: "+91 98765 43210",
    email: "stay@aranyagrand.example",
    website: "www.aranyagrand.example",
    address: "Vythiri, Wayanad, Kerala"
  },

  accessibility: [
    { label: "Step-free entrance", state: "reported" },
    { label: "Accessible parking", state: "verified" },
    { label: "Elevator", state: "verified" },
    { label: "Roll-in shower", state: "not_verified" },
    { label: "Grab bars", state: "not_verified" },
    { label: "Accessible common areas", state: "reported" }
  ],

  sustainability: [
    { label: "Renewable energy", state: "reported" },
    { label: "Water conservation", state: "verified" },
    { label: "Waste segregation", state: "reported" },
    { label: "Local sourcing", state: "reported" },
    { label: "EV charging", state: "not_verified" }
  ],

  amenities: [
    { label: "Wi-Fi", icon: Wifi },
    { label: "Restaurant", icon: Coffee },
    { label: "Parking", icon: Car },
    { label: "Pool", icon: Activity },
    { label: "Spa", icon: Leaf },
    { label: "Step-free access", icon: Home },
    { label: "24-hour front desk", icon: Users }
  ],

  highlights: [
    "Forest setting",
    "Local Kerala cuisine",
    "Nature experiences",
    "Quiet private rooms",
    "Family-friendly spaces",
    "Accessible common areas"
  ],

  photos: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1618773928120-2c14f29881eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  ],

  profileCompletion: 82
};

// ============================================================================
// COMPONENT
// ============================================================================
export default function BusinessProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isScrolled, setIsScrolled] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const profile = DEMO_BUSINESS_PROFILE;

  // Handle scroll for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 400);
      
      // Simple scroll spy
      const sections = ['overview', 'property', 'accessibility', 'sustainability', 'photos', 'location'];
      for (const section of sections.reverse()) {
        const el = document.getElementById(`section-${section}`);
        if (el && window.scrollY >= el.offsetTop - 150) {
          setActiveTab(section);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const el = document.getElementById(`section-${id}`);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const navItems = [
    { id: 'overview', label: t('profileNav.overview', 'Overview') },
    { id: 'property', label: t('profileNav.property', 'Property') },
    { id: 'accessibility', label: t('profileNav.accessibility', 'Accessibility') },
    { id: 'sustainability', label: t('profileNav.sustainability', 'Sustainability') },
    { id: 'photos', label: t('profileNav.photos', 'Photos') },
    { id: 'location', label: t('profileNav.location', 'Location') }
  ];

  const renderContent = () => (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#1C2B22]">
      
      {/* ── BREADCRUMB ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center gap-2 text-sm text-[#5B6D62]">
        <button onClick={() => navigate('/b2b/opportunity-detector')} className="hover:text-[#1C2B22] flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Business
        </button>
        <span>/</span>
        <span className="font-medium text-[#1C2B22]">Profile</span>
      </div>

      {/* ── HERO SECTION ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-10">
        
        {/* Photo Gallery Grid */}
        <div className="relative w-full h-[50vh] min-h-[400px] max-h-[600px] rounded-3xl overflow-hidden flex gap-2 sm:gap-4 mb-8">
          {/* Main Large Image */}
          <div 
            className="flex-[2] h-full relative cursor-pointer group overflow-hidden bg-[#E5DFD6]"
            onClick={() => openLightbox(0)}
          >
            <img 
              src={profile.photos[0]} 
              alt={profile.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C2B22]/60 via-transparent to-transparent opacity-60" />
          </div>
          
          {/* Right Smaller Images */}
          <div className="flex-1 hidden md:flex flex-col gap-2 sm:gap-4 h-full">
            <div className="flex-1 relative cursor-pointer group overflow-hidden bg-[#E5DFD6] rounded-tr-3xl" onClick={() => openLightbox(1)}>
              <img src={profile.photos[1]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="flex-1 relative cursor-pointer group overflow-hidden bg-[#E5DFD6] rounded-br-3xl" onClick={() => openLightbox(2)}>
              <img src={profile.photos[2]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[#1C2B22]/20 group-hover:bg-transparent transition-colors" />
              
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm">
                <Camera className="w-4 h-4" />
                {profile.photos.length} photos
              </div>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-end">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="uppercase tracking-widest text-xs font-bold text-[#7C9278]">{profile.category}</span>
              <span className="inline-flex items-center gap-1 bg-[#E8F0E6] text-[#2C4A3B] px-2.5 py-1 rounded-full text-xs font-semibold border border-[#7C9278]/20">
                <CheckCircle2 className="w-3 h-3" />
                {profile.status}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#1C2B22] mb-4 tracking-tight leading-tight">
              {profile.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[#5B6D62] text-[15px] mb-6">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#7C9278]" />
                {profile.location}
              </span>
              <span className="flex items-center gap-1.5 font-medium text-[#1C2B22]">
                <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                {profile.rating} <span className="text-[#5B6D62] font-normal underline decoration-[#D8C9BE] underline-offset-4 cursor-pointer">{profile.reviews} reviews</span>
              </span>
            </div>

            <p className="text-lg md:text-xl text-[#26382D]/80 leading-relaxed font-light">
              "{profile.tagline}"
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 shrink-0">
            <Button variant="outline" onClick={() => navigate(`/b2b/listings/${profile.id}`)} className="bg-white hover:bg-[#F8F6F3] border-[#D8C9BE]">
              {t('actions.viewListing', 'View Customer Listing')}
            </Button>
            <Button variant="primary" onClick={() => navigate('/onboarding')} className="bg-[#1C2B22] hover:bg-[#2A4033] shadow-lg shadow-[#1C2B22]/10">
              {t('actions.editProfile', 'Edit Profile')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── TRUST BAR ── */}
      <div className="border-y border-[#D8C9BE] bg-white sticky top-0 z-40 transition-shadow" style={{ boxShadow: isScrolled ? '0 4px 20px rgba(0,0,0,0.03)' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          
          {/* Trust Status (Hidden on mobile when scrolling) */}
          <div className={`py-4 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm transition-all duration-300 ${isScrolled ? 'hidden md:flex h-0 md:h-auto opacity-0 md:opacity-100 overflow-hidden' : 'opacity-100'}`}>
            <span className="flex items-center gap-2 font-medium text-[#2C4A3B]">
              <ShieldCheck className="w-4 h-4 text-[#7C9278]" /> Business verified
            </span>
            <span className="flex items-center gap-2 font-medium text-[#2C4A3B]">
              <CheckCircle2 className="w-4 h-4 text-[#7C9278]" /> Property information complete
            </span>
            <span className="flex items-center gap-2 font-medium text-[#2C4A3B]">
              <DataStateBadge state="reported" /> Accessibility reported
            </span>
          </div>

          {/* Sticky Nav */}
          <div className="flex overflow-x-auto no-scrollbar border-t border-[#F0EBE1] md:border-none">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`whitespace-nowrap px-1 py-4 mr-8 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === item.id 
                    ? 'border-[#1C2B22] text-[#1C2B22]' 
                    : 'border-transparent text-[#5B6D62] hover:text-[#1C2B22]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 flex flex-col lg:flex-row gap-12">
        
        {/* LEFT COLUMN: Editorial Content */}
        <div className="flex-1 space-y-16 max-w-4xl">
          
          {/* SECTION: OVERVIEW */}
          <div id="section-overview" className="scroll-mt-32">
            {/* Quick Facts */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              <div className="bg-white p-4 rounded-2xl border border-[#D8C9BE] text-center shadow-sm">
                <p className="text-2xl font-bold text-[#1C2B22]">{profile.rooms}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7C9278] mt-1">Rooms</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#D8C9BE] text-center shadow-sm">
                <p className="text-2xl font-bold text-[#1C2B22]">{profile.established}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7C9278] mt-1">Opened</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#D8C9BE] text-center shadow-sm">
                <p className="text-2xl font-bold text-[#1C2B22]">{profile.rating}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7C9278] mt-1">Guest Rating</p>
              </div>
              <div className="bg-[#2C4A3B] p-4 rounded-2xl border border-[#2C4A3B] text-center shadow-sm col-span-2 md:col-span-2 flex flex-col justify-center items-center">
                <Leaf className="w-6 h-6 text-[#A3B899] mb-1" />
                <p className="text-sm font-bold text-white uppercase tracking-wider">{profile.category}</p>
              </div>
            </div>

            <h2 className="text-2xl font-serif font-bold text-[#1C2B22] mb-4">About {profile.name}</h2>
            <p className="text-[17px] leading-relaxed text-[#4A5D52] mb-8 font-light">
              {profile.description}
            </p>
            
            <div className="grid sm:grid-cols-3 gap-6 py-6 border-y border-[#D8C9BE]/60">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold text-[#7C9278] mb-1">Check-in</p>
                <p className="font-medium text-[#1C2B22]">2:00 PM</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold text-[#7C9278] mb-1">Check-out</p>
                <p className="font-medium text-[#1C2B22]">11:00 AM</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold text-[#7C9278] mb-1">Languages</p>
                <p className="font-medium text-[#1C2B22]">English · Hindi · Malayalam</p>
              </div>
            </div>
          </div>

          {/* SECTION: PROPERTY HIGHLIGHTS */}
          <div id="section-property" className="scroll-mt-32">
            <h2 className="text-2xl font-serif font-bold text-[#1C2B22] mb-8">Why guests choose us</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                {profile.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-[#D8C9BE] shadow-sm hover:border-[#7C9278] transition-colors">
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    <span className="font-medium text-[#1C2B22]">{h}</span>
                  </div>
                ))}
              </div>
              <div className="relative h-64 md:h-full min-h-[300px] rounded-2xl overflow-hidden bg-[#E5DFD6]">
                <img src={profile.photos[3]} alt="Highlight" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* SECTION: ACCESSIBILITY */}
          <div id="section-accessibility" className="scroll-mt-32">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-serif font-bold text-[#1C2B22]">Accessibility</h2>
              <Button variant="outline" className="text-sm rounded-full bg-white shadow-sm hover:border-[#1C2B22]" onClick={() => navigate('/onboarding')}>
                Edit Accessibility
              </Button>
            </div>
            <p className="text-[#5B6D62] mb-8">Information shared by the property</p>
            
            <div className="bg-white rounded-3xl border border-[#D8C9BE] shadow-sm overflow-hidden">
              <div className="divide-y divide-[#F0EBE1]">
                {profile.accessibility.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-5 hover:bg-[#FDFBF7] transition-colors">
                    <div className="flex items-center gap-3">
                      {item.state === 'verified' || item.state === 'reported' || item.state === 'community_confirmed' ? (
                        <CheckCircle2 className="w-5 h-5 text-[#7C9278]" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[#D8C9BE] flex items-center justify-center text-[#D8C9BE] font-bold text-xs">?</div>
                      )}
                      <span className="font-medium text-[#1C2B22] text-[15px]">{item.label}</span>
                    </div>
                    <DataStateBadge state={item.state as any} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION: SUSTAINABILITY */}
          <div id="section-sustainability" className="scroll-mt-32">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-serif font-bold text-[#1C2B22]">Sustainability</h2>
              <Button variant="outline" className="text-sm rounded-full bg-white shadow-sm hover:border-[#1C2B22]" onClick={() => navigate('/onboarding')}>
                Edit Sustainability
              </Button>
            </div>
            <p className="text-[#5B6D62] mb-8">Environmental focus</p>
            
            <div className="bg-white rounded-3xl border border-[#D8C9BE] shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="p-8 md:w-1/3 bg-[#2C4A3B] text-white flex flex-col justify-center items-center text-center">
                <Leaf className="w-12 h-12 text-[#A3B899] mb-4" />
                <h3 className="font-serif text-xl font-bold mb-2">Eco-Conscious</h3>
                <p className="text-[#A3B899] text-sm leading-relaxed">Committed to preserving the natural beauty of Wayanad.</p>
              </div>
              <div className="md:w-2/3 divide-y divide-[#F0EBE1]">
                {profile.sustainability.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-5 hover:bg-[#FDFBF7] transition-colors">
                    <span className="font-medium text-[#1C2B22] text-[15px]">{item.label}</span>
                    <DataStateBadge state={item.state as any} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION: PHOTOS */}
          <div id="section-photos" className="scroll-mt-32">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-bold text-[#1C2B22]">Photo Collection</h2>
              <Button variant="outline" className="text-sm rounded-full bg-white shadow-sm hover:border-[#1C2B22]" onClick={() => navigate('/onboarding')}>
                Manage Photos
              </Button>
            </div>
            
            <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
              {profile.photos.map((url, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden group cursor-pointer break-inside-avoid bg-[#E5DFD6]" onClick={() => openLightbox(i)}>
                  <img src={url} alt={`Gallery ${i}`} className="w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  {i === 2 && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-[#2C4A3B]">
                      Accessibility Evidence
                    </div>
                  )}
                  {i === 3 && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-[#2C4A3B]">
                      Sustainability
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION: AMENITIES */}
          <div id="section-amenities" className="scroll-mt-32">
            <h2 className="text-2xl font-serif font-bold text-[#1C2B22] mb-8">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {profile.amenities.map((amenity, i) => {
                const Icon = amenity.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-[#7C9278]" />
                    <span className="text-[15px] font-medium text-[#4A5D52]">{amenity.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION: LOCATION */}
          <div id="section-location" className="scroll-mt-32">
            <h2 className="text-2xl font-serif font-bold text-[#1C2B22] mb-2">Location</h2>
            <p className="text-[#5B6D62] mb-6">{profile.location}</p>
            
            <div className="bg-white rounded-3xl border border-[#D8C9BE] p-2 shadow-sm mb-6">
              <div className="h-[300px] rounded-2xl bg-[#E8F0E6] flex items-center justify-center relative overflow-hidden">
                {/* Static Map Placeholder Styling */}
                <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-[#1a73e8]">
                    <MapPin className="w-5 h-5 text-[#1a73e8]" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 bg-white px-4 py-3 rounded-xl shadow-md border border-gray-100">
                  <p className="font-bold text-[#1C2B22]">{profile.name}</p>
                  <p className="text-xs text-[#5B6D62] mt-1">{profile.contact.address}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <span className="inline-flex items-center gap-2 bg-[#F8F6F3] px-4 py-2 rounded-lg text-sm font-medium border border-[#D8C9BE]">
                ✈️ 3.5 hrs from Kozhikode Airport
              </span>
              <span className="inline-flex items-center gap-2 bg-[#F8F6F3] px-4 py-2 rounded-lg text-sm font-medium border border-[#D8C9BE]">
                🚗 45 min from Kalpetta
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Actions & Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          
          {/* Action Box */}
          <div className="bg-white p-6 rounded-3xl border border-[#D8C9BE] shadow-sm sticky top-32">
            
            {/* Completion */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#1C2B22] uppercase tracking-wider">Profile Readiness</span>
                <span className="text-xl font-bold text-[#2C4A3B]">{profile.profileCompletion}%</span>
              </div>
              <div className="h-2 w-full bg-[#E5DFD6] rounded-full overflow-hidden mb-4">
                <div className="h-full bg-[#7C9278]" style={{ width: `${profile.profileCompletion}%` }} />
              </div>
              <ul className="space-y-2 text-sm text-[#5B6D62]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#7C9278]" /> Business identity</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#7C9278]" /> Property details</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#7C9278]" /> Accessibility</li>
                <li className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-[#D8C9BE]" /> Contact verification</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button variant="primary" className="w-full bg-[#1C2B22] hover:bg-[#2A4033] shadow-md shadow-[#1C2B22]/10 justify-between" onClick={() => navigate('/onboarding')}>
                Complete Profile <Activity className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full bg-white justify-between" onClick={() => navigate('/b2b/analytics')}>
                View Analytics <Activity className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full bg-white justify-between" onClick={() => navigate('/b2b/opportunity-detector')}>
                View Opportunities <Anchor className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Connected Listing Preview */}
            <div className="mt-8 pt-8 border-t border-[#F0EBE1]">
              <h3 className="text-sm font-bold text-[#1C2B22] uppercase tracking-wider mb-4">Customer Listing</h3>
              <div 
                className="group border border-[#D8C9BE] rounded-2xl overflow-hidden cursor-pointer hover:border-[#7C9278] transition-colors"
                onClick={() => navigate(`/b2b/listings/${profile.id}`)}
              >
                <div className="h-32 bg-[#E5DFD6] relative overflow-hidden">
                  <img src={profile.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4 bg-white">
                  <p className="font-bold text-[#1C2B22] text-sm truncate mb-1">{profile.name}</p>
                  <p className="text-xs text-[#5B6D62] flex items-center gap-1 mb-2"><Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" /> {profile.rating} · {profile.reviews} reviews</p>
                  <p className="text-sm font-semibold text-[#1C2B22]">From ₹{profile.pricePerNight.toLocaleString()} <span className="text-xs text-[#5B6D62] font-normal">/ night</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Contact */}
          <div className="bg-[#2C4A3B] text-white p-6 rounded-3xl shadow-sm">
            <h3 className="font-serif text-xl font-bold mb-6">Business Contact</h3>
            <p className="font-bold mb-4">{profile.contact.company}</p>
            <div className="space-y-4 text-sm text-[#A3B899]">
              <p className="flex items-center gap-3"><Phone className="w-4 h-4 shrink-0 text-white" /> {profile.contact.phone}</p>
              <p className="flex items-center gap-3"><Mail className="w-4 h-4 shrink-0 text-white" /> {profile.contact.email}</p>
              <p className="flex items-center gap-3"><Globe className="w-4 h-4 shrink-0 text-white" /> <a href={`https://${profile.contact.website}`} className="hover:text-white transition-colors">{profile.contact.website}</a></p>
              <p className="flex items-start gap-3"><MapPin className="w-4 h-4 shrink-0 text-white mt-0.5" /> {profile.contact.address}</p>
            </div>
          </div>
          
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm">
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white font-medium text-sm tracking-widest uppercase">
            {currentImageIndex + 1} / {profile.photos.length}
          </div>

          <div className="max-w-6xl w-full max-h-[85vh] relative flex items-center justify-center">
            <img 
              src={profile.photos[currentImageIndex]} 
              alt="Gallery Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-sm"
            />
          </div>
          
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
            onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : profile.photos.length - 1)}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all rotate-180"
            onClick={() => setCurrentImageIndex(prev => prev < profile.photos.length - 1 ? prev + 1 : 0)}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="flex md:hidden flex-col bg-[#FDFBF7] min-h-screen w-full">
        {renderContent()}
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-col bg-[#FDFBF7] min-h-screen w-full">
        {renderContent()}
      </div>
    </>
  );
}
