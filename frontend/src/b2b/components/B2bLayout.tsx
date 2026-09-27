import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar, NavItem } from '../../shared/components/Navbar';
import { BottomNavBar, BottomNavItem } from '../../shared/components/BottomNavBar';
import { LayoutDashboard, List, BarChart3, Mail } from 'lucide-react';

export default function B2bLayout() {
  const { t } = useTranslation();

  const desktopNavItems: NavItem[] = [
    { label: t('nav.dashboard', 'Dashboard'), href: '/b2b/opportunity-detector' },
    { label: t('nav.listings', 'Listings'), href: '/b2b/listings' },
    { label: t('nav.analytics', 'Analytics'), href: '/b2b/analytics' },
    { label: t('nav.verification', 'Verification'), href: '/b2b/verification-inbox' },
  ];

  const mobileNavItems: BottomNavItem[] = [
    { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: <LayoutDashboard className="w-5 h-5" />, href: '/b2b/opportunity-detector' },
    { id: 'listings', label: t('nav.listings', 'Listings'), icon: <List className="w-5 h-5" />, href: '/b2b/listings' },
    { id: 'analytics', label: t('nav.analytics', 'Analytics'), icon: <BarChart3 className="w-5 h-5" />, href: '/b2b/analytics' },
    { id: 'verification', label: t('nav.verification', 'Inbox'), icon: <Mail className="w-5 h-5" />, href: '/b2b/verification-inbox' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F3] flex flex-col font-sans">
      <Navbar 
        navItems={desktopNavItems} 
        brandName="GreenStay Partner"
      />
      <div className="flex-1 pt-28 pb-16 md:pb-0">
        <Outlet />
      </div>
      <BottomNavBar items={mobileNavItems} />
    </div>
  );
}
