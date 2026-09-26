import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getExplore, ExperienceResult } from '../../lib/api';
import ExperienceCard from '../components/ExperienceCard';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Navbar from '../../shared/components/Navbar';
import BottomNavBar from '../../shared/components/BottomNavBar';

export default function ExplorePage() {
  const { city } = useParams<{ city: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('b2c');

  const location = useLocation();
  const [experiences, setExperiences] = useState<ExperienceResult[]>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<ExperienceResult[]>(
    location.state?.selectedExperiences || []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const toggleExperience = (exp: ExperienceResult) => {
    setSelectedExperiences(prev => {
      const isSelected = prev.some(e => e.id === exp.id);
      if (isSelected) {
        return prev.filter(e => e.id !== exp.id);
      }
      return [...prev, exp];
    });
  };

  const handleContinue = () => {
    navigate('/trip-summary', { state: { ...location.state, selectedExperiences } });
  };

  useEffect(() => {
    if (!city) return;
    
    let isMounted = true;
    setLoading(true);
    setError(false);
    
    getExplore(city)
      .then(data => {
        if (isMounted) {
          setExperiences(data.results || []);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });
      
    return () => { isMounted = false; };
  }, [city]);

  const handleBack = () => {
    navigate(-1);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-[#7C9278]">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="text-lg font-medium">{t('explore.loading')}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-16 flex flex-col items-center justify-center">
          <div role="alert" className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] p-8 max-w-md w-full text-center">
            <AlertCircle className="w-12 h-12 text-[#E88D67] mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-[#26382D] mb-2">{t('explore.error')}</h2>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 w-full bg-[#26382D] text-white rounded-full py-3 font-medium hover:bg-[#1F2E25] transition-colors"
            >
              {t('explore.tryAgain', 'Try Again')}
            </button>
          </div>
        </div>
      );
    }

    if (experiences.length === 0) {
      return (
        <div className="py-16 text-center">
          <div className="bg-[#F8F6F3] border border-dashed border-[#D8C9BE] rounded-2xl p-12 max-w-2xl mx-auto">
            <h3 className="text-2xl font-serif text-[#26382D] mb-3">{t('explore.empty')}</h3>
            <p className="text-[#A99587]">{t('explore.emptyHelper')}</p>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* DESKTOP LAYOUT */}
        <div className="hidden md:grid gap-6 animate-in fade-in duration-300 pb-12">
          {experiences.map(exp => (
            <ExperienceCard 
              key={exp.id} 
              experience={exp} 
              isSelected={selectedExperiences.some(e => e.id === exp.id)}
              onToggle={() => toggleExperience(exp)}
            />
          ))}
        </div>

        {/* MOBILE LAYOUT */}
        <div className="md:hidden flex flex-col gap-4 animate-in fade-in duration-300 pb-24">
          {experiences.map(exp => (
            <ExperienceCard 
              key={exp.id} 
              experience={exp} 
              isSelected={selectedExperiences.some(e => e.id === exp.id)}
              onToggle={() => toggleExperience(exp)}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="flex md:hidden flex-col min-h-screen bg-[#F8F6F3] font-sans pb-32">
        <div className="sticky top-0 z-20 bg-[#F8F6F3]/90 backdrop-blur-md px-4 py-3 border-b border-[#D8C9BE]">
          <button onClick={handleBack} className="flex items-center text-[#26382D]">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">{t('explore.goBack', 'Back')}</span>
          </button>
        </div>

        <div className="px-4 pt-4">
          <div className="mb-6 mt-2">
            <h1 className="text-2xl font-serif text-[#26382D] mb-1">
              {t('explore.title', { city: city || '' })}
            </h1>
            <p className="text-[#A99587] text-sm">
              {t('explore.subtitle')}
            </p>
          </div>
          {renderContent()}
        </div>

        {!loading && !error && (
          <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#D8C9BE] z-30 flex justify-center">
            <button 
              onClick={handleContinue}
              className="w-full px-8 py-3 bg-[#E88D67] text-white rounded-xl font-medium shadow-sm hover:bg-[#D47A56] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E88D67]"
            >
              {t('explore.continueToSummary', 'Continue to Summary')}
            </button>
          </div>
        )}
        <BottomNavBar />
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-col min-h-screen bg-[#F8F6F3] font-sans pb-24">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-8 pt-12 w-full">
          <div className="mb-8 flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="flex-shrink-0 text-[#7C9278] hover:text-[#26382D] transition-colors p-2 rounded-full hover:bg-white"
              aria-label={t('explore.goBack', 'Go back')}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-serif text-[#26382D] mb-1">
                {t('explore.title', { city: city || '' })}
              </h1>
              <p className="text-[#A99587] text-base">
                {t('explore.subtitle')}
              </p>
            </div>
          </div>
          
          {renderContent()}
        </div>

        {!loading && !error && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#D8C9BE] z-30 flex justify-center">
            <div className="w-full max-w-4xl flex items-center justify-between">
              <div className="text-sm font-medium text-[#7C9278]">
                {t('explore.selectedCount', { count: selectedExperiences.length })}
              </div>
              <button 
                onClick={handleContinue}
                className="px-8 py-3 bg-[#E88D67] text-white rounded-xl font-medium shadow-sm hover:bg-[#D47A56] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E88D67]"
              >
                {t('explore.continueToSummary', 'Continue to Summary')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
