import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './shared/homepage';
import OnboardingPage from './b2b/pages/OnboardingPage';
import AuthPage from './b2c/pages/auth/AuthPage';
import CustomerDashboardPage from './b2c/pages/customer/CustomerDashboardPage';
import ListingDetailPage from './b2c/pages/ListingDetailPage';
import BookingConfirmationPage from './b2c/pages/BookingConfirmationPage';

import ListingTablePage from './b2b/pages/ListingTablePage';
import ListingPreviewPage from './b2b/pages/ListingPreviewPage';

import DashboardPage from './b2b/pages/DashboardPage';
import AnalyticsDashboardPage from './b2b/pages/AnalyticsDashboardPage';
import VerificationInboxPage from './b2b/pages/VerificationInboxPage';
import B2bLayout from './b2b/components/B2bLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/customer-dashboard" element={<CustomerDashboardPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route path="/b2b" element={<B2bLayout />}>
          <Route path="listings" element={<ListingTablePage />} />
          <Route path="listings/:id" element={<ListingPreviewPage />} />
          <Route path="opportunity-detector" element={<DashboardPage />} />
          <Route path="analytics" element={<AnalyticsDashboardPage />} />
          <Route path="verification-inbox" element={<VerificationInboxPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}