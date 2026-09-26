import React, { useState, useEffect, useRef } from 'react';

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ items, activeTab, onChange, className = '' }: TabsProps) {
  const activeIndex = items.findIndex((t) => t.id === activeTab);
  
  return (
    <div className={`w-full ${className}`}>
      {/* Mobile scrollable tabs / Desktop flex tabs */}
      <div className="relative border-b border-[#D8C9BE]/60">
        <div
          className="flex overflow-x-auto hide-scrollbar"
          role="tablist"
          aria-label="Content Tabs"
        >
          {items.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                disabled={tab.disabled}
                onClick={() => onChange(tab.id)}
                className={`relative flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:ring-offset-1
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${isActive ? 'text-[#26382D]' : 'text-[#26382D]/60 hover:text-[#26382D]/80'}`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C9278] rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
