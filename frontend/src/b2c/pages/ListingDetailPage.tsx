import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getListingDetail,
  ListingDetailResponse,
  createBookingOrder,
  verifyBookingPayment,
} from '../../lib/api';
import { loadRazorpayScript } from '../../lib/razorpay';
import { PropertyDetailTemplate } from '../../b2b/components/property/PropertyDetailTemplate';
import { Button } from '../../shared/components/Button';
import BottomNavBar from '../../shared/components/BottomNavBar';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation('b2c');

  const stateResult = location.state?.hotelResult;
  const initialListing: ListingDetailResponse | null = stateResult
    ? {
        id: stateResult.id,
        translations: stateResult.translations || { en: { name: 'Hotel' } },
        city: stateResult.city || '',
        price_inr_per_night: stateResult.price_inr_per_night || 0,
        star_rating: stateResult.star_rating,
        photos: stateResult.photos || [],
        data_state: stateResult.data_state || 'not_verified',
        accessibility_items: stateResult.accessibility_items || [],
        sustainability_items: stateResult.sustainability_items || [],
        confirmations: stateResult.confirmations || [],
        amenities: stateResult.amenities || [],
        rooms: stateResult.rooms || [],
        rules: stateResult.rules,
        address: stateResult.address,
        location: stateResult.location,
      }
    : null;

  const [listing, setListing] = useState<ListingDetailResponse | null>(initialListing);
  const [loading, setLoading] = useState<boolean>(!initialListing);
  const [error, setError] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    if (!initialListing) {
      setLoading(true);
    }
    setError(false);

    getListingDetail(id)
      .then(data => {
        if (isMounted) {
          setListing(prev => {
            if (!prev) return data;
            return {
              ...data,
              photos:
                data.photos && data.photos.length > 0 && !data.photos[0].includes('example.com')
                  ? data.photos
                  : (prev.photos && prev.photos.length > 0 ? prev.photos : data.photos),
              city: prev.city || data.city,
              price_inr_per_night: prev.price_inr_per_night || data.price_inr_per_night,
              translations:
                Object.keys(data.translations || {}).length > 0 ? data.translations : prev.translations,
              accessibility_items:
                data.accessibility_items && data.accessibility_items.length > 0
                  ? data.accessibility_items
                  : prev.accessibility_items,
              sustainability_items:
                data.sustainability_items && data.sustainability_items.length > 0
                  ? data.sustainability_items
                  : prev.sustainability_items,
              amenities: data.amenities || prev.amenities,
              rooms: data.rooms || prev.rooms,
              rules: data.rules || prev.rules,
            };
          });
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isMounted) {
          if (!initialListing) {
            setError(true);
          }
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/customer-dashboard', { state: location.state });
    }
  };

  // Razorpay Test Mode Payment Handler
  const handleBookNow = async () => {
    if (!listing || isProcessing) return;
    setIsProcessing(true);
    setPaymentError(null);

    const amountInr = Number(listing.price_inr_per_night) || 3500;

    try {
      // 1. Create order on backend
      const receiptId = `rcpt_${Date.now()}_${listing.id.slice(0, 8)}`;
      const order = await createBookingOrder({
        amount_inr: amountInr,
        currency: 'INR',
        receipt_id: receiptId,
      });

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // 3. Configure Razorpay modal
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TgZyIjprHR1Rn3';
      const currentTranslation = listing.translations?.[i18n.language] || listing.translations?.['en'];
      const hotelName = currentTranslation?.name || 'Hotel Stay';

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'EcoWay — Green & Inclusive Travel',
        description: `Booking for ${hotelName}`,
        handler: async function (response: any) {
          setIsProcessing(true);
          try {
            const verification = await verifyBookingPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verification.payment_verified) {
              navigate('/transport', {
                state: {
                  ...location.state,
                  hotelResult: listing,
                  reservation_status: verification.reservation_status || 'simulated',
                  payment: response,
                },
              });
            } else {
              setPaymentError('Payment verification failed. Please try again.');
              setIsProcessing(false);
            }
          } catch (err: any) {
            setPaymentError(err.message || 'Error verifying payment.');
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
        theme: {
          color: '#26382D',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setPaymentError(response.error?.description || 'Payment failed. Please try again.');
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      setPaymentError(err.message || 'Could not initialize payment.');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex flex-col items-center justify-center p-6 text-[#7C9278]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-lg font-medium">{t('listing.loading', 'Loading property details...')}</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] p-4 md:p-8 flex flex-col items-center justify-center">
        <div role="alert" className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-[#E88D67] mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-[#26382D] mb-2">{t('listing.error', 'Unable to Load Property')}</h2>
          <p className="text-[#A99587] mb-6">{t('listing.notFound', 'We could not find details for this property.')}</p>
          <button
            onClick={handleBack}
            className="w-full bg-[#26382D] text-white rounded-full py-3 font-medium hover:bg-[#1F2E25] transition-colors"
          >
            {t('accommodation.backToSearch', 'Back to Search')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3] flex flex-col font-sans text-[#26382D]">
      {/* TOP HEADER BAR — ALWAYS VISIBLE, NO FLOATING NAVBAR OVERLAY */}
      <header className="bg-white border-b border-[#D8C9BE]/70 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button
            onClick={handleBack}
            id="back-to-search-btn"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-[#26382D] bg-[#F1EDE9] hover:bg-[#E5DFD6] active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#7C9278]" />
            <span>{t('accommodation.backToSearch', 'Back to Search')}</span>
          </button>

          <span className="text-xs font-semibold uppercase tracking-wider text-[#7C9278] bg-[#F1EDE9] px-3.5 py-1 rounded-full border border-[#D8C9BE]/50">
            {listing.city}
          </span>
        </div>
      </header>

      {/* PROPERTY DETAIL TEMPLATE (CUSTOMER PREVIEW FORMAT) */}
      <main className="flex-1">
        <PropertyDetailTemplate
          listing={listing}
          mode="customer-preview"
          actionButton={
            <div className="flex flex-col gap-2 w-full">
              {paymentError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg text-center">
                  {paymentError}
                </div>
              )}
              <Button
                variant="primary"
                disabled={isProcessing}
                className="w-full py-3.5 text-sm font-bold shadow-md tracking-wide bg-[#26382D] hover:bg-[#1b2b20] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-white rounded-xl"
                onClick={handleBookNow}
                id="book-now-btn"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <span>Book Now</span>
                )}
              </Button>
            </div>
          }
        />
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden">
        <BottomNavBar />
      </div>
    </div>
  );
}
