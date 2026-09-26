import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/Button';
import { BookOpen } from 'lucide-react';

export interface RulesData {
  checkIn: string;
  checkOut: string;
  cancellationPolicy: string;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  partiesAllowed: boolean;
  customRules: string[];
}

interface RulesStepProps {
  value: RulesData;
  onChange: (value: RulesData) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function RulesStep({ value, onChange, onContinue, onBack }: RulesStepProps) {
  const { t } = useTranslation();
  const [newRule, setNewRule] = useState('');

  const handleAddCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRule.trim()) {
      onChange({
        ...value,
        customRules: [...(value.customRules || []), newRule.trim()]
      });
      setNewRule('');
    }
  };

  const removeCustomRule = (index: number) => {
    const updated = [...(value.customRules || [])];
    updated.splice(index, 1);
    onChange({ ...value, customRules: updated });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#26382D] mb-2">Property Rules</h2>
        <p className="text-sm sm:text-base text-[#26382D]/70">Set clear expectations for your guests regarding check-in and policies.</p>
      </div>

      <div className="space-y-6 bg-[#F8F6F3] p-5 sm:p-8 rounded-2xl shadow-[0_4px_16px_rgba(38,56,45,0.03)] border border-[#D8C9BE]/50">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#26382D]">Check-in Time</label>
            <input
              type="time"
              className="w-full h-11 px-4 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278] focus:outline-none focus:ring-1 bg-white text-[#26382D]"
              value={value.checkIn}
              onChange={(e) => onChange({ ...value, checkIn: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#26382D]">Check-out Time</label>
            <input
              type="time"
              className="w-full h-11 px-4 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278] focus:outline-none focus:ring-1 bg-white text-[#26382D]"
              value={value.checkOut}
              onChange={(e) => onChange({ ...value, checkOut: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#26382D]">Cancellation Policy</label>
          <select
            className="w-full h-11 px-4 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278] focus:outline-none focus:ring-1 bg-white text-[#26382D]"
            value={value.cancellationPolicy}
            onChange={(e) => onChange({ ...value, cancellationPolicy: e.target.value })}
          >
            <option value="">Select a policy...</option>
            <option value="flexible">Flexible - Full refund 1 day prior to arrival</option>
            <option value="moderate">Moderate - Full refund 5 days prior to arrival</option>
            <option value="strict">Strict - 50% refund 7 days prior to arrival</option>
            <option value="non_refundable">Non-refundable</option>
          </select>
        </div>

        <div className="pt-4 space-y-3 border-t border-[#D8C9BE]/50">
          <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#D8C9BE]/60 cursor-pointer hover:border-[#7C9278]/50 transition-colors">
            <input 
              type="checkbox" 
              className="w-5 h-5 text-[#7C9278] rounded border-[#D8C9BE] focus:ring-[#7C9278]"
              checked={value.petsAllowed}
              onChange={(e) => onChange({ ...value, petsAllowed: e.target.checked })}
            />
            <span className="text-[#26382D] font-medium">Pets are allowed</span>
          </label>
          
          <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#D8C9BE]/60 cursor-pointer hover:border-[#7C9278]/50 transition-colors">
            <input 
              type="checkbox" 
              className="w-5 h-5 text-[#7C9278] rounded border-[#D8C9BE] focus:ring-[#7C9278]"
              checked={value.smokingAllowed}
              onChange={(e) => onChange({ ...value, smokingAllowed: e.target.checked })}
            />
            <span className="text-[#26382D] font-medium">Smoking is allowed</span>
          </label>
          
          <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#D8C9BE]/60 cursor-pointer hover:border-[#7C9278]/50 transition-colors">
            <input 
              type="checkbox" 
              className="w-5 h-5 text-[#7C9278] rounded border-[#D8C9BE] focus:ring-[#7C9278]"
              checked={value.partiesAllowed}
              onChange={(e) => onChange({ ...value, partiesAllowed: e.target.checked })}
            />
            <span className="text-[#26382D] font-medium">Parties and events are allowed</span>
          </label>
        </div>
        
        <div className="pt-6 border-t border-[#D8C9BE]/50">
          <label className="block text-sm font-medium text-[#26382D] mb-3">Custom Rules</label>
          {value.customRules && value.customRules.length > 0 && (
            <ul className="space-y-2 mb-4">
              {value.customRules.map((rule, idx) => (
                <li key={idx} className="flex justify-between items-center p-3 bg-white rounded-xl border border-[#D8C9BE]/60 text-sm">
                  <span className="text-[#26382D]">{rule}</span>
                  <button 
                    onClick={() => removeCustomRule(idx)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleAddCustomRule} className="flex gap-3">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="e.g., Quiet hours from 10 PM to 6 AM"
              className="flex-1 h-11 px-4 rounded-xl border border-[#D8C9BE] focus:border-[#7C9278] focus:ring-[#7C9278] focus:outline-none focus:ring-1 bg-white text-[#26382D]"
            />
            <Button type="submit" variant="outline" className="h-11 shrink-0">Add Rule</Button>
          </form>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-4 border-t border-[#D8C9BE]/40">
        <Button variant="ghost" onClick={onBack} className="w-full sm:w-auto">
          {t('onboarding.back', 'Back')}
        </Button>
        <Button variant="primary" onClick={onContinue} className="w-full sm:w-auto">
          {t('onboarding.continue', 'Continue')}
        </Button>
      </div>
    </div>
  );
}
