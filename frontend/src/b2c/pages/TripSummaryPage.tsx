import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TransportResult, ExperienceResult, ListingDetailResponse, AccommodationResult, TransportSearchRequest, AccommodationSearchRequest, createBookingOrder, verifyBookingPayment } from '../../lib/api';
import { loadRazorpayScript } from '../../lib/razorpay';
import { formatCurrencyINR } from '../../lib/formatters';
import { ArrowLeft, AlertCircle, Train, Plane, Bus, Car, Building2, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import Navbar from '../../shared/components/Navbar';
import BottomNavBar from '../../shared/components/BottomNavBar';

interface TripSummaryState {
  searchPayload?: TransportSearchRequest | AccommodationSearchRequest;
  stay?: { nights: number };
  transportResult?: TransportResult;
  hotelResult?: ListingDetailResponse | AccommodationResult;
  selectedExperiences?: ExperienceResult[];
}

const getModeIcon = (mode: string) => {
  switch (mode.toLowerCase()) {
    case 'flight':
    case 'air':
      return <Plane className="w-5 h-5 text-[#A99587]" />;
    case 'train':
      return <Train className="w-5 h-5 text-[#A99587]" />;
    case 'bus':
      return <Bus className="w-5 h-5 text-[#A99587]" />;
    case 'taxi':
    case 'car':
      return <Car className="w-5 h-5 text-[#A99587]" />;
    default:
      return <Bus className="w-5 h-5 text-[#A99587]" />;
  }
};

export default function TripSummaryPage() {
  const { t, i18n } = useTranslation('b2c');
  const navigate = useNavigate();
  const location = useLocation();
  const lang = i18n.language as string;

  const state = (location.state as TripSummaryState) || {};
  const { transportResult, hotelResult, stay, selectedExperiences = [] } = state;

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const formatCurrency = formatCurrencyINR;

  const handleBack = () => navigate(-1);

  // Validate state - allow booking just transport or just hotel
  const isInvalid = !transportResult && !hotelResult;

  if (isInvalid) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] font-sans flex flex-col items-center justify-center p-4">
        <div role="alert" className="bg-white rounded-2xl shadow-sm border border-[#D8C9BE] p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-[#E88D67] mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-[#26382D] mb-2">{t('tripSummary.errorTitle', 'Incomplete Trip')}</h2>
          <p className="text-[#A99587] mb-6">
            {t('tripSummary.errorDesc', 'Your trip selections are incomplete. Please start over from the search page.')}
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-[#26382D] text-white rounded-xl py-3 font-medium hover:bg-[#1F2E25] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26382D]"
          >
            {t('tripSummary.startOver', 'Start Over')}
          </button>
        </div>
      </div>
    );
  }

  // Calculations
  const transportCost = transportResult?.cost_inr || 0;
  // @ts-ignore - price_inr_per_night exists on both ListingDetailResponse and AccommodationResult
  const hotelPricePerNight = hotelResult?.price_inr_per_night || 0;
  
  let calculatedNights = stay?.nights;
  if (!calculatedNights && state.searchPayload && 'arrival_date' in state.searchPayload && state.searchPayload.arrival_date && state.searchPayload.departure_date) {
    const start = new Date(state.searchPayload.arrival_date);
    const end = new Date(state.searchPayload.departure_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    calculatedNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  const stayNights = calculatedNights || 3; // Default to 3 nights if undefined
  
  const accommodationTotal = hotelPricePerNight * stayNights;
  const experienceTotal = selectedExperiences.reduce((sum, exp) => sum + (exp.cost_inr || 0), 0);
  const tripTotal = transportCost + accommodationTotal + experienceTotal;

  const hotelTranslation = hotelResult?.translations?.[lang] || hotelResult?.translations?.['en'];
  const hotelName = hotelTranslation?.name || 'Unknown Hotel';
  // @ts-ignore
  const hotelCity = hotelResult?.city || '';

  const handlePayment = async () => {
    setPaymentError(null);
    setIsProcessing(true);

    try {
      const receiptId = crypto.randomUUID();
      const order = await createBookingOrder({
        amount_inr: tripTotal,
        currency: 'INR',
        receipt_id: receiptId,
      });

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error(t('tripSummary.scriptLoadError', 'Razorpay script failed to load.'));
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: t('tripSummary.companyName', 'CLARITY'),
        description: t('tripSummary.paymentDescription', 'Secure your trip'),
        handler: async function (response: any) {
          setIsProcessing(true);
          setPaymentError(null);
          try {
            const verification = await verifyBookingPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            if (verification.payment_verified) {
              navigate('/booking-confirmation', { 
                state: { 
                  ...location.state, 
                  reservation_status: verification.reservation_status 
                } 
              });
            } else {
              setPaymentError(t('tripSummary.verificationFailed', 'Payment verification failed. Please try again.'));
              setIsProcessing(false);
            }
          } catch (err: any) {
            setPaymentError(err.message || t('tripSummary.verificationError', 'Error verifying payment.'));
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        },
        theme: {
          color: '#26382D'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setPaymentError(response.error.description || t('tripSummary.paymentFailed', 'Payment failed.'));
        setIsProcessing(false);
      });
      rzp.open();

    } catch (err: any) {
      setPaymentError(err.message || t('tripSummary.initError', 'Could not initialize payment.'));
      setIsProcessing(false);
    }
  };

  const renderContent = () => (
    <div className="flex flex-col md:flex-row gap-8">
      
      {/* Main Itinerary Content */}
      <div className="flex-1 space-y-6">
        
        {/* Transport Section */}
        {transportResult && (
          <section className="bg-white rounded-2xl border border-[#D8C9BE] shadow-sm overflow-hidden">
            <div className="bg-[#F8F6F3] px-5 py-3 border-b border-[#D8C9BE] flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#26382D]">{t('tripSummary.transport', 'Transport')}</h3>
              {transportResult.accessibility?.data_state === 'demo_synthetic' && (
                <span className="text-[10px] font-bold text-[#E88D67] uppercase bg-[#E88D67]/10 px-1.5 py-0.5 rounded">{t('results.badgeDemo', 'DEMO')}</span>
              )}
            </div>
              <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#F8F6F3] flex items-center justify-center shrink-0 mt-1">
                    {getModeIcon(transportResult.mode)}
                  </div>
                  <div>
                    <div className="text-[#26382D] font-bold capitalize text-lg">
                      {transportResult.mode} Journey
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      {state.searchPayload && 'origin' in state.searchPayload && state.searchPayload.origin && state.searchPayload.destination && (
                        <div className="text-sm font-medium text-[#26382D]">
                          {state.searchPayload.origin} → {state.searchPayload.destination}
                        </div>
                      )}
                      <div className="text-[#A99587] text-sm mt-0.5">
                        Duration: {Math.floor((transportResult.duration_minutes || 0) / 60)}h {(transportResult.duration_minutes || 0) % 60}m
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right font-medium text-[#26382D] text-lg shrink-0">
                  {formatCurrency(transportCost)}
                </div>
              </div>
          </section>
        )}

        {/* Accommodation Section */}
        {hotelResult && (
          <section className="bg-white rounded-2xl border border-[#D8C9BE] shadow-sm overflow-hidden">
            <div className="bg-[#F8F6F3] px-5 py-3 border-b border-[#D8C9BE] flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#26382D]">{t('tripSummary.accommodation', 'Accommodation')}</h3>
              {/* @ts-ignore */}
              {hotelResult.data_state === 'demo_synthetic' && (
                <span className="text-[10px] font-bold text-[#E88D67] uppercase bg-[#E88D67]/10 px-1.5 py-0.5 rounded">{t('results.badgeDemo', 'DEMO')}</span>
              )}
            </div>
            <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F8F6F3] flex items-center justify-center shrink-0 mt-1">
                  <Building2 className="w-5 h-5 text-[#A99587]" />
                </div>
                <div>
                  <div className="text-[#26382D] font-medium pr-4">{hotelName}</div>
                  <div className="text-[#A99587] text-sm mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {hotelCity}
                  </div>
                  <div className="text-[#7C9278] text-sm mt-1">
                    {t('tripSummary.nights', { count: stayNights })} × {formatCurrency(hotelPricePerNight)} {t('tripSummary.perNightLabel', 'per night')}
                  </div>
                </div>
              </div>
              <div className="text-right font-medium text-[#26382D] shrink-0 self-end sm:self-auto">
                {formatCurrency(accommodationTotal)}
              </div>
            </div>
          </section>
        )}

        {/* Experiences Section */}
        <section className="bg-white rounded-2xl border border-[#D8C9BE] shadow-sm overflow-hidden">
          <div className="bg-[#F8F6F3] px-5 py-3 border-b border-[#D8C9BE] flex items-center justify-between">
            <h3 className="font-serif text-lg text-[#26382D]">{t('tripSummary.experiences', 'Experiences')}</h3>
            <span className="text-xs font-medium text-[#7C9278] bg-white px-2 py-0.5 rounded-full border border-[#D8C9BE]">
              {t('tripSummary.selectedExperiences', { count: selectedExperiences.length })}
            </span>
          </div>
          <div className="p-0">
            {selectedExperiences.length === 0 ? (
              <div className="p-5 text-[#A99587] text-sm italic">
                {t('tripSummary.noExperiences', 'No experiences selected.')}
              </div>
            ) : (
              <div className="divide-y divide-[#F8F6F3]">
                {selectedExperiences.map((exp) => {
                  const expTrans = exp.translations?.[lang] || exp.translations?.['en'];
                  const isDemo = exp.data_state === 'demo_synthetic';
                  return (
                    <div key={exp.id} className="p-5 flex justify-between items-center">
                      <div>
                        <div className="text-[#26382D] font-medium pr-4 flex items-center gap-2">
                          {expTrans?.name || 'Unknown'}
                          {isDemo && <span className="text-[10px] font-bold text-[#E88D67] uppercase bg-[#E88D67]/10 px-1 py-0.5 rounded">{t('results.badgeDemo', 'DEMO')}</span>}
                        </div>
                        <div className="text-[#A99587] text-sm mt-0.5">
                          {exp.duration_minutes} min
                        </div>
                      </div>
                      <div className="text-right font-medium text-[#26382D]">
                        {exp.cost_inr === 0 ? t('explore.costFree', 'Free') : formatCurrency(exp.cost_inr)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Sticky Total & CTA (Desktop Sidebar / Mobile Bottom) */}
      <div className="w-full md:w-80 shrink-0">
        <div className="sticky top-8 bg-white rounded-2xl border border-[#D8C9BE] shadow-sm p-6">
          <h3 className="font-serif text-xl text-[#26382D] mb-4">{t('tripSummary.priceBreakdown', 'Price Breakdown')}</h3>
          
          <div className="space-y-3 mb-6 text-sm">
            <div className="flex justify-between text-[#7C9278]">
              <span>{t('tripSummary.transport', 'Transport')}</span>
              <span>{formatCurrency(transportCost)}</span>
            </div>
            <div className="flex justify-between text-[#7C9278]">
              <span>{t('tripSummary.accommodation', 'Accommodation')}</span>
              <span>{formatCurrency(accommodationTotal)}</span>
            </div>
            {selectedExperiences.length > 0 && (
              <div className="flex justify-between text-[#7C9278]">
                <span>{t('tripSummary.experiences', 'Experiences')}</span>
                <span>{formatCurrency(experienceTotal)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-[#D8C9BE] pt-4 mb-6">
            <div className="flex justify-between items-end">
              <span className="font-medium text-[#26382D]">{t('tripSummary.total', 'Total')}</span>
              <span className="text-2xl font-serif text-[#26382D]">{formatCurrency(tripTotal)}</span>
            </div>
          </div>

          {paymentError && (
            <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{paymentError}</span>
            </div>
          )}

          <button 
            onClick={handlePayment}
            disabled={isProcessing}
            className={`w-full text-white rounded-xl py-3.5 font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E88D67] flex items-center justify-center ${
              isProcessing 
                ? 'bg-[#A99587] cursor-not-allowed' 
                : 'bg-[#E88D67] hover:bg-[#D47A56]'
            }`}
          >
            {isProcessing && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {isProcessing ? t('tripSummary.processing', 'Processing...') : t('tripSummary.checkout', 'Proceed to Checkout')}
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="flex md:hidden flex-col min-h-screen bg-[#F8F6F3] font-sans pb-24">
        <div className="sticky top-0 z-20 bg-[#F8F6F3]/90 backdrop-blur-md px-4 py-3 border-b border-[#D8C9BE]">
          <button onClick={handleBack} className="flex items-center text-[#26382D]">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">{t('results.goBack', 'Go Back')}</span>
          </button>
        </div>

        <div className="px-4 pt-4">
          <div className="mb-6 mt-2">
            <h1 className="text-2xl font-serif text-[#26382D] mb-1">
              {t('tripSummary.title', 'Trip Summary')}
            </h1>
            <p className="text-[#A99587] text-sm">
              {t('tripSummary.subtitle', 'Review your selections before booking.')}
            </p>
          </div>
          {renderContent()}
        </div>
        <BottomNavBar />
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-col min-h-screen bg-[#F8F6F3] font-sans">
        
        <div className="max-w-5xl mx-auto px-8 pt-12 w-full pb-12">
          <div className="mb-8 flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="flex-shrink-0 text-[#7C9278] hover:text-[#26382D] transition-colors p-2 rounded-full hover:bg-white focus-visible:outline-none"
              aria-label={t('results.goBack', 'Go Back')}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-serif text-[#26382D] mb-1">
                {t('tripSummary.title', 'Trip Summary')}
              </h1>
              <p className="text-[#A99587] text-base">
                {t('tripSummary.subtitle', 'Review your selections before booking.')}
              </p>
            </div>
          </div>

          {renderContent()}
        </div>
      </div>
    </>
  );
}
