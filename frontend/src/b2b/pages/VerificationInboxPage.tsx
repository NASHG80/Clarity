import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getVerificationInbox, respondToVerificationSubmission, VerificationSubmission } from '../../lib/api';

import { Button } from '../../shared/components/Button';
import { Loader2, AlertCircle, FileQuestion, CheckCircle2, ShieldCheck, Users, Check, X } from 'lucide-react';
import { DataStateBadge } from '../../shared/components/DataStateBadge';
import { getLocalizedLabel } from '../utils/labels';

export default function VerificationInboxPage() {
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<VerificationSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string, message: string } | null>(null);

  const businessId = "biz_001";

  const fetchInbox = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getVerificationInbox(businessId);
      setSubmissions(res.pending_submissions || []);
      setIsDemo(res.is_demo_data || false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch verification inbox');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, [businessId]);

  const handleAction = async (id: string, action: 'accept' | 'dispute') => {
    try {
      setProcessingId(id);
      setActionFeedback(null);
      const res = await respondToVerificationSubmission(businessId, id, action);
      if (res.success) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
        setActionFeedback({ 
          id, 
          message: action === 'accept' ? t('verificationInbox.accepted', 'Accepted') : t('verificationInbox.disputed', 'Disputed')
        });
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to process action');
    } finally {
      setProcessingId(null);
    }
  };

  const renderPropertyState = (state: string) => {
    switch (state) {
      case 'not_verified':
        return {
          icon: <FileQuestion className="w-4 h-4 text-[#26382D]/50" />,
          text: t('propertyState.notVerified', 'No reportable information for this feature'),
          textColor: 'text-[#26382D]/70',
          bgColor: 'bg-[#F8F6F3]'
        };
      case 'reported':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
          text: t('propertyState.reported', 'Reported by property'),
          textColor: 'text-blue-800',
          bgColor: 'bg-blue-50'
        };
      case 'verified':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-green-600" />,
          text: t('propertyState.verified', 'Verified evidence available'),
          textColor: 'text-green-800',
          bgColor: 'bg-green-50'
        };
      case 'community_confirmed':
        return {
          icon: <Users className="w-4 h-4 text-purple-600" />,
          text: t('propertyState.communityConfirmed', 'Confirmed by travelers'),
          textColor: 'text-purple-800',
          bgColor: 'bg-purple-50'
        };
      case 'demo_synthetic':
        return {
          icon: <AlertCircle className="w-4 h-4 text-orange-500" />,
          text: t('propertyState.demoSynthetic', 'Synthetic demo data'),
          textColor: 'text-orange-800',
          bgColor: 'bg-orange-50'
        };
      default:
        return {
          icon: <FileQuestion className="w-4 h-4 text-[#26382D]/50" />,
          text: state,
          textColor: 'text-[#26382D]/70',
          bgColor: 'bg-[#F8F6F3]'
        };
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-serif font-bold text-[#26382D]">
                {t('verificationInbox.title', 'Verification Inbox')}
              </h1>
              {isDemo && <DataStateBadge state="demo_synthetic" />}
            </div>
            <p className="text-[#26382D]/70 mt-2 text-lg">
              {t('verificationInbox.subtitle', 'Review traveler-submitted accessibility confirmations and corrections.')}
            </p>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-[#7C9278] mb-4" />
            <p className="text-[#26382D]/70">{t('verificationInbox.loading', 'Loading inbox...')}</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">{t('verificationInbox.errorTitle', 'Could not load inbox')}</h2>
            <p className="text-red-700 mb-6">{t('verificationInbox.errorDesc', 'There was a problem retrieving your verification inbox. Please try again.')}</p>
            <Button variant="primary" onClick={fetchInbox}>
              {t('verificationInbox.retry', 'Retry')}
            </Button>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white border border-[#D8C9BE] rounded-xl p-12 flex flex-col items-center text-center shadow-sm">
            <div className="w-16 h-16 bg-[#F8F6F3] rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-[#7C9278]">✓</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-[#26382D] mb-2">{t('verificationInbox.empty', 'No pending confirmation submissions.')}</h2>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#D8C9BE]/50 pb-4">
              <h2 className="text-xl font-bold text-[#26382D]">
                {t('verificationInbox.pending', 'Pending confirmations')}
              </h2>
              <span className="bg-[#7C9278] text-white text-sm font-bold px-3 py-1 rounded-full">
                {submissions.length}
              </span>
            </div>

            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 text-sm font-bold text-[#26382D]/50 uppercase tracking-wider">
              <div className="col-span-3">{t('verificationInbox.featureLabel', 'Feature')}</div>
              <div className="col-span-6">{t('verificationInbox.submissionContext', 'Traveler submission')}</div>
              <div className="col-span-3 text-right">{t('common.actions', 'Actions')}</div>
            </div>

            <div className="flex flex-col gap-4">
              {actionFeedback && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm transition-all">
                  <CheckCircle2 className="w-5 h-5" />
                  {actionFeedback.message}
                </div>
              )}
              
              {submissions.map((sub) => {
                const isProcessing = processingId === sub.id;
                const stateConfig = renderPropertyState(sub.property_data_state);

                return (
                  <div key={sub.id} className="bg-white rounded-xl shadow-sm border border-[#D8C9BE] overflow-hidden transition-all hover:shadow-md">
                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-12 gap-4 p-6 items-center">
                      <div className="col-span-3">
                        <h3 className="font-serif font-bold text-[#26382D] text-lg">
                          {getLocalizedLabel(sub.item_label, t)}
                        </h3>
                        <p className="text-xs text-[#26382D]/50 mt-1 font-medium">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="col-span-6 flex flex-col gap-3 border-l border-[#D8C9BE]/30 pl-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#26382D]">
                            {sub.submission_type === 'correction' 
                              ? t('verificationInbox.correctionSubmitted', 'Traveler submitted a correction')
                              : t('verificationInbox.confirmationSubmitted', 'Traveler confirmed this feature')}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs uppercase font-bold tracking-wider text-[#26382D]/50">
                            {t('verificationInbox.currentPropertyState', 'Current property information')}:
                          </span>
                          <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md ${stateConfig.bgColor} w-fit`}>
                            {stateConfig.icon}
                            <span className={`text-xs font-semibold ${stateConfig.textColor}`}>
                              {stateConfig.text}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-3 flex justify-end gap-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleAction(sub.id, 'dispute')}
                          className="text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300"
                        >
                          <X className="w-4 h-4 mr-1.5" />
                          {t('verificationInbox.dispute', 'Dispute')}
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleAction(sub.id, 'accept')}
                        >
                          <Check className="w-4 h-4 mr-1.5" />
                          {t('verificationInbox.accept', 'Accept')}
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="flex flex-col md:hidden p-5 gap-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif font-bold text-[#26382D] text-lg">
                            {getLocalizedLabel(sub.item_label, t)}
                          </h3>
                          <p className="text-xs text-[#26382D]/50 mt-0.5 font-medium">
                            {new Date(sub.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#F8F6F3] p-4 rounded-lg flex flex-col gap-4 border border-[#D8C9BE]/50">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-[#26382D]">
                            {sub.submission_type === 'correction' 
                              ? t('verificationInbox.correctionSubmitted', 'Traveler submitted a correction')
                              : t('verificationInbox.confirmationSubmitted', 'Traveler confirmed this feature')}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs uppercase font-bold tracking-wider text-[#26382D]/50">
                            {t('verificationInbox.currentPropertyState', 'Current property information')}:
                          </span>
                          <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md ${stateConfig.bgColor}`}>
                            {stateConfig.icon}
                            <span className={`text-xs font-semibold ${stateConfig.textColor}`}>
                              {stateConfig.text}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-1">
                        <Button 
                          variant="outline" 
                          disabled={isProcessing}
                          onClick={() => handleAction(sub.id, 'dispute')}
                          className="flex-1 text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300"
                        >
                          <X className="w-4 h-4 mr-2" />
                          {t('verificationInbox.dispute', 'Dispute')}
                        </Button>
                        <Button 
                          variant="primary" 
                          disabled={isProcessing}
                          onClick={() => handleAction(sub.id, 'accept')}
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {t('verificationInbox.accept', 'Accept')}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </main>
  );
}
