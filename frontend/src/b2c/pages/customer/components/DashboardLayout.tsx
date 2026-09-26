import React from 'react';

interface DashboardLayoutProps {
  filterPanel: React.ReactNode;
  canvas: React.ReactNode;
  memoryRail: React.ReactNode;
}

/**
 * 3-column desktop layout for the Smart Trip Planning Workspace.
 * Left: FilterPanel (240px fixed)
 * Center: PlanningCanvas (flex-1, scrollable)
 * Right: MemoryRail (280px fixed)
 *
 * Mobile (< md): single column — filter panel hidden by default,
 * canvas shown first, memory rail below.
 */
export default function DashboardLayout({ filterPanel, canvas, memoryRail }: DashboardLayoutProps) {
  return (
    <div className="w-full h-full max-w-[1440px] mx-auto px-4 md:px-6">
      {/* Desktop 3-column grid */}
      <div className="hidden md:grid md:grid-cols-[240px_1fr_280px] md:gap-4 md:h-[calc(100vh-4rem)] md:items-start">
        {/* Left — Filter Panel */}
        <aside className="sticky top-4 overflow-y-auto max-h-[calc(100vh-4rem)] pr-2 scrollbar-hide">
          {filterPanel}
        </aside>

        {/* Center — Planning Canvas */}
        <main className="overflow-y-auto max-h-[calc(100vh-4rem)] py-2 scrollbar-hide">
          {canvas}
        </main>

        {/* Right — Memory Rail */}
        <aside className="sticky top-4 overflow-y-auto max-h-[calc(100vh-4rem)] pl-2 scrollbar-hide">
          {memoryRail}
        </aside>
      </div>

      {/* Mobile single-column layout */}
      <div className="md:hidden flex flex-col gap-4 py-4">
        <div>{canvas}</div>
        <div>{memoryRail}</div>
      </div>
    </div>
  );
}
