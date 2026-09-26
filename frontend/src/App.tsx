import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './shared/homepage';
import RequirementFormPage, { RequirementFormData } from './b2c/pages/RequirementFormPage';
import TransportResultsPage from './b2c/pages/TransportResultsPage';
import JourneyViewPage from './b2c/pages/JourneyViewPage';
import AccommodationResultsPage from './b2c/pages/AccommodationResultsPage';
import ListingDetailPage from './b2c/pages/ListingDetailPage';
import ExplorePage from './b2c/pages/ExplorePage';
import TripSummaryPage from './b2c/pages/TripSummaryPage';
import BookingConfirmationPage from './b2c/pages/BookingConfirmationPage';
import { NLUExtractedData, TransportSearchRequest } from './lib/api';

interface RouteNavigationState {
  prefilledData?: NLUExtractedData;
  fallbackNotice?: string;
}

function HomePageWrapper() {
  const navigate = useNavigate();

  const handleOpenRequirementForm = (data?: NLUExtractedData, fallbackNotice?: string) => {
    navigate('/requirements', {
      state: { prefilledData: data, fallbackNotice } as RouteNavigationState,
    });
  };

  return <HomePage onOpenRequirementForm={handleOpenRequirementForm} />;
}

function RequirementFormPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteNavigationState) || {};

  const handleBack = () => {
    navigate('/');
  };

  const handleSubmitRequirements = (requirements: RequirementFormData) => {
    const searchPayload: TransportSearchRequest = {
      origin: requirements.origin,
      destination: requirements.destination,
      budget_max: requirements.budget_max,
      time_max_hours: requirements.time_max_hours,
      accessibility_required: requirements.accessibility_required,
      weights: requirements.weights,
      include_unverified: requirements.includeUnverified,
    };
    const stay = { nights: requirements.nights || 1 };
    navigate('/transport-results', { state: { searchPayload, stay } });
  };

  return (
    <RequirementFormPage
      initialData={state.prefilledData}
      fallbackNotice={state.fallbackNotice}
      onBack={handleBack}
      onSubmitRequirements={handleSubmitRequirements}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePageWrapper />} />
        <Route path="/requirements" element={<RequirementFormPageWrapper />} />
        <Route path="/transport-results" element={<TransportResultsPage />} />
        <Route path="/journey" element={<JourneyViewPage />} />
        <Route path="/accommodation-results" element={<AccommodationResultsPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/explore/:city" element={<ExplorePage />} />
        <Route path="/trip-summary" element={<TripSummaryPage />} />
        <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
        <Route path="*" element={<HomePageWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}