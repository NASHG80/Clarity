/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Green & Inclusive Travel — Single-File Consolidated Homepage
 * Location: /src/shared/homepage.tsx
 * 
 * Personalized Travel Decision Engine for sustainable and accessible travel in India.
 * Fixed Palette:
 * - Warm Ivory: #F1EDE9 (Dominates canvas)
 * - Soft White: #F8F6F3 (Cards / surfaces)
 * - Sage Green: #7C9278 (Primary sustainability accent)
 * - Deep Forest: #26382D (Headings / navigation / strong CTAs)
 * - Muted Sage: #A9B8A3 (Secondary elements)
 * - Warm Beige: #D8C9BE (Supporting sections)
 * - Earth Taupe: #A99587 (Subtle accents)
 * - Soft Peach: #E8CFC4 (Tiny highlights)
 * 
 * Fixed Typography:
 * - Cormorant Garamond: Hero headline, major editorial text, large brand statements, italic editorial emphasis
 * - DM Sans: Navigation, body, buttons, labels, input, helper text, metadata, cards, UI controls
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Mic,
  X,
  ArrowRight,
  Accessibility,
  Leaf,
  IndianRupee,
  ShieldCheck,
  Check,
  Sparkles,
  Building2,
  Send,
  Train,
  Users,
  Edit2,
  ArrowUpRight,
  ArrowUp,
  Globe,
  User,
  Menu,
  Compass,
  Bookmark,
  UserCheck,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import heroBgImage from '../assets/images/hero_sustainable_india_travel_1790406163839.jpg';
import accessibleGoaImg from '../assets/images/accessible_serene_retreat_goa_1790406178105.jpg';
import Navbar from './components/Navbar';
import BottomNavBar from './components/BottomNavBar';
import { extractTripNLU, NLUExtractedData, NLUMissingOrAmbiguousItem } from '../lib/api';

// ==========================================
// 1. TYPES & MODELS
// ==========================================
export type Language = 'en' | 'hi' | 'mr';

export type DataStateType = 'verified' | 'reported' | 'community-confirmed' | 'unverified';

export interface ParsedTripDetails {
  origin: string;
  destination: string;
  travelers: {
    adults: number;
    children: number;
    seniors: number;
    wheelchairUsers: number;
  };
  accessibilityNeeds: string[];
  sustainabilityGoals: string[];
  budgetEstimated?: string;
  duration?: string;
}

// ==========================================
// 2. I18N DICTIONARIES (EN, HI, MR)
// ==========================================

export { translations };