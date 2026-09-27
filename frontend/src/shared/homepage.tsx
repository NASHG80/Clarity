/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CLARITY — Single-File Consolidated Homepage
 * Location: /src/shared/homepage.tsx
 * 
 * Personalized Travel Decision Engine for sustainable and accessible travel in India.
 * Fixed Palette:
 * - Warm Ivory: #F1EDE9 (Dominates canvas)
 * - Soft White: #F8F6F3 (Cards / surfaces)
 * - Sage Green: #7C9278 (Primary sustainability accent)
 * - Deep Forest: #26382D (Headings / navigation / strong CTAs)
 * - Muted Sage: #A9B8A3 (Secondary elements)
 * - Warm Beige: #D8C9BE (Supporting sections)
 * - Earth Taupe: #A99587 (Subtle accents)
 * - Soft Peach: #E8CFC4 (Tiny highlights)
 * 
 * Fixed Typography:
 * - Cormorant Garamond: Hero headline, major editorial text, large brand statements, italic editorial emphasis
 * - DM Sans: Navigation, body, buttons, labels, input, helper text, metadata, cards, UI controls
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Mic,
  X,
  ArrowRight,
  Accessibility,
  Leaf,
  IndianRupee,
  ShieldCheck,
  Check,
  Sparkles,
  Building2,
  Send,
  Train,
  Users,
  Edit2,
  ArrowUpRight,
  ArrowUp,
  Globe,
  User,
  Menu,
  Compass,
  Bookmark,
  UserCheck,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import heroBgImage from '../assets/images/hero_sustainable_india_travel_1790406163839.jpg';
import accessibleGoaImg from '../assets/images/accessible_serene_retreat_goa_1790406178105.jpg';
import cinematicHeroImg from '../assets/images/cinematic_high_end_architectural_travel_photography_of_a_modern_luxury_eco.png';
import Navbar from './components/Navbar';
import BottomNavBar from './components/BottomNavBar';
import { extractTripNLU, NLUExtractedData, NLUMissingOrAmbiguousItem } from '../lib/api';

// ==========================================
// 1. TYPES & MODELS
// ==========================================
export type Language = 'en' | 'hi' | 'mr';

export type DataStateType = 'verified' | 'reported' | 'community-confirmed' | 'unverified';

export interface ParsedTripDetails {
  origin: string;
  destination: string;
  travelers: {
    adults: number;
    children: number;
    seniors: number;
    wheelchairUsers: number;
  };
  accessibilityNeeds: string[];
  sustainabilityGoals: string[];
  budgetEstimated?: string;
  duration?: string;
}

// ==========================================
// 2. I18N DICTIONARIES (EN, HI, MR)
// ==========================================
// ==========================================
// 3. NLU EXTRACTION & CLARIFICATION
// Note: Per AGENTS.md Rule 3, all trip extraction is performed via
// POST /api/nlu/extract. No client-side regex or heuristics are used.
// ==========================================

// ==========================================
// 4. EMBEDDED SUBCOMPONENTS
// ==========================================

/**
 * DataStateBadge: displays verification state
 * (verified, reported, community-confirmed, unverified)
 */
export const DataStateBadge: React.FC<{
  state: DataStateType;
  label?: string;
  className?: string;
}> = ({ state, label, className = '' }) => {
  const config = {
    verified: {
      text: label || 'Audited & Verified',
      icon: ShieldCheck,
      bgColor: 'bg-[#7C9278]/15',
      textColor: 'text-[#26382D]',
      borderColor: 'border-[#7C9278]/40',
    },
    'community-confirmed': {
      text: label || 'Community Confirmed',
      icon: UserCheck,
      bgColor: 'bg-[#A9B8A3]/20',
      textColor: 'text-[#26382D]',
      borderColor: 'border-[#A9B8A3]',
    },
    reported: {
      text: label || 'Operator Reported',
      icon: FileText,
      bgColor: 'bg-[#D8C9BE]/30',
      textColor: 'text-[#26382D]/85',
      borderColor: 'border-[#D8C9BE]',
    },
    unverified: {
      text: label || 'Unverified / Pending Audit',
      icon: AlertCircle,
      bgColor: 'bg-[#E8CFC4]/30',
      textColor: 'text-[#A99587]',
      borderColor: 'border-[#E8CFC4]',
    },
  }[state];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border tracking-wide transition-colors ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      <Icon className="w-3 h-3 text-[#26382D]/80" />
      <span>{config.text}</span>
    </span>
  );
};

/**
 * Reusable Accessible Modal
 */
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}> = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'lg' }) => {
  const { t: tI18n } = useTranslation('b2c');
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative bg-[#F8F6F3] rounded-3xl w-full ${maxWidthClass} p-6 sm:p-8 border border-[#D8C9BE] shadow-[0_24px_60px_rgba(38,56,45,0.2)] max-h-[92vh] overflow-y-auto z-10`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#26382D]/60 hover:text-[#26382D] p-1.5 rounded-full hover:bg-[#F1EDE9] transition-colors cursor-pointer"
          aria-label={tI18n('accessibility.closeDialog', 'Close dialog')}
        >
          <X className="w-5 h-5" />
        </button>

        {(title || subtitle) && (
          <div className="text-left space-y-1.5 pb-4 mb-4 border-b border-[#D8C9BE]/60 pr-8">
            {typeof title === 'string' ? (
              <h2 className="font-serif text-2xl font-medium text-[#26382D]">{title}</h2>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#26382D]/75 font-light leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

// ==========================================
// 5. MAIN HOMEPAGE COMPONENT
// ==========================================
export interface HomePageProps {
  onOpenRequirementForm?: (data?: NLUExtractedData, fallbackNotice?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenRequirementForm }) => {
  const { t: tI18n, i18n } = useTranslation('b2c');
  const navigate = useNavigate();

  const [currentLang, setCurrentLang] = useState<Language>(() => {
    return (localStorage.getItem('clarity_lang') as Language) || 'en';
  });
  const [tripQuery, setTripQuery] = useState(
    'Mumbai to Goa with 2 children and 1 senior. I need a wheelchair, accessible transport and an accessible hotel.'
  );
  
  // Inline validation state for empty/whitespace prompt
  const [promptError, setPromptError] = useState<string | null>(null);

  // NLU Extraction and Clarification State (Person A3 & A4)
  const [isExtracting, setIsExtracting] = useState(false);
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [clarificationQueue, setClarificationQueue] = useState<NLUMissingOrAmbiguousItem[]>([]);
  const [currentClarificationIndex, setCurrentClarificationIndex] = useState(0);
  const [clarificationAnswer, setClarificationAnswer] = useState('');
  const [clarificationError, setClarificationError] = useState<string | null>(null);
  const [extractedAccumulator, setExtractedAccumulator] = useState<NLUExtractedData | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState('search');

  // Business Modal Form State
  const [propertyName, setPropertyName] = useState('');
  const [propertyLocation, setPropertyLocation] = useState('Goa');
  const [propertyType, setPropertyType] = useState('Eco-Resort / Homestay');
  const [businessSubmitted, setBusinessSubmitted] = useState(false);

  const t = tI18n('home', { returnObjects: true }) as any;

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    localStorage.setItem('clarity_lang', lang);
    i18n.changeLanguage(lang);
    setLangDropdownOpen(false);
    const currentDefault = t.inputCard.defaultQuery;
    if (tripQuery === currentDefault || !tripQuery.trim()) {
      // Need to get the other lang's query, but it might be easier to just use i18n directly.
      const newQuery = i18n.getFixedT(lang, 'b2c')('home.inputCard.defaultQuery');
      setTripQuery(newQuery);
    }
  };

  const handleFindOptions = async () => {
    if (isExtracting) return;

    // Requirement 3: If prompt is empty or whitespace-only, show translated error and stay on screen
    if (!tripQuery.trim()) {
      setPromptError(tI18n('landing.promptEmptyError'));
      return;
    }

    setPromptError(null);
    setIsExtracting(true);

    try {
      const response = await extractTripNLU(tripQuery);
      setIsExtracting(false);

      const { extracted, missing_or_ambiguous } = response;
      setExtractedAccumulator(extracted);

      if (missing_or_ambiguous && missing_or_ambiguous.length > 0) {
        setClarificationQueue(missing_or_ambiguous);
        setCurrentClarificationIndex(0);
        setClarificationAnswer('');
        setClarificationError(null);
        setIsClarificationModalOpen(true);
      } else {
        if (onOpenRequirementForm) {
          onOpenRequirementForm(extracted);
        }
      }
    } catch (error) {
      setIsExtracting(false);
      // Fallback gracefully to empty Requirement Form per Acceptance Criteria #8
      if (onOpenRequirementForm) {
        onOpenRequirementForm(undefined, t.inputCard.errorFallbackNotice);
      }
    }
  };

  const currentClarificationItem = clarificationQueue[currentClarificationIndex] || null;

  const handleAnswerClarification = () => {
    if (!currentClarificationItem) return;

    // Requirement 4: Validate clarification answers
    const trimmed = clarificationAnswer.trim();
    if (!trimmed) {
      setClarificationError(tI18n('clarification.validationRequired'));
      return;
    }

    if (currentClarificationItem.field === 'adult_count') {
      const count = parseInt(trimmed, 10);
      if (isNaN(count) || count < 1) {
        setClarificationError(tI18n('clarification.validationPositiveNumber'));
        return;
      }
    }

    setClarificationError(null);

    const updatedExtracted: NLUExtractedData = {
      ...(extractedAccumulator || {}),
    };

    if (currentClarificationItem.field === 'adult_count') {
      updatedExtracted.adult_count = parseInt(trimmed, 10);
    } else if (currentClarificationItem.field === 'origin') {
      updatedExtracted.origin = trimmed;
    } else if (currentClarificationItem.field === 'destination') {
      updatedExtracted.destination = trimmed;
    }

    setExtractedAccumulator(updatedExtracted);

    if (currentClarificationIndex + 1 < clarificationQueue.length) {
      const nextIdx = currentClarificationIndex + 1;
      setCurrentClarificationIndex(nextIdx);
      setClarificationAnswer('');
      setClarificationError(null);
    } else {
      setIsClarificationModalOpen(false);
      if (onOpenRequirementForm) {
        onOpenRequirementForm(updatedExtracted);
      }
    }
  };

  const handleSkipClarification = () => {
    setClarificationError(null);
    if (currentClarificationIndex + 1 < clarificationQueue.length) {
      const nextIdx = currentClarificationIndex + 1;
      setCurrentClarificationIndex(nextIdx);
      setClarificationAnswer('');
    } else {
      setIsClarificationModalOpen(false);
      if (onOpenRequirementForm) {
        onOpenRequirementForm(extractedAccumulator || undefined);
      }
    }
  };

  const formatClarificationContext = (promptText: string) => {
    const parts: string[] = [];
    if (extractedAccumulator?.children_count) {
      parts.push(`${extractedAccumulator.children_count} ${t.clarification.childrenLabel}`);
    }
    if (extractedAccumulator?.senior_count) {
      parts.push(`${extractedAccumulator.senior_count} ${t.clarification.seniorLabel}`);
    }
    if (parts.length > 0) {
      return `${t.clarification.foundPrefix} ${parts.join(` ${t.clarification.andLabel} `)}. ${promptText}`;
    }
    return promptText;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isExtracting) {
        handleFindOptions();
      }
    }
  };

  const toggleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        if (!tripQuery.trim()) {
          setTripQuery(t.inputCard.defaultQuery);
        }
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessSubmitted(true);
    setTimeout(() => {
      setTimeout(() => {
        setIsBusinessModalOpen(false);
        setBusinessSubmitted(false);
      }, 1500);
    }, 400);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderMobileHeader = () => (
    <>
      {/* -------------------------------------- */}
      {/* 1. TOP NAVBAR (Floating Pill) */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto h-16 bg-[#F1EDE9]/95 backdrop-blur-md border border-[#26382D]/10 rounded-full flex items-center justify-between px-6 shadow-sm">
          
          {/* Logo / Wordmark */}
          <div className="flex items-center gap-3">
            <a 
              href="#top" 
              className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] rounded-md"
              aria-label={tI18n('accessibility.home', 'CLARITY Homepage')}
            >
              <div className="w-8 h-8 rounded-full bg-[#26382D] text-[#F8F6F3] flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-xs">
                <Leaf className="w-4 h-4" />
              </div>
              <span className="font-serif text-xl tracking-tight font-medium text-[#26382D]">
                CLARITY
              </span>
            </a>
          </div>

          {/* Center Links */}
          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-[#26382D]/80">
            <a href="#value-propositions" className="hover:text-[#26382D] transition-colors">{t.nav.explore}</a>
            <a href="#trip-input" className="hover:text-[#26382D] transition-colors">{t.nav.planTrip}</a>
            <a href="#accessibility" className="hover:text-[#26382D] transition-colors">Accessibility</a>
            <a href="#sustainability" className="hover:text-[#26382D] transition-colors">Sustainability</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setIsBusinessModalOpen(true); }} className="hover:text-[#26382D] transition-colors">{t.nav.forBusinesses}</a>
          </nav>

          {/* Right: Action Button */}
          <div className="hidden md:flex items-center gap-5 text-sm">
            <button
              onClick={() => navigate('/auth')}
              className="bg-[#26382D] text-white px-5 py-2.5 rounded-full text-[11px] font-bold tracking-wider flex items-center gap-2 hover:bg-[#1A261E] transition-colors"
            >
              START PLANNING <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="px-2.5 py-1.5 rounded-lg border border-[#D8C9BE] text-[#26382D] text-xs font-semibold flex items-center gap-1 bg-[#F8F6F3]"
            >
              <Globe className="w-3 h-3 text-[#7C9278]" />
              <span className="uppercase">{currentLang}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#26382D] hover:bg-[#F8F6F3] transition-colors focus:outline-none"
              aria-label={tI18n('accessibility.toggleMenu', 'Toggle menu')}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#F8F6F3] border-b border-[#D8C9BE] px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col space-y-3 text-base font-medium text-[#26382D]">
              <a 
                href="#trip-input" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 border-b border-[#26382D]/5"
              >
                {t.nav.planTrip}
              </a>
              <a 
                href="#value-propositions" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 border-b border-[#26382D]/5"
              >
                {t.nav.explore}
              </a>
              <a 
                href="#editorial-philosophy" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 border-b border-[#26382D]/5"
              >
                {t.nav.trips}
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsBusinessModalOpen(true);
                }}
                className="text-left py-1 text-[#7C9278] flex items-center justify-between"
              >
                <span>{t.nav.forBusinesses}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </nav>

            <div className="pt-2 border-t border-[#D8C9BE]/60 flex items-center justify-between">
              <span className="text-xs text-[#A99587] font-medium">{t.nav.language}:</span>
              <div className="flex gap-1.5">
                {(['en', 'hi', 'mr'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      handleLanguageChange(l);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1 rounded text-xs uppercase font-semibold transition-all ${
                      currentLang === l ? 'bg-[#26382D] text-[#F8F6F3]' : 'bg-[#E8CFC4]/30 text-[#26382D]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

    </>
  );

  const renderContent = () => (
    <>

      {/* -------------------------------------- */}
      {/* MAIN HOMEPAGE SECTIONS                */}
      {/* -------------------------------------- */}
      <main className="flex-1">
        
        {/* 2. HERO SECTION */}
        <section className="relative pt-32 pb-32 flex flex-col justify-center overflow-hidden bg-[#1a261e]">
          <img src={cinematicHeroImg} alt="" className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.85]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
          
          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 w-full flex flex-col items-center justify-center text-center mt-8">
            
            {/* Centered text */}
            <div className="w-full flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase mb-6 shadow-sm border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A9B8A3]"></span>
                INTELLIGENT ECO-HOSPITALITY
              </span>
              
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white font-normal leading-[1.05] tracking-tight mb-6 drop-shadow-lg">
                <span className="block font-semibold">Travel better.</span>
                <span className="block italic text-[#D8C9BE] font-light mt-2">Leave less behind.</span>
              </h1>
              
              <p className="text-white/90 text-lg md:text-xl max-w-lg mb-10 leading-relaxed font-light drop-shadow-md">
                Discover journeys, stays and experiences that balance sustainability, accessibility, cost and comfort — intelligently.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
                <button 
                  onClick={() => navigate('/auth')}
                  className="px-8 py-4 rounded-full bg-white text-[#26382D] text-xs font-bold tracking-wider hover:bg-[#F8F6F3] transition-colors flex items-center gap-2 shadow-xl hover:scale-105 duration-300"
                >
                  PLAN MY JOURNEY <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-white/80 font-bold tracking-[0.15em] uppercase">
                <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-[#D8C9BE]"/> AI-POWERED</span>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1.5"><Leaf className="w-3 h-3 text-[#D8C9BE]"/> SUSTAINABILITY-AWARE</span>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1.5"><Accessibility className="w-3 h-3 text-[#D8C9BE]"/> ACCESSIBILITY-FIRST</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. QUICK VALUE PROPOSITION (4 Simple Benefits with Evidence Badges) */}
        <section id="value-propositions" className="py-24 sm:py-32 relative z-10">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#7C9278] block mb-4">
                The Decision Matrix
              </span>
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#26382D] tracking-tight">
                {t.valueProps.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.valueProps.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-[#F8F6F3] rounded-2xl p-6 border border-[#D8C9BE]/60 shadow-[0_4px_16px_rgba(38,56,45,0.03)] hover:border-[#7C9278]/50 hover:shadow-[0_8px_24px_rgba(38,56,45,0.06)] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#26382D]/8">
                      <div className="w-10 h-10 rounded-xl bg-[#F1EDE9] flex items-center justify-center text-lg">
                        {item.symbol}
                      </div>
                      <span className="text-xs font-mono text-[#A99587]">0{idx + 1}</span>
                    </div>

                    <h3 className="text-lg font-serif font-medium text-[#26382D] mb-2 group-hover:text-[#7C9278] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-[13px] text-[#26382D]/75 font-normal leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#26382D]/6 flex items-center justify-between">
                    <DataStateBadge state={item.badgeState} label={item.tag} />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* 7. SMALL TRUST / EDITORIAL EXPLANATION SECTION */}
        <section id="editorial-philosophy" className="py-24 sm:py-32 bg-[#F8F6F3] relative z-10">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mb-16">
              
              <div className="lg:col-span-7 space-y-8">
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#7C9278]">
                  {t.editorial.kicker}
                </span>

                <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#26382D] leading-[1.05] tracking-tight text-balance">
                  {t.editorial.heading}
                </h2>

                <p className="text-base sm:text-lg text-[#26382D]/80 font-light leading-relaxed max-w-2xl">
                  {t.editorial.supporting}
                </p>

                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2 border-l-2 border-[#7C9278] pl-4">
                    <h4 className="text-sm font-semibold text-[#26382D]">{t.editorial.bullet1Title}</h4>
                    <p className="text-xs text-[#26382D]/70 font-light leading-relaxed">
                      {t.editorial.bullet1Desc}
                    </p>
                  </div>

                  <div className="space-y-2 border-l-2 border-[#A9B8A3] pl-4">
                    <h4 className="text-sm font-semibold text-[#26382D]">{t.editorial.bullet2Title}</h4>
                    <p className="text-xs text-[#26382D]/70 font-light leading-relaxed">
                      {t.editorial.bullet2Desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Editorial verified stay card */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden shadow-[0_16px_36px_rgba(38,56,45,0.08)] border border-[#D8C9BE]">
                  <div className="aspect-[4/3] w-full bg-[#D8C9BE]/30 overflow-hidden">
                    <img 
                      src={accessibleGoaImg} 
                      alt="Verified barrier-free eco retreat in Goa with ramped stone pathways and open verandas" 
                      className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="p-4 bg-[#F8F6F3] border-t border-[#D8C9BE]/50 flex items-center justify-between text-xs text-[#26382D]">
                    <div>
                      <span className="font-semibold block">Sernabatim Heritage Haven &bull; South Goa</span>
                      <span className="text-[#A99587] text-[11px]">100% Step-Free &bull; Rainwater-Harvested</span>
                    </div>
                    <DataStateBadge state="verified" label="Audited" />
                  </div>
                </div>
              </div>

            </div>

            {/* Editorial Manifesto Quote */}
            <div className="pt-12 border-t border-[#26382D]/10 flex flex-col md:flex-row items-baseline justify-between gap-8">
              <blockquote className="font-serif italic text-xl sm:text-2xl text-[#26382D]/85 max-w-3xl leading-relaxed">
                {t.editorial.manifesto}
              </blockquote>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#A99587] shrink-0">
                {t.editorial.attribution}
              </div>
            </div>

          </div>
        </section>

        {/* 8. ACCESSIBILITY + SUSTAINABILITY VISUAL (CONVERGENCE) */}
        <section className="py-24 sm:py-32 relative overflow-hidden bg-[#F1EDE9]">
          <div className="w-full px-0 text-center">
            
            <div className="max-w-3xl mx-auto mb-20 space-y-6 px-6">
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#7C9278] block">
                {t.convergence.kicker}
              </span>
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#26382D] tracking-tight text-balance">
                {t.convergence.title}
              </h2>
              <p className="text-base sm:text-xl text-[#26382D]/75 font-light leading-relaxed">
                {t.convergence.description}
              </p>
            </div>

            {/* Abstract Tasteful Visual Composition - Full Width */}
            <div className="relative w-full bg-[#F8F6F3] py-16 sm:py-24 px-6 sm:px-12 border-y border-[#D8C9BE]">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative z-10">
                
                {/* Accessibility Pillar */}
                <div className="p-6 rounded-2xl bg-[#F1EDE9]/70 border border-[#A9B8A3] text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#26382D] text-[#F8F6F3] flex items-center justify-center">
                      <Accessibility className="w-5 h-5 text-[#E8CFC4]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-medium text-[#26382D]">
                        {t.convergence.leftLabel}
                      </h3>
                      <span className="text-[11px] text-[#A99587] uppercase tracking-wider">Physical Dignity &amp; Ease</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#26382D]/80 leading-relaxed font-light mt-2">
                    {t.convergence.leftDesc}
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#D8C9BE]/50 flex items-center gap-2 text-[11px] text-[#7C9278] font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Audited door clearances &amp; platform hoists</span>
                  </div>
                </div>

                {/* Sustainability Pillar */}
                <div className="p-6 rounded-2xl bg-[#F1EDE9]/70 border border-[#7C9278]/60 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#7C9278] text-[#F8F6F3] flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-medium text-[#26382D]">
                        {t.convergence.rightLabel}
                      </h3>
                      <span className="text-[11px] text-[#7C9278] uppercase tracking-wider">Ecological Harmony</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#26382D]/80 leading-relaxed font-light mt-2">
                    {t.convergence.rightDesc}
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#D8C9BE]/50 flex items-center gap-2 text-[11px] text-[#7C9278] font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Electric rail corridors &amp; zero-waste homestays</span>
                  </div>
                </div>

              </div>

              {/* Vector Convergence Graphic */}
              <div className="my-8 relative flex items-center justify-center">
                <div className="hidden md:flex items-center justify-center w-full max-w-md">
                  <svg className="w-full h-16 text-[#A9B8A3]" viewBox="0 0 400 64" fill="none">
                    <path d="M 50 10 L 200 50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                    <path d="M 350 10 L 200 50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                    <circle cx="200" cy="50" r="5" fill="#7C9278" />
                  </svg>
                </div>
              </div>

              {/* Center Box: YOUR JOURNEY */}
              <div className="relative z-10 max-w-lg mx-auto bg-[#26382D] text-[#F8F6F3] rounded-2xl p-7 shadow-[0_16px_36px_rgba(38,56,45,0.16)] border border-[#7C9278]/30">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F8F6F3]/10 text-[#E8CFC4] text-[11px] font-mono uppercase tracking-[0.2em] mb-2">
                  <Sparkles className="w-3 h-3 text-[#E8CFC4]" />
                  Conscious Synthesis
                </div>
                <h4 className="font-serif text-2xl sm:text-3xl font-medium tracking-wide text-[#F8F6F3]">
                  {t.convergence.centerLabel}
                </h4>
                <p className="text-xs sm:text-sm text-[#F8F6F3]/80 font-light mt-1 mb-4">
                  {t.convergence.centerSub}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#F8F6F3]/15 text-center text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[#A9B8A3] text-[10px] block uppercase tracking-wider">Mobility</span>
                    <span className="font-medium">100% Step-Free</span>
                  </div>
                  <div className="space-y-0.5 border-x border-[#F8F6F3]/15 px-1">
                    <span className="text-[#A9B8A3] text-[10px] block uppercase tracking-wider">Carbon</span>
                    <span className="font-medium">-82% vs Flights</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[#A9B8A3] text-[10px] block uppercase tracking-wider">Certainty</span>
                    <span className="font-medium">Verified Evidence</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 9. BUSINESS CTA SECTION */}
        <section id="for-businesses" className="py-20 bg-[#D8C9BE]/35 border-t border-[#D8C9BE] relative z-10">
          <div className="max-w-5xl mx-auto px-6 sm:px-8">
            <div className="bg-[#F8F6F3] rounded-3xl p-8 sm:p-12 border border-[#D8C9BE] shadow-[0_8px_30px_rgba(38,56,45,0.04)] flex flex-col md:flex-row items-center justify-between gap-10">
              
              <div className="space-y-4 max-w-xl text-left">
                <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase text-[#7C9278]">
                  <Building2 className="w-4 h-4 text-[#7C9278]" />
                  <span>Hospitality &amp; Transit Operators</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#26382D] leading-tight text-balance">
                  {t.business.heading}
                </h2>

                <p className="text-sm sm:text-base text-[#26382D]/80 font-light leading-relaxed">
                  {t.business.supporting}
                </p>

                <div className="pt-2 space-y-1.5 text-xs text-[#26382D]/75">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#7C9278]" />
                    <span>{t.business.bullet1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#7C9278]" />
                    <span>{t.business.bullet2}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-center sm:items-start gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsBusinessModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#26382D] text-[#F8F6F3] text-sm font-semibold tracking-wide hover:bg-[#1a271f] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                >
                  <span>{t.business.cta}</span>
                  <ArrowRight className="w-4 h-4 text-[#A9B8A3]" />
                </button>
                <span className="text-[11px] text-[#A99587] text-center sm:text-left">
                  450+ verified eco-homestays in India
                </span>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* 10. MINIMAL DEEP FOREST FOOTER */}
      <footer className="bg-[#26382D] text-[#F8F6F3] pt-16 pb-24 md:pb-16 border-t border-[#26382D] relative z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#F8F6F3]/12">
            
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#7C9278] flex items-center justify-center text-[#26382D]">
                  <svg className="w-4 h-4 text-[#F8F6F3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                  </svg>
                </div>
                <span className="font-serif text-2xl tracking-tight font-medium text-[#F8F6F3]">
                  {t.brandName}
                </span>
              </div>

              <p className="text-xs sm:text-[13px] text-[#F8F6F3]/75 font-light leading-relaxed max-w-sm">
                {t.footer.description}
              </p>

              <div className="text-[11px] text-[#A9B8A3] font-mono tracking-wider pt-2">
                MUMBAI &bull; BENGALURU &bull; DELHI &bull; GOA &bull; KOCHI
              </div>
            </div>

            <div className="md:col-span-3 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A9B8A3]">
                Navigation
              </div>
              <ul className="text-xs space-y-2 text-[#F8F6F3]/85 font-light">
                <li>
                  <a href="#trip-input" className="hover:text-white transition-colors">
                    {t.footer.planTrip}
                  </a>
                </li>
                <li>
                  <a href="#value-propositions" className="hover:text-white transition-colors">
                    {t.footer.explore}
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => setIsBusinessModalOpen(true)} 
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    {t.footer.forBusinesses}
                  </button>
                </li>
                <li>
                  <a href="#editorial-philosophy" className="hover:text-white transition-colors">
                    {t.footer.about}
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A9B8A3]">
                {t.nav.language} Selector
              </div>

              <div className="flex items-center gap-2">
                {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      currentLang === lang
                        ? 'bg-[#7C9278] text-[#F8F6F3] font-semibold'
                        : 'bg-[#F8F6F3]/10 text-[#F8F6F3]/80 hover:bg-[#F8F6F3]/20'
                    }`}
                  >
                    {lang === 'en' ? 'English (EN)' : lang === 'hi' ? 'हिन्दी (HI)' : 'मराठी (MR)'}
                  </button>
                ))}
              </div>

              <div className="pt-2 text-[11px] text-[#A9B8A3] leading-relaxed">
                Prioritizing low-carbon electrified transit and physical accessibility standards across India.
              </div>

              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 text-xs text-[#A9B8A3] hover:text-[#F8F6F3] transition-colors pt-1 cursor-pointer"
              >
                <span>Back to top</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#F8F6F3]/60 font-light gap-4">
            <div>{t.footer.copyright}</div>
            <div className="flex items-center gap-6">
              <span className="text-[#A9B8A3]">WCAG 2.1 AA Accessible</span>
              <span>&bull;</span>
              <span className="text-[#A9B8A3]">B2C Travel Prototype</span>
            </div>
          </div>

        </div>
      </footer>

    </>
  );

  const renderModals = () => (
    <>

      {/* -------------------------------------- */}
      {/* CLARIFICATION QUESTION MODAL (A4)      */}
      {/* Asks ONE question at a time from       */}
      {/* missing_or_ambiguous returned by NLU   */}
      {/* -------------------------------------- */}
      <Modal
        isOpen={isClarificationModalOpen}
        onClose={handleSkipClarification}
        maxWidth="md"
      >
        {currentClarificationItem && (
          <div className="space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8C9BE]/60">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7C9278]">
                <Sparkles className="w-3.5 h-3.5 text-[#7C9278]" />
                <span>{t.clarification.heading}</span>
              </div>
              <span className="text-[11px] font-mono text-[#A99587]">
                {t.clarification.step} {currentClarificationIndex + 1} {t.clarification.of} {clarificationQueue.length}
              </span>
            </div>

            {/* Context line + exact prompt */}
            <div className="p-4 rounded-2xl bg-[#F1EDE9] border border-[#D8C9BE] text-[#26382D] space-y-2">
              <p className="text-xs text-[#26382D]/75 font-light leading-relaxed">
                {formatClarificationContext(currentClarificationItem.prompt)}
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#26382D]">
                {currentClarificationItem.prompt}
              </h3>
            </div>

            {/* Answer Input */}
            <div className="space-y-2">
              {currentClarificationItem.field === 'adult_count' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-[#26382D]">
                      {t.clarification.adultsLabel}:
                    </label>
                    <div className="flex items-center border border-[#D8C9BE] rounded-xl bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseInt(clarificationAnswer, 10);
                          const nextVal = isNaN(cur) ? 1 : Math.max(1, cur - 1);
                          setClarificationAnswer(String(nextVal));
                          if (clarificationError) setClarificationError(null);
                        }}
                        className="px-3.5 py-2 text-sm font-semibold text-[#26382D] hover:bg-[#F1EDE9] transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={clarificationAnswer}
                        onChange={(e) => {
                          setClarificationAnswer(e.target.value);
                          if (clarificationError) setClarificationError(null);
                        }}
                        placeholder="e.g. 2"
                        className="w-16 text-center text-sm font-semibold text-[#26382D] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseInt(clarificationAnswer, 10);
                          const nextVal = isNaN(cur) ? 1 : cur + 1;
                          setClarificationAnswer(String(nextVal));
                          if (clarificationError) setClarificationError(null);
                        }}
                        className="px-3.5 py-2 text-sm font-semibold text-[#26382D] hover:bg-[#F1EDE9] transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={clarificationAnswer}
                  onChange={(e) => {
                    setClarificationAnswer(e.target.value);
                    if (clarificationError) setClarificationError(null);
                  }}
                  placeholder={t.clarification.answerPlaceholder}
                  className="w-full p-3 text-sm rounded-xl border border-[#D8C9BE] bg-white text-[#26382D] focus:outline-none focus:border-[#7C9278]"
                />
              )}

              {/* Clarification validation message */}
              {clarificationError && (
                <div className="text-xs text-[#b91c1c] font-medium flex items-center gap-1.5 animate-in fade-in pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#b91c1c]" />
                  <span>{clarificationError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#D8C9BE]/60 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSkipClarification}
                className="w-full sm:w-auto text-xs text-[#A99587] hover:text-[#26382D] font-medium py-2 px-3 rounded-lg cursor-pointer transition-colors"
              >
                {t.clarification.skipBtn}
              </button>

              <button
                type="button"
                onClick={handleAnswerClarification}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#26382D] text-[#F8F6F3] text-xs font-semibold hover:bg-[#1a271f] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>{t.clarification.continueBtn}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#A9B8A3]" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* -------------------------------------- */}
      {/* MODAL 2: BUSINESS PARTNER REGISTRY     */}
      {/* -------------------------------------- */}
      <Modal
        isOpen={isBusinessModalOpen}
        onClose={() => setIsBusinessModalOpen(false)}
        maxWidth="lg"
      >
        <div className="text-left space-y-2 pb-4 border-b border-[#D8C9BE]/60">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7C9278]">
            <Building2 className="w-3.5 h-3.5" />
            <span>Green &amp; Inclusive Travel Network</span>
          </div>
          <h2 className="font-serif text-2xl font-medium text-[#26382D]">
            {t.business.cardTitle}
          </h2>
          <p className="text-xs text-[#26382D]/75 font-light">
            {t.business.tagline}
          </p>
        </div>

        {businessSubmitted ? (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#7C9278]/20 text-[#7C9278] mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl text-[#26382D]">Inquiry Received</h3>
            <p className="text-xs text-[#26382D]/80 max-w-xs mx-auto">
              Our audit team will connect within 24 hours to schedule your step-free and energy assessment.
            </p>
          </div>
        ) : (
          <form onSubmit={handleBusinessSubmit} className="mt-5 space-y-4 text-left">
            <div>
              <label className="block text-xs font-medium text-[#26382D] mb-1">
                Property / Service Name
              </label>
              <input
                type="text"
                required
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="e.g. Mandovi River Eco Villa, Goa"
                className="w-full text-xs p-3 rounded-xl border border-[#D8C9BE] bg-white text-[#26382D] focus:outline-none focus:border-[#7C9278]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#26382D] mb-1">
                  Region in India
                </label>
                <select
                  value={propertyLocation}
                  onChange={(e) => setPropertyLocation(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#D8C9BE] bg-white text-[#26382D] focus:outline-none"
                >
                  <option value="Goa">Goa</option>
                  <option value="Maharashtra">Maharashtra (Konkan / Mumbai)</option>
                  <option value="Kerala">Kerala (Backwaters / Wayanad)</option>
                  <option value="Rajasthan">Rajasthan (Jaipur / Udaipur)</option>
                  <option value="Karnataka">Karnataka (Coorg / Nilgiris)</option>
                  <option value="Himachal">Himachal Pradesh</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#26382D] mb-1">
                  Category
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#D8C9BE] bg-white text-[#26382D] focus:outline-none"
                >
                  <option value="Eco-Resort / Homestay">Eco-Resort / Homestay</option>
                  <option value="Accessible Ground Fleet">Accessible Ground Fleet</option>
                  <option value="Heritage Hotel">Heritage Hotel</option>
                  <option value="Activity / Tour Guide">Activity / Tour Guide</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F1EDE9] text-[11px] text-[#26382D]/75 space-y-1">
              <span className="font-semibold text-[#26382D] block">Inclusion Standards:</span>
              <p>• Verified doorway widths (&ge; 850mm) and step-free access</p>
              <p>• Renewable energy supply or zero-single-use plastics</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-5 rounded-xl bg-[#26382D] text-[#F8F6F3] text-xs font-semibold tracking-wide hover:bg-[#1f2e25] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#A9B8A3]" />
                <span>{t.business.button}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* -------------------------------------- */}
      {/* MODAL 3: SIGN IN MODAL                 */}
      {/* -------------------------------------- */}
      <Modal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        maxWidth="md"
      >
        <div className="text-center space-y-3 pt-2">
          <div className="w-12 h-12 rounded-full bg-[#7C9278]/20 text-[#26382D] mx-auto flex items-center justify-center">
            <Compass className="w-6 h-6 text-[#26382D]" />
          </div>
          <h3 className="font-serif text-2xl text-[#26382D]">Welcome to Conscious Travel</h3>
          <p className="text-sm text-[#26382D]/75 font-light">
            Sign in to save your verified accessibility preferences, low-carbon journey drafts, and favorite stays across India.
          </p>
        </div>
        <div className="mt-6 space-y-3">
          <button 
            onClick={() => setIsSignInModalOpen(false)}
            className="w-full py-3 px-4 rounded-xl bg-[#26382D] text-[#F8F6F3] text-sm font-semibold hover:bg-[#334b3d] transition-all cursor-pointer"
          >
            Sign in with Mobile OTP (India)
          </button>
          <button 
            onClick={() => setIsSignInModalOpen(false)}
            className="w-full py-3 px-4 rounded-xl bg-transparent border border-[#26382D]/20 text-[#26382D] text-sm font-semibold hover:bg-[#F1EDE9] transition-all cursor-pointer"
          >
            Continue with Email
          </button>
        </div>
        <div className="mt-5 text-center text-xs text-[#A99587]">
          Universal design standards compliant &bull; WCAG 2.1 AA
        </div>
      </Modal>


    </>
  );

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div id="top-mobile" className="flex md:hidden min-h-screen bg-[#F1EDE9] text-[#26382D] flex-col font-sans selection:bg-[#7C9278] selection:text-white pb-20">
        {renderMobileHeader()}
        {renderContent()}
        <BottomNavBar />
        {renderModals()}
      </div>

      {/* DESKTOP LAYOUT */}
      <div id="top-desktop" className="hidden md:flex min-h-screen bg-[#F1EDE9] text-[#26382D] flex-col font-sans selection:bg-[#7C9278] selection:text-white">
        <Navbar />
        {renderContent()}
        {renderModals()}
      </div>
    </>
  );
}

export default HomePage;
