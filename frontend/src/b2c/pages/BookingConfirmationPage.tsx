import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { TransportResult, ExperienceResult, ListingDetailResponse, AccommodationResult, TransportSearchRequest } from '../../lib/api';
import Navbar from '../../shared/components/Navbar';
import BottomNavBar from '../../shared/components/BottomNavBar';

interface BookingConfirmationState {
  searchPayload?: TransportSearchRequest;
  stay?: { nights: number };
  transportResult?: TransportResult;
  hotelResult?: ListingDetailResponse | AccommodationResult;
  selectedExperiences?: ExperienceResult[];
  reservation_status?: 'simulated' | 'confirmed';
}

export default function BookingConfirmationPage() {
  const { t, i18n } = useTranslation('b2c');
  const navigate = useNavigate();
  const location = useLocation();
  const lang = i18n.language as string;

  const state = (location.state as BookingConfirmationState) || {};
  const { reservation_status, hotelResult, stay, transportResult } = state;

  const handleReturnHome = () => {
    navigate('/customer-dashboard');
  };

  // Defensive handling: if we arrived without a valid reservation status
  if (!reservation_status) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] font-sans flex flex-col items-center justify-center p-4">
        <div role="alert" className="bg-white rounded-2xl shadow-sm border border-[#D8C9BE] p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-[#E88D67] mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-[#26382D] mb-2">{t('bookingConfirmation.errorTitle', 'Confirmation Error')}</h2>
          <p className="text-[#A99587] mb-6">
            {t('bookingConfirmation.errorDesc', 'We could not verify your reservation status. Please return to the homepage or check your trips.')}
          </p>
          <button 
            onClick={handleReturnHome}
            className="w-full bg-[#26382D] text-white rounded-xl py-3 font-medium hover:bg-[#1F2E25] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26382D]"
          >
            {t('bookingConfirmation.returnHome', 'Return to Home')}
          </button>
        </div>
      </div>
    );
  }

  const isSimulated = reservation_status === 'simulated';

  // Basic trip summary details if available
  const hotelTranslation = hotelResult?.translations?.[lang] || hotelResult?.translations?.['en'];
  const hotelName = hotelTranslation?.name || t('bookingConfirmation.accommodation', 'Accommodation');
  
  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="flex md:hidden flex-col min-h-screen bg-[#F8F6F3] font-sans pb-safe mb-16">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="flex flex-col w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-[#D8C9BE] p-6 text-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-[#7C9278] mx-auto mb-4" />
              
              <h1 className="text-3xl font-serif text-[#26382D] mb-2">
                {t('bookingConfirmation.paymentSuccess', 'Payment Successful')}
              </h1>

              {isSimulated ? (
                <div className="bg-[#E88D67]/10 rounded-xl p-4 my-6 text-left flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#E88D67] shrink-0 mt-0.5" />
                  <p className="text-[#26382D] text-sm leading-relaxed">
                    {t('bookingConfirmation.simulatedNotice', 'Payment confirmed (test mode). This reservation is simulated for demo purposes. Inventory was not actually reserved.')}
                  </p>
                </div>
              ) : (
                <div className="bg-[#7C9278]/10 rounded-xl p-4 my-6 text-left flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#7C9278] shrink-0 mt-0.5" />
                  <p className="text-[#26382D] text-sm leading-relaxed font-medium">
                    {t('bookingConfirmation.confirmedNotice', 'Your reservation is fully confirmed and your inventory has been secured.')}
                  </p>
                </div>
              )}

              {/* MOBILE: Detailed Trip Summary */}
              <div className="border-t border-[#D8C9BE] pt-4 mt-2 text-left w-full space-y-4">
                <h3 className="text-sm font-bold text-[#7C9278] uppercase tracking-wider mb-2">{t('bookingConfirmation.tripDetails', 'Trip Details')}</h3>
                
                {transportResult && (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-[#A99587] mb-1">Departure</p>
                      <p className="text-[#26382D] font-medium text-sm">{state.searchPayload?.origin || 'Origin City'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#A99587] mb-1">Transport Mode</p>
                      <p className="text-[#26382D] font-medium text-sm capitalize">{transportResult.mode}</p>
                    </div>
                  </div>
                )}

                {transportResult && (
                  <div>
                    <p className="text-xs text-[#A99587] mb-1">Transport</p>
                    <p className="text-[#26382D] font-medium text-sm capitalize">{transportResult.mode} Journey</p>
                  </div>
                )}

                {hotelResult && (
                  <div>
                    <p className="text-xs text-[#A99587] mb-1">Accommodation</p>
                    <p className="text-[#26382D] font-medium text-sm">{hotelName}</p>
                    {stay?.nights && <p className="text-xs text-[#A99587]">{t('tripSummary.nights', { count: stay.nights })}</p>}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 w-full mt-6">
                <button 
                  onClick={() => window.print()}
                  className="w-full bg-transparent border-2 border-[#26382D] text-[#26382D] rounded-xl py-3 font-medium flex items-center justify-center hover:bg-[#F8F6F3] transition-colors"
                >
                  Download Itinerary
                </button>
                <button 
                  onClick={handleReturnHome}
                  className="w-full bg-[#26382D] text-white rounded-xl py-3 font-medium flex items-center justify-center hover:bg-[#1F2E25] transition-colors"
                >
                  {t('bookingConfirmation.returnHome', 'Return to Home')}
                </button>
              </div>
            </div>
          </div>
        </div>
        <BottomNavBar />
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-col min-h-screen bg-[#F8F6F3] font-sans">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-sm border border-[#D8C9BE] overflow-hidden flex">
            {/* Left pane: Confirmation Status */}
            <div className="w-3/5 p-12 flex flex-col justify-center border-r border-[#D8C9BE]">
              <CheckCircle2 className="w-16 h-16 text-[#7C9278] mb-6" />
              <h1 className="text-4xl font-serif text-[#26382D] mb-4">
                {t('bookingConfirmation.paymentSuccess', 'Payment Successful')}
              </h1>
              
              {isSimulated ? (
                <div className="bg-[#E88D67]/10 rounded-xl p-5 mb-8 flex items-start gap-4">
                  <Info className="w-6 h-6 text-[#E88D67] shrink-0" />
                  <p className="text-[#26382D] text-base leading-relaxed">
                    {t('bookingConfirmation.simulatedNotice', 'Payment confirmed (test mode). This reservation is simulated for demo purposes. Inventory was not actually reserved.')}
                  </p>
                </div>
              ) : (
                <div className="bg-[#7C9278]/10 rounded-xl p-5 mb-8 flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-[#7C9278] shrink-0" />
                  <p className="text-[#26382D] text-base leading-relaxed font-medium">
                    {t('bookingConfirmation.confirmedNotice', 'Your reservation is fully confirmed and your inventory has been secured.')}
                  </p>
                </div>
              )}

              <button 
                onClick={handleReturnHome}
                className="bg-[#26382D] text-white rounded-xl py-3.5 px-6 font-medium inline-flex items-center self-start hover:bg-[#1F2E25] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#26382D]"
              >
                {t('bookingConfirmation.returnHome', 'Return to Home')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>

            {/* Right pane: Minimal Trip Summary */}
            <div className="w-2/5 bg-[#F8F6F3] p-10 flex flex-col justify-center">
              <h3 className="font-serif text-2xl text-[#26382D] mb-6">{t('bookingConfirmation.tripDetails', 'Trip Details')}</h3>
              
              <div className="space-y-6">
                {transportResult && (
                  <div className="grid grid-cols-2 gap-6 pb-6 border-b border-[#D8C9BE]">
                    <div>
                      <p className="text-sm font-medium text-[#7C9278] mb-1">Departure</p>
                      <p className="text-[#26382D] font-medium text-lg">{state.searchPayload?.origin || 'Origin City'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#7C9278] mb-1">Transport Mode</p>
                      <p className="text-[#26382D] font-medium capitalize text-lg">{transportResult.mode}</p>
                    </div>
                  </div>
                )}

                {transportResult && (
                  <div>
                    <p className="text-sm font-medium text-[#7C9278] mb-1">{t('bookingConfirmation.transport', 'Transport Method')}</p>
                    <p className="text-[#26382D] font-medium capitalize text-lg">{transportResult.mode} Journey</p>
                  </div>
                )}

                {hotelResult && (
                  <div className="pt-2">
                    <p className="text-sm font-medium text-[#7C9278] mb-1">{t('bookingConfirmation.accommodation', 'Accommodation')}</p>
                    <p className="text-[#26382D] font-medium text-lg">{hotelName}</p>
                    {stay?.nights && <p className="text-[#A99587] mt-1">{t('tripSummary.nights', { count: stay.nights })}</p>}
                  </div>
                )}
                
                <div className="pt-6 mt-6 border-t border-[#D8C9BE]">
                   <button 
                    onClick={() => window.print()}
                    className="w-full bg-transparent border-2 border-[#26382D] text-[#26382D] rounded-xl py-3.5 font-medium flex items-center justify-center hover:bg-[#F8F6F3] transition-colors"
                  >
                    Download / Print Itinerary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
