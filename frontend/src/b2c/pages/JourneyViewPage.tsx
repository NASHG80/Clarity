import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TransportResult } from '../../lib/api';
import JourneySegmentTimeline from '../components/JourneySegmentTimeline';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '../../shared/components/Navbar';
import BottomNavBar from '../../shared/components/BottomNavBar';

interface RouteNavigationState {
  result?: TransportResult;
}

export default function JourneyViewPage() {
  const { t } = useTranslation('b2c');
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as RouteNavigationState | null;
  const result = state?.result;
  const [isPaying, setIsPaying] = React.useState(false);

  const handlePayment = async () => {
    if (!result) return;
    setIsPaying(true);
    try {
      const configRes = await fetch('/api/booking/config');
      const { key_id } = await configRes.json();

      const orderRes = await fetch('/api/booking/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_inr: result.cost_inr, currency: 'INR', receipt_id: 'receipt_' + Date.now() })
      });
      
      if (!orderRes.ok) throw new Error('Order creation failed');
      const order = await orderRes.json();

      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'CLARITY',
        description: 'Test Booking',
        order_id: order.order_id,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/booking/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.payment_verified) {
             navigate('/booking-confirmation', { state: { result, payment: response } });
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#26382D'
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error(err);
      alert('Payment initialization failed. Check console for details.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleBackToResults = () => {
    navigate(-1); // Go back to results
  };

  const handleBackToSearch = () => {
    navigate('/requirements'); // Go back to search
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-[#A99587] mb-4" />
          <h2 className="text-2xl font-serif font-medium text-[#26382D] mb-2">
            {t('journey.unavailable')}
          </h2>
          <p className="text-[#A99587] mb-8 text-center max-w-md">
            {t('journey.unavailableHelper')}
          </p>
          <button
            type="button"
            onClick={handleBackToSearch}
            className="bg-[#26382D] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#3A5043] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#26382D]"
          >
            {t('journey.backToSearch')}
          </button>
        </main>
        <BottomNavBar />
      </div>
    );
  }

  const renderContent = () => (
    <>
      <div className="hidden md:flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto px-8 py-8">
        <div className="flex-1 max-w-3xl">
          <div className="bg-white rounded-2xl p-6 border border-[#D8C9BE] shadow-sm">
            <JourneySegmentTimeline segments={result.segments} />
          </div>
        </div>
        
        {/* Desktop Right Sidebar (Info summary / Deferred map placeholder) */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-[#EAE4DD] rounded-xl p-6 border border-[#D8C9BE] sticky top-32">
            <h3 className="font-serif text-lg font-medium text-[#26382D] mb-4">{t('journey.infoTitle', 'Journey Info')}</h3>
            <p className="text-sm text-[#A99587]">
              {t('journey.deferredMap', 'Google Maps overlay is deferred (requires route geometry).')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex md:hidden flex-col gap-6 px-4 py-6 w-full">
        <JourneySegmentTimeline segments={result.segments} />
      </div>
    </>
  );

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="flex md:hidden flex-col min-h-screen bg-[#F8F6F3] font-sans pb-24">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#D8C9BE] px-4 py-4">
          <button
            type="button"
            onClick={handleBackToResults}
            className="flex items-center gap-2 text-[#7C9278] hover:text-[#26382D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] rounded px-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium text-sm">{t('journey.backToResults')}</span>
          </button>
          
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-medium text-[#26382D]">
                {t('journey.title')}
              </h1>
              <p className="text-sm text-[#A99587] mt-1 capitalize">
                {result.mode.replace(/\+/g, ' + ')}
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-sm text-[#A99587] block mb-1">{t('journey.totalTime', 'Total Time')}</span>
              <span className="font-semibold text-[#26382D] text-lg bg-[#F8F6F3] px-3 py-1 rounded">
                {t('journey.duration', { minutes: result.duration_minutes })}
              </span>
            </div>
          </div>
        </div>
        
        <main className="flex-1 w-full">
          <div className="flex md:hidden flex-col gap-6 px-4 py-6 w-full">
            <JourneySegmentTimeline segments={result.segments} />
          </div>
        </main>
        
        <BottomNavBar />
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-col min-h-screen bg-[#F8F6F3] font-sans">
        <Navbar />
        
        {/* Desktop Header */}
        <div className="bg-white border-b border-[#D8C9BE] sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <button
              type="button"
              onClick={handleBackToResults}
              className="flex items-center gap-2 text-[#7C9278] hover:text-[#26382D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] rounded mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium text-sm">{t('journey.backToResults')}</span>
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-serif font-medium text-[#26382D]">
                  {t('journey.title')}
                </h1>
                <p className="text-sm text-[#A99587] mt-1 capitalize">
                  {result.mode.replace(/\+/g, ' + ')}
                </p>
              </div>
              
              <div className="text-right">
                <span className="text-sm text-[#A99587] block mb-1">{t('journey.totalTime', 'Total Time')}</span>
                <span className="font-semibold text-[#26382D] text-lg bg-[#F8F6F3] px-3 py-1 rounded">
                  {t('journey.duration', { minutes: result.duration_minutes })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-8">
          <div className="hidden md:flex flex-col lg:flex-row gap-8">
            <div className="flex-1 max-w-3xl">
              <div className="bg-white rounded-2xl p-6 border border-[#D8C9BE] shadow-sm">
                <JourneySegmentTimeline segments={result.segments} />
              </div>
            </div>
            
            <div className="w-80 flex-shrink-0">
              <div className="bg-[#EAE4DD] rounded-xl p-6 border border-[#D8C9BE] sticky top-32">
                <h3 className="font-serif text-lg font-medium text-[#26382D] mb-4">Journey Summary</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-[#26382D]">
                    <span>Total Cost</span>
                    <span className="font-bold">₹{result.cost_inr}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#26382D]">
                    <span>Total Duration</span>
                    <span className="font-bold">{Math.floor(result.duration_minutes/60)}h {result.duration_minutes%60}m</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#26382D]">
                    <span>Estimated CO₂e</span>
                    <span className="font-bold">{result.emissions?.co2e_kg?.toFixed(1) || 0} kg</span>
                  </div>
                </div>
                
                <button
                  onClick={handlePayment}
                  disabled={isPaying}
                  className="w-full bg-[#26382D] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#1a261f] flex items-center justify-center gap-2"
                >
                  {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₹${result.cost_inr} to Book`}
                </button>
                <p className="text-xs text-center text-[#7C9278] mt-3">
                  This is a test checkout. No real money will be charged.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
