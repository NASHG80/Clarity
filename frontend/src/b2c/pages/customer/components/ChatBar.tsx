import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

/**
 * ChatBar — UI shell only.
 * The input is rendered but sends no requests to the backend.
 * This is an intentional placeholder for a future NLU-based chat feature.
 */
export default function ChatBar() {
  const { t } = useTranslation('b2c');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#F8F6F3]/90 backdrop-blur-sm border-t border-[#D8C9BE] px-4 py-3">
      <div className="max-w-[1440px] mx-auto flex items-center gap-3">
        <input
          id="dashboard-chat-input"
          type="text"
          placeholder={t('dashboard.chatPlaceholder')}
          disabled
          className="flex-1 px-4 py-2.5 bg-white border border-[#D8C9BE] rounded-full text-[13px] text-[#26382D] placeholder:text-[#A99587] focus:outline-none cursor-not-allowed opacity-70"
        />
        <button
          disabled
          className="w-9 h-9 rounded-full bg-[#D8C9BE] flex items-center justify-center cursor-not-allowed"
        >
          <ArrowRight className="w-4 h-4 text-[#A99587]" />
        </button>
      </div>
    </div>
  );
}
