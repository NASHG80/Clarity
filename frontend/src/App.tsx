import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './shared/homepage';
import OnboardingPage from './b2b/pages/OnboardingPage';
import TransportResultsPage from './b2c/pages/TransportResultsPage';
import AccommodationResultsPage from './b2c/pages/AccommodationResultsPage';
import JourneyViewPage from './b2c/pages/JourneyViewPage';

import ListingTablePage from './b2b/pages/ListingTablePage';
import ListingEditorPage from './b2b/pages/ListingEditorPage';
import PhotoUploadPage from './b2b/pages/PhotoUploadPage';

import DashboardPage from './b2b/pages/DashboardPage';
import AnalyticsDashboardPage from './b2b/pages/AnalyticsDashboardPage';
import VerificationInboxPage from './b2b/pages/VerificationInboxPage';
import B2bLayout from './b2b/components/B2bLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/transport" element={<TransportResultsPage />} />
        <Route path="/accommodation-results" element={<AccommodationResultsPage />} />
        <Route path="/journey" element={<JourneyViewPage />} />

        <Route path="/b2b" element={<B2bLayout />}>
          <Route path="listings" element={<ListingTablePage />} />
          <Route path="listings/editor" element={<ListingEditorPage />} />
          <Route path="photos" element={<PhotoUploadPage />} />
          <Route path="opportunity-detector" element={<DashboardPage />} />
          <Route path="analytics" element={<AnalyticsDashboardPage />} />
          <Route path="verification-inbox" element={<VerificationInboxPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}