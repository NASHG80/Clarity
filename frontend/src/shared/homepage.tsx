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
} from 'lucide-react';
import heroBgImage from '../assets/images/hero_sustainable_india_travel_1790406163839.jpg';
import accessibleGoaImg from '../assets/images/accessible_serene_retreat_goa_1790406178105.jpg';

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
export const translations = {
  en: {
    brandName: 'Green & Inclusive Travel',
    tagline: 'Personalized Travel Decision Engine for sustainable and accessible travel in India',
    nav: {
      planTrip: 'Plan a Trip',
      explore: 'Explore',
      trips: 'Trips',
      forBusinesses: 'For Businesses',
      signIn: 'Sign in',
      profile: 'Profile',
      language: 'Language',
    },
    hero: {
      headlinePart1: 'Travel better.',
      headlinePart2: 'Travel lighter.',
      headlinePart3: 'Travel inclusively.',
      supporting: 'Plan trips around what matters to you — accessibility, budget, time, comfort and environmental impact.',
    },
    inputCard: {
      label: 'Tell us about your trip',
      placeholder: 'Tell us where you\'re going, who\'s traveling, and what you need…',
      defaultQuery: 'Mumbai to Goa with 2 children and 1 senior. I need a wheelchair, accessible transport and an accessible hotel.',
      buttonText: 'Find My Options',
      helperText: 'You can review and edit everything before we search.',
      charCount: 'chars',
      clear: 'Clear',
      voiceInputTooltip: 'Dictate in English, Hindi, or Marathi',
    },
    examplePrompts: {
      heading: 'Try something like',
      items: [
        {
          id: 'prompt-1',
          label: 'Weekend trip from Mumbai to Goa under ₹20,000',
          query: 'Weekend trip from Mumbai to Goa under ₹20,000 with low carbon options',
        },
        {
          id: 'prompt-2',
          label: 'Traveling with my wheelchair-using parent',
          query: 'Traveling with my wheelchair-using parent from Delhi to Jaipur, step-free hotels and ramped transport',
        },
        {
          id: 'prompt-3',
          label: 'Low-carbon family trip with minimal walking',
          query: 'Low-carbon family trip from Bengaluru to Mysore with minimal walking and shaded accessible paths',
        },
        {
          id: 'prompt-4',
          label: 'Kerala backwaters with step-free boarding',
          query: 'Kochi to Alleppey for 3 seniors, battery-assisted transfers, step-free eco-resort',
        }
      ],
    },
    valueProps: {
      title: 'Built for conscious, comfortable journeys',
      items: [
        {
          symbol: '♿',
          title: 'Accessibility',
          description: 'Find options that match your specific accessibility needs — from step-free boarding to roll-in showers.',
          tag: 'Tailored comfort',
          badgeState: 'verified' as DataStateType,
        },
        {
          symbol: '🌱',
          title: 'Lower-impact travel',
          description: 'Compare estimated emissions and lower-impact alternatives across rail, electric cabs, and eco-certified stays.',
          tag: '-60% average CO₂',
          badgeState: 'verified' as DataStateType,
        },
        {
          symbol: '₹',
          title: 'Practical choices',
          description: 'Balance cost, time and convenience with transparent fare breakdowns and realistic transfer windows.',
          tag: 'No hidden trade-offs',
          badgeState: 'community-confirmed' as DataStateType,
        },
        {
          symbol: '✓',
          title: 'Clear evidence',
          description: 'See what is verified, reported, community-confirmed or still unverified so you travel with confidence.',
          tag: 'Audited data',
          badgeState: 'verified' as DataStateType,
        }
      ]
    },
    editorial: {
      kicker: 'The Decision Philosophy',
      heading: 'A better way to choose your journey.',
      supporting: 'We compare travel options across accessibility, cost, time, convenience and environmental impact — so you can understand the trade-offs before you choose.',
      manifesto: '“True luxury in modern India is knowing that every member of your family can move freely, without friction, while leaving the sacred landscapes we visit undisturbed.”',
      attribution: 'The Green & Inclusive Travel Charter',
      bullet1Title: 'Zero Assumptions on Mobility',
      bullet1Desc: 'We audit doorway widths, curb ramps, battery wheelchair charging points, and station porters across Indian routes.',
      bullet2Title: 'Carbon Transparency, Simplified',
      bullet2Desc: 'Calculated using real Indian grid and transit emissions factors, comparing high-speed electric trains like Vande Bharat against domestic flights.',
    },
    convergence: {
      kicker: 'Harmonious Design',
      title: 'Where accessibility and sustainability meet.',
      description: 'Often treated as separate priorities, universal accessibility and environmental mindfulness strengthen each other. Shared electric transit, step-free rail hubs, and low-waste architectural stays create more dignified journeys for all travelers.',
      leftLabel: 'Accessibility',
      leftDesc: 'Step-free transit · Sensory quiet spaces · Tactile wayfinding · Assistive baggage',
      rightLabel: 'Sustainability',
      rightDesc: 'Electrified rail corridors · Zero-single-use stays · Local farm dining · Minimal carbon footprint',
      centerLabel: 'YOUR JOURNEY',
      centerSub: 'Thoughtfully curated for India',
    },
    business: {
      heading: 'Make your property easier to discover.',
      supporting: 'Share your accessibility and sustainability practices, understand traveler demand, and discover opportunities to improve.',
      cta: 'For Businesses',
      tagline: 'Join 450+ verified eco-homestays, heritage villas, and transport operators across India.',
      cardTitle: 'Host & Operator Registry',
      bullet1: 'Free accessibility and carbon baseline audit guide',
      bullet2: 'Direct visibility to travelers with specific physical & dietary requirements',
      button: 'Partner with Us',
    },
    reviewModal: {
      title: 'Review Your Trip Setup',
      subtitle: 'The engine extracted these parameters from your prompt. Review and adjust anything before discovering options.',
      routeLabel: 'Route',
      travelersLabel: 'Travel Party',
      accessLabel: 'Accessibility Requirements',
      sustainabilityLabel: 'Sustainability Preferences',
      confirmAction: 'Continue with these Preferences',
      toastMessage: 'Setup saved. You are ready to proceed with these verified parameters.',
    },
    footer: {
      brand: 'Green & Inclusive Travel',
      description: 'A personalized travel decision engine dedicated to low-carbon, universally accessible journeys across India.',
      planTrip: 'Plan a Trip',
      explore: 'Explore',
      forBusinesses: 'For Businesses',
      about: 'About',
      copyright: '© 2026 Green & Inclusive Travel Inc. Designed for sustainable and accessible travel in India.',
    },
    bottomNav: {
      search: 'Search',
      explore: 'Explore',
      trips: 'Trips',
      profile: 'Profile',
    }
  },
  hi: {
    brandName: 'Green & Inclusive Travel',
    tagline: 'भारत में सतत और सुलभ यात्रा के लिए व्यक्तिगत निर्णय इंजन',
    nav: {
      planTrip: 'यात्रा योजना',
      explore: 'खोजें',
      trips: 'मेरी यात्राएं',
      forBusinesses: 'व्यवसायों के लिए',
      signIn: 'साइन इन करें',
      profile: 'प्रोफ़ाइल',
      language: 'भाषा',
    },
    hero: {
      headlinePart1: 'सार्थक यात्रा।',
      headlinePart2: 'सुलभ यात्रा।',
      headlinePart3: 'पर्यावरण-हितैषी यात्रा।',
      supporting: 'अपनी प्राथमिकताओं के अनुसार यात्रा की योजना बनाएं — सुगमता, बजट, समय, आराम और पर्यावरण पर प्रभाव।',
    },
    inputCard: {
      label: 'अपनी यात्रा के बारे में हमें बताएं',
      placeholder: 'बताएं कि आप कहां जा रहे हैं, कौन साथ है, और आपको क्या आवश्यकताएं हैं…',
      defaultQuery: 'मुंबई से गोवा 2 बच्चों और 1 वरिष्ठ नागरिक के साथ। मुझे व्हीलचेयर, सुलभ वाहन और सुलभ होटल की आवश्यकता है।',
      buttonText: 'मेरे विकल्प खोजें',
      helperText: 'खोज शुरू करने से पहले आप सब कुछ जांच और संपादित कर सकते हैं।',
      charCount: 'अक्षर',
      clear: 'साफ़ करें',
      voiceInputTooltip: 'हिंदी या अंग्रेजी में बोलें',
    },
    examplePrompts: {
      heading: 'इस प्रकार प्रयास करें',
      items: [
        {
          id: 'prompt-1',
          label: 'मुंबई से गोवा सप्ताहांत यात्रा ₹20,000 के भीतर',
          query: 'मुंबई से गोवा कम कार्बन उत्सर्जन वाली सप्ताहांत यात्रा ₹20,000 के बजट में',
        },
        {
          id: 'prompt-2',
          label: 'व्हीलचेयर का उपयोग करने वाले माता-पिता के साथ यात्रा',
          query: 'दिल्ली से जयपुर व्हीलचेयर-सुलभ होटल और रैंप वाले इलेक्ट्रिक परिवहन के साथ यात्रा',
        },
        {
          id: 'prompt-3',
          label: 'न्यूनतम पैदल चलने वाली कम-कार्बन पारिवारिक यात्रा',
          query: 'बेंगलुरु से मैसूर परिवार के साथ न्यूनतम पैदल चलने और सुलभ रास्तों वाली यात्रा',
        },
        {
          id: 'prompt-4',
          label: 'केरल बैकवाटर्स में सीढ़ी-मुक्त नौकायन',
          query: 'कोच्चि से अल्लेप्पी 3 वरिष्ठ नागरिकों के लिए, सहायता प्राप्त सुलभ पर्यावरण-अनुकूल आवास',
        }
      ],
    },
    valueProps: {
      title: 'सार्थक और आरामदायक यात्राओं के लिए निर्मित',
      items: [
        {
          symbol: '♿',
          title: 'सुगमता (Accessibility)',
          description: 'ऐसी यात्रा विकल्प खोजें जो आपकी शारीरिक आवश्यकताओं के अनुरूप हों — सीढ़ी-मुक्त स्टेशन से रोल-इन शॉवर तक।',
          tag: 'अनुकूलित आराम',
          badgeState: 'verified' as DataStateType,
        },
        {
          symbol: '🌱',
          title: 'कम-प्रभाव वाली यात्रा',
          description: 'ट्रेन, इलेक्ट्रिक कैब और प्रमाणित ईको-स्टे में अनुमानित कार्बन उत्सर्जन की तुलना करें।',
          tag: '-60% कार्बन कमी',
          badgeState: 'verified' as DataStateType,
        },
        {
          symbol: '₹',
          title: 'व्यावहारिक विकल्प',
          description: 'स्पष्ट किराए और वास्तविक समय के साथ लागत, समय और सुविधा में संतुलन बनाएं।',
          tag: 'पारदर्शी मूल्य',
          badgeState: 'community-confirmed' as DataStateType,
        },
        {
          symbol: '✓',
          title: 'प्रमाणित साक्ष्य',
          description: 'देखें कि क्या सत्यापित है, समुदाय द्वारा पुष्ट है, ताकि आप पूरे विश्वास के साथ यात्रा करें।',
          tag: 'सत्यापित विवरण',
          badgeState: 'verified' as DataStateType,
        }
      ]
    },
    editorial: {
      kicker: 'यात्रा दर्शन',
      heading: 'अपनी यात्रा चुनने का एक बेहतर तरीका।',
      supporting: 'हम सुगमता, लागत, समय, सुविधा और पर्यावरणीय प्रभाव के आधार पर विकल्पों की तुलना करते हैं — ताकि आप चयन करने से पहले सभी पहलुओं को समझ सकें।',
      manifesto: '“सच्ची विलासिता यह है कि परिवार का प्रत्येक सदस्य बिना किसी रुकावट के स्वतंत्र रूप से घूम सके, और हमारी प्रकृति पर कोई खरोंच न आए।”',
      attribution: 'ग्रीन एंड इनक्लूसिव ट्रैवल घोषणापत्र',
      bullet1Title: 'सुगमता पर पूर्ण ध्यान',
      bullet1Desc: 'हम भारतीय मार्गों पर दरवाजों की चौड़ाई, रैंप, बैटरी व्हीलचेयर चार्जिंग और कुली सहायता का सत्यापन करते हैं।',
      bullet2Title: 'सच्ची कार्बन पारदर्शिता',
      bullet2Desc: 'वंदे भारत जैसी इलेक्ट्रिक ट्रेनों और उड़ानों के वास्तविक उत्सर्जन कारकों की तुलना।',
    },
    convergence: {
      kicker: 'समन्वित दृष्टिकोण',
      title: 'जहां सुगमता और स्थिरता एक साथ आती हैं।',
      description: 'सुलभ बुनियादी ढांचा और पर्यावरण-संवेदनशीलता एक दूसरे को मजबूत करते हैं। साझा इलेक्ट्रिक परिवहन, सीढ़ी-मुक्त हब और न्यूनतम-अपशिष्ट आवास सभी के लिए गरिमापूर्ण यात्रा बनाते हैं।',
      leftLabel: 'सुगमता (Accessibility)',
      leftDesc: 'सीढ़ी-मुक्त पारगमन · शांत संवेदी क्षेत्र · स्पर्शनीय संकेत · सहायता प्राप्त बैगेज',
      rightLabel: 'स्थिरता (Sustainability)',
      rightDesc: 'विद्युतीकृत रेल गलियारे · प्लास्टिक-मुक्त स्टे · स्थानीय जैविक भोजन · न्यूनतम कार्बन',
      centerLabel: 'आपकी यात्रा',
      centerSub: 'भारत के लिए विचारपूर्वक डिज़ाइन की गई',
    },
    business: {
      heading: 'अपनी संपत्ति को अधिक यात्रियों तक पहुंचाएं।',
      supporting: 'अपनी सुलभता और पर्यावरण अनुकूल प्रथाओं को साझा करें, यात्रियों की मांग समझें और सुधार के अवसर खोजें।',
      cta: 'व्यवसायों के लिए',
      tagline: 'भारत भर के 450+ सत्यापित ईको-होमस्टे और ऑपरेटरों से जुड़ें।',
      cardTitle: 'हॉस्पिटैलिटी पार्टनर पोर्टल',
      bullet1: 'निःशुल्क सुगमता और कार्बन ऑडिट गाइड',
      bullet2: 'विशिष्ट आवश्यकताओं वाले यात्रियों के लिए सीधी दृश्यता',
      button: 'हमारे भागीदार बनें',
    },
    reviewModal: {
      title: 'अपनी यात्रा सेटअप की समीक्षा करें',
      subtitle: 'इंजन ने आपके विवरण से इन आवश्यकताओं की पहचान की है। विकल्प देखने से पहले कुछ भी संपादित कर सकते हैं।',
      routeLabel: 'मार्ग',
      travelersLabel: 'यात्री समूह',
      accessLabel: 'सुगमता आवश्यकताएं',
      sustainabilityLabel: 'पर्यावरणीय प्राथमिकताएं',
      confirmAction: 'इन प्राथमिकताओं के साथ आगे बढ़ें',
      toastMessage: 'सेटअप सुरक्षित हो गया। आप विकल्प देखने के लिए तैयार हैं।',
    },
    footer: {
      brand: 'Green & Inclusive Travel',
      description: 'भारत भर में कम कार्बन और सार्वभौमिक रूप से सुलभ यात्राओं के लिए समर्पित व्यक्तिगत निर्णय इंजन।',
      planTrip: 'यात्रा योजना',
      explore: 'खोजें',
      forBusinesses: 'व्यवसायों के लिए',
      about: 'हमारे बारे में',
      copyright: '© 2026 Green & Inclusive Travel Inc. भारत में सतत एवं सुलभ यात्रा के लिए।',
    },
    bottomNav: {
      search: 'खोजें',
      explore: 'एक्सप्लोर',
      trips: 'यात्राएं',
      profile: 'प्रोफ़ाइल',
    }
  },
  mr: {
    brandName: 'Green & Inclusive Travel',
    tagline: 'भारतातील शाश्वत आणि सुलभ प्रवासासाठी वैयक्तिक प्रवास निर्णय इंजिन',
    nav: {
      planTrip: 'प्रवास नियोजन',
      explore: 'शोधा',
      trips: 'माझे प्रवास',
      forBusinesses: 'व्यवसायांसाठी',
      signIn: 'साइन इन',
      profile: 'प्रोफाइल',
      language: 'भाषा',
    },
    hero: {
      headlinePart1: 'शाश्वत प्रवास.',
      headlinePart2: 'हलका प्रवास.',
      headlinePart3: 'सर्वांसाठी सर्वसमावेशक.',
      supporting: 'तुमच्या महत्त्वाच्या घटकांनुसार प्रवासाचे नियोजन करा — सुलभता, बजेट, वेळ, आराम आणि पर्यावरणावरील प्रभाव.',
    },
    inputCard: {
      label: 'तुमच्या प्रवासाबद्दल आम्हाला सांगा',
      placeholder: 'तुम्ही कुठे जात आहात, कोण प्रवास करत आहे आणि तुम्हाला काय हवे आहे ते सांगा…',
      defaultQuery: 'मुंबई ते गोवा २ लहान मुले आणि १ ज्येष्ठ नागरिकांसह. मला व्हीलचेअर, सुलभ वाहतूक आणि सुलभ हॉटेल हवे आहे.',
      buttonText: 'माझे पर्याय शोधा',
      helperText: 'शोध सुरू करण्यापूर्वी तुम्ही सर्व काही तपासू आणि संपादित करू शकता.',
      charCount: 'अक्षरे',
      clear: 'पुसा',
      voiceInputTooltip: 'मराठी किंवा इंग्रजीत बोला',
    },
    examplePrompts: {
      heading: 'असे काहीतरी वापरून पहा',
      items: [
        {
          id: 'prompt-1',
          label: 'मुंबई ते गोवा वीकेंड ट्रिप ₹२०,००० च्या आत',
          query: 'मुंबई ते गोवा कमी कार्बन उत्सर्जनासह वीकेंड ट्रिप ₹२०,००० बजेटमध्ये',
        },
        {
          id: 'prompt-2',
          label: 'व्हीलचेअर वापरणाऱ्या पालकांसह प्रवास',
          query: 'पालकांसह व्हीलचेअर-सुलभ आणि पायऱ्या नसलेल्या प्रवासाची सोय',
        },
        {
          id: 'prompt-3',
          label: 'कमी चालणे लागणारा कमी-कार्बन कौटुंबिक प्रवास',
          query: 'कुटुंबासह कमी चालणे आणि सुलभ मार्ग असलेला पर्यावरणपूरक प्रवास',
        },
        {
          id: 'prompt-4',
          label: 'कोकण रेल्वेतून निसर्गरम्य आणि सुलभ प्रवास',
          query: 'मुंबई ते सावंतवाडी पायऱ्या नसलेले बोर्डिंग आणि इको-स्टे',
        }
      ],
    },
    valueProps: {
      title: 'जाणीवपूर्वक आणि आरामदायी प्रवासासाठी निर्मित',
      items: [
        {
          symbol: '♿',
          title: 'सुलभता (Accessibility)',
          description: 'तुमच्या नेमक्या शारीरिक गरजांनुसार पर्याय शोधा — पायऱ्यांविना बोर्डिंगपासून ते रोल-इन शॉवर्सपर्यंत.',
          tag: 'अनुकूल आराम',
          badgeState: 'verified' as DataStateType,
        },
        {
          symbol: '🌱',
          title: 'कमी प्रभावाचा प्रवास',
          description: 'रेल्वे, इलेक्ट्रिक वाहने आणि प्रमाणित इको-स्टेच्या कार्बन उत्सर्जनाची पारदर्शक तुलना करा.',
          tag: '-६०% कार्बन बचत',
          badgeState: 'verified' as DataStateType,
        },
        {
          symbol: '₹',
          title: 'व्यावहारिक निवड',
          description: 'खर्च, वेळ आणि सोय यात समतोल साधा आणि योग्य निर्णय घ्या.',
          tag: 'पारदर्शक दर',
          badgeState: 'community-confirmed' as DataStateType,
        },
        {
          symbol: '✓',
          title: 'स्पष्ट पुरावा',
          description: 'काय पडताळलेले आहे, काय नोंदवले आहे ते स्पष्टपणे पहा जेणेकरून आत्मविश्वासाने प्रवास करता येईल.',
          tag: 'सत्यापित माहिती',
          badgeState: 'verified' as DataStateType,
        }
      ]
    },
    editorial: {
      kicker: 'प्रवासाचा दृष्टिकोन',
      heading: 'तुमचा प्रवास निवडण्याचा एक उत्तम मार्ग.',
      supporting: 'आम्ही सुलभता, खर्च, वेळ, सोय आणि पर्यावरणीय प्रभाव या सर्वांची तुलना करतो — जेणेकरून तुम्ही विचारपूर्वक निवड करू शकाल.',
      manifesto: '“खरा प्रवास तोच असतो जिथे कुटुंबातील प्रत्येक व्यक्ती सहजतेने फिरू शकते आणि निसर्गावर कोणतीही हानी पोहोचत नाही.”',
      attribution: 'ग्रीन अँड इन्क्लुझिव्ह ट्रॅव्हल संकल्प',
      bullet1Title: 'हालचालीवर पूर्ण विचार',
      bullet1Desc: 'आम्ही भारतीय मार्गांवरील दारांची रुंदी, रॅम्प, व्हीलचेअर चार्जिंग आणि मदतनीस व्यवस्था तपासतो.',
      bullet2Title: 'कार्बन पारदर्शकता',
      bullet2Desc: 'वंदे भारतसारख्या इलेक्ट्रिक ट्रेन्स आणि विमानांच्या उत्सर्जनाची थेट तुलना.',
    },
    convergence: {
      kicker: 'सुसंगत समन्वय',
      title: 'जिथे सुलभता आणि पर्यावरण-स्नेह एकत्र येतात.',
      description: 'सुलभता आणि पर्यावरण रक्षण एकमेकांना पूरक आहेत. सामूहिक इलेक्ट्रिक वाहतूक, पायऱ्यांविना रेल्वे हब आणि इको-स्टे सर्वांसाठी सन्मानजनक प्रवास घडवतात.',
      leftLabel: 'सुलभता (Accessibility)',
      leftDesc: 'पायऱ्या नसलेला प्रवास · शांत संवेदी जागा · सुलभ मार्गदर्शक खुणा',
      rightLabel: 'शाश्वतता (Sustainability)',
      rightDesc: 'विद्युतीकृत रेल्वे मार्ग · प्लास्टिक-मुक्त वास्तव्य · स्थानिक अन्न · कमी कार्बन',
      centerLabel: 'तुमचा प्रवास',
      centerSub: 'भारतासाठी जाणीवपूर्वक रचलेला',
    },
    business: {
      heading: 'तुमचे हॉटेल व रिसॉर्ट पर्यटकांपर्यंत पोहोचवा.',
      supporting: 'तुमच्या सुलभता आणि पर्यावरणपूरक सेवांची नोंद करा, पर्यटकांच्या गरजा समजून घ्या आणि सुधारणा करा.',
      cta: 'व्यवसायांसाठी',
      tagline: 'भारतभरातील ४५०+ प्रमाणित इको-स्टे आणि ऑपरेटर्समध्ये सहभागी व्हा.',
      cardTitle: 'हॉस्पिटॅलिटी पार्टनर नोंदणी',
      bullet1: 'मोफत सुलभता आणि कार्बन ऑडिट मार्गदर्शक',
      bullet2: 'विशेष गरजा असलेल्या प्रवाशांपर्यंत थेट पोहोच',
      button: 'भागीदार व्हा',
    },
    reviewModal: {
      title: 'प्रवास रचनेची पाहणी करा',
      subtitle: 'तुमच्या वाक्यावरून इंजिनने या घटकांची नोंद घेतली आहे. शोधण्यापूर्वी बदल करू शकता.',
      routeLabel: 'मार्ग',
      travelersLabel: 'प्रवासी संख्या',
      accessLabel: 'सुलभता गरजा',
      sustainabilityLabel: 'पर्यावरण प्राधान्ये',
      confirmAction: 'या प्राधान्यांसह पुढे जा',
      toastMessage: 'माहिती सुरक्षित झाली. तुम्ही पर्याय पाहण्यासाठी तयार आहात.',
    },
    footer: {
      brand: 'Green & Inclusive Travel',
      description: 'कमी कार्बन आणि सर्वांसाठी सुलभ प्रवासासाठी भारतातील वैयक्तिक प्रवास निर्णय इंजिन.',
      planTrip: 'प्रवास नियोजन',
      explore: 'शोधा',
      forBusinesses: 'व्यवसायांसाठी',
      about: 'आमच्याबद्दल',
      copyright: '© २०२६ Green & Inclusive Travel Inc. शाश्वत आणि सुलभ प्रवासासाठी.',
    },
    bottomNav: {
      search: 'शोधा',
      explore: 'एक्सप्लोर',
      trips: 'प्रवास',
      profile: 'प्रोफाइल',
    }
  }
};

// ==========================================
// 3. NATURAL-LANGUAGE INTENT PARSER
// ==========================================
export function parseNaturalLanguageTrip(text: string): ParsedTripDetails {
  const lower = text.toLowerCase();

  let origin = 'Mumbai';
  let destination = 'Goa';

  if (lower.includes('from') && lower.includes('to')) {
    const fromIndex = lower.indexOf('from') + 5;
    const toIndex = lower.indexOf('to', fromIndex);
    if (toIndex > fromIndex) {
      origin = text.substring(fromIndex - 5 + 5, toIndex).trim();
      const rest = text.substring(toIndex + 3).trim();
      const words = rest.split(/[\s,.]+/);
      if (words.length > 0 && words[0]) {
        destination = words[0];
        if (words[1] && !['with', 'for', 'in', 'under', 'and'].includes(words[1].toLowerCase())) {
          destination += ' ' + words[1];
        }
      }
    }
  } else if (lower.includes(' to ')) {
    const parts = lower.split(' to ');
    const originPart = parts[0].trim().split(/[\s,.]+/).pop();
    if (originPart) origin = originPart.charAt(0).toUpperCase() + originPart.slice(1);
    const destPart = parts[1].trim().split(/[\s,.]+/)[0];
    if (destPart) destination = destPart.charAt(0).toUpperCase() + destPart.slice(1);
  }

  let adults = 1;
  let children = 0;
  let seniors = 0;
  let wheelchairUsers = 0;

  const childMatch = lower.match(/(\d+)\s*(children|child|kids|kid|मुले|बच्चे)/);
  if (childMatch) {
    children = parseInt(childMatch[1], 10);
  } else if (lower.includes('child') || lower.includes('kid')) {
    children = 1;
  }

  const seniorMatch = lower.match(/(\d+)\s*(seniors?|senior citizens?|parent|elderly|वृद्ध|वरिष्ठ|आजी|आजोबा)/);
  if (seniorMatch) {
    seniors = parseInt(seniorMatch[1], 10);
  } else if (lower.includes('senior') || lower.includes('parent') || lower.includes('elder')) {
    seniors = 1;
  }

  if (lower.includes('wheelchair') || lower.includes('व्हीलचेयर') || lower.includes('step-free') || lower.includes('रॅम्प')) {
    wheelchairUsers = 1;
  }

  const accessibilityNeeds: string[] = [];
  if (lower.includes('wheelchair') || lower.includes('व्हीलचेयर')) accessibilityNeeds.push('Wheelchair ramp access');
  if (lower.includes('transport') || lower.includes('वाहन') || lower.includes('गाडी')) accessibilityNeeds.push('Accessible ground transfers (hydraulic / low floor)');
  if (lower.includes('hotel') || lower.includes('accommodation') || lower.includes('हॉटेल')) accessibilityNeeds.push('Roll-in shower & step-free room entrance');
  if (lower.includes('minimal walking') || lower.includes('कमी चालणे') || lower.includes('न्यूनतम पैदल')) accessibilityNeeds.push('Shaded paths & battery buggy transit');
  if (lower.includes('step-free') || lower.includes('सीढ़ी-मुक्त')) accessibilityNeeds.push('Dedicated railway porter & platform hoist');

  if (accessibilityNeeds.length === 0) {
    accessibilityNeeds.push('Step-free main corridor', 'Visual & tactile wayfinding');
  }

  const sustainabilityGoals: string[] = [];
  if (lower.includes('low-carbon') || lower.includes('low carbon') || lower.includes('कम कार्बन') || lower.includes('कमी कार्बन')) {
    sustainabilityGoals.push('High-speed electrified rail priority (Vande Bharat / Tejas)');
  }
  if (lower.includes('eco') || lower.includes('green') || lower.includes('पर्यावरण')) {
    sustainabilityGoals.push('Zero-single-use plastic certified stay');
  }
  sustainabilityGoals.push('Solar-powered regional EV cab transfers');
  sustainabilityGoals.push('Locally sourced regional culinary partners');

  let budgetEstimated: string | undefined = undefined;
  const budgetMatch = lower.match(/₹?\s*(\d{1,3}(?:,\d{2,3})*|\d+)\s*(?:rs|inr|रुपये)?/);
  if (budgetMatch && (lower.includes('₹') || lower.includes('under') || lower.includes('budget') || lower.includes('बजेट') || lower.includes('रुपये'))) {
    budgetEstimated = `₹${budgetMatch[1]}`;
  } else if (lower.includes('20,000') || lower.includes('20000')) {
    budgetEstimated = '₹20,000';
  }

  return {
    origin: origin.charAt(0).toUpperCase() + origin.slice(1),
    destination: destination.charAt(0).toUpperCase() + destination.slice(1),
    travelers: {
      adults: Math.max(1, adults),
      children,
      seniors,
      wheelchairUsers: Math.max(wheelchairUsers, seniors > 0 && lower.includes('wheelchair') ? 1 : wheelchairUsers),
    },
    accessibilityNeeds,
    sustainabilityGoals,
    budgetEstimated,
    duration: '3–4 Days',
  };
}

// ==========================================
// 4. EMBEDDED SUBCOMPONENTS
// ==========================================

/**
 * DataStateBadge: displays verification state
 * (verified, reported, community-confirmed, unverified)
 */
export const DataStateBadge: React.FC<{
  state: DataStateType;
  label?: string;
  className?: string;
}> = ({ state, label, className = '' }) => {
  const config = {
    verified: {
      text: label || 'Audited & Verified',
      icon: ShieldCheck,
      bgColor: 'bg-[#7C9278]/15',
      textColor: 'text-[#26382D]',
      borderColor: 'border-[#7C9278]/40',
    },
    'community-confirmed': {
      text: label || 'Community Confirmed',
      icon: UserCheck,
      bgColor: 'bg-[#A9B8A3]/20',
      textColor: 'text-[#26382D]',
      borderColor: 'border-[#A9B8A3]',
    },
    reported: {
      text: label || 'Operator Reported',
      icon: FileText,
      bgColor: 'bg-[#D8C9BE]/30',
      textColor: 'text-[#26382D]/85',
      borderColor: 'border-[#D8C9BE]',
    },
    unverified: {
      text: label || 'Unverified / Pending Audit',
      icon: AlertCircle,
      bgColor: 'bg-[#E8CFC4]/30',
      textColor: 'text-[#A99587]',
      borderColor: 'border-[#E8CFC4]',
    },
  }[state];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border tracking-wide transition-colors ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      <Icon className="w-3 h-3 text-[#26382D]/80" />
      <span>{config.text}</span>
    </span>
  );
};

/**
 * Reusable Accessible Modal
 */
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}> = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'lg' }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative bg-[#F8F6F3] rounded-3xl w-full ${maxWidthClass} p-6 sm:p-8 border border-[#D8C9BE] shadow-[0_24px_60px_rgba(38,56,45,0.2)] max-h-[92vh] overflow-y-auto z-10`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#26382D]/60 hover:text-[#26382D] p-1.5 rounded-full hover:bg-[#F1EDE9] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {(title || subtitle) && (
          <div className="text-left space-y-1.5 pb-4 mb-4 border-b border-[#D8C9BE]/60 pr-8">
            {typeof title === 'string' ? (
              <h2 className="font-serif text-2xl font-medium text-[#26382D]">{title}</h2>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#26382D]/75 font-light leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

// ==========================================
// 5. MAIN HOMEPAGE COMPONENT
// ==========================================
export const HomePage: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [tripQuery, setTripQuery] = useState(
    'Mumbai to Goa with 2 children and 1 senior. I need a wheelchair, accessible transport and an accessible hotel.'
  );
  const [parsedTrip, setParsedTrip] = useState<ParsedTripDetails>(() =>
    parseNaturalLanguageTrip(
      'Mumbai to Goa with 2 children and 1 senior. I need a wheelchair, accessible transport and an accessible hotel.'
    )
  );
  const [isListening, setIsListening] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isEditingSetup, setIsEditingSetup] = useState(false);
  const [confirmedSetup, setConfirmedSetup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState('search');

  // Business Modal Form State
  const [propertyName, setPropertyName] = useState('');
  const [propertyLocation, setPropertyLocation] = useState('Goa');
  const [propertyType, setPropertyType] = useState('Eco-Resort / Homestay');
  const [businessSubmitted, setBusinessSubmitted] = useState(false);

  const t = translations[currentLang];

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    setLangDropdownOpen(false);
    const currentDefault = translations[currentLang].inputCard.defaultQuery;
    if (tripQuery === currentDefault || !tripQuery.trim()) {
      const newQuery = translations[lang].inputCard.defaultQuery;
      setTripQuery(newQuery);
      setParsedTrip(parseNaturalLanguageTrip(newQuery));
    }
  };

  const handleFindOptions = () => {
    const parsed = parseNaturalLanguageTrip(tripQuery);
    setParsedTrip(parsed);
    setConfirmedSetup(false);
    setIsEditingSetup(false);
    setIsReviewModalOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (tripQuery.trim()) {
        handleFindOptions();
      }
    }
  };

  const toggleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        if (!tripQuery.trim()) {
          setTripQuery(t.inputCard.defaultQuery);
          setParsedTrip(parseNaturalLanguageTrip(t.inputCard.defaultQuery));
        }
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessSubmitted(true);
    setTimeout(() => {
      setTimeout(() => {
        setIsBusinessModalOpen(false);
        setBusinessSubmitted(false);
      }, 1500);
    }, 400);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="top" className="min-h-screen bg-[#F1EDE9] text-[#26382D] flex flex-col font-sans selection:bg-[#7C9278] selection:text-white">
      
      {/* -------------------------------------- */}
      {/* 1. TOP NAVBAR                          */}
      {/* -------------------------------------- */}
      <header className="sticky top-0 z-40 bg-[#F1EDE9]/90 backdrop-blur-md border-b border-[#26382D]/8 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          
          {/* Logo / Wordmark */}
          <div className="flex items-center gap-3">
            <a 
              href="#top" 
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] rounded-md"
              aria-label="Green & Inclusive Travel Homepage"
            >
              <div className="w-9 h-9 rounded-full bg-[#26382D] text-[#F8F6F3] flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-xs">
                <svg className="w-5 h-5 text-[#A9B8A3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.5 12 13 14 10" strokeDasharray="2 2"/>
                </svg>
              </div>
              <span className="font-serif text-2xl tracking-tight font-medium text-[#26382D]">
                Green &amp; Inclusive Travel
              </span>
            </a>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-9 text-[15px] font-medium tracking-wide text-[#26382D]/85">
            <a 
              href="#trip-input" 
              className="hover:text-[#26382D] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#26382D] hover:after:w-full after:transition-all"
            >
              {t.nav.planTrip}
            </a>
            <a 
              href="#value-propositions" 
              className="hover:text-[#26382D] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#26382D] hover:after:w-full after:transition-all"
            >
              {t.nav.explore}
            </a>
            <a 
              href="#editorial-philosophy" 
              className="hover:text-[#26382D] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#26382D] hover:after:w-full after:transition-all"
            >
              {t.nav.trips}
            </a>
          </nav>

          {/* Right: For Businesses + Language Switcher + Sign In */}
          <div className="hidden md:flex items-center gap-5 text-sm">
            <button
              onClick={() => setIsBusinessModalOpen(true)}
              className="text-[14px] font-medium text-[#26382D]/75 hover:text-[#26382D] transition-colors flex items-center gap-1.5 py-1.5 px-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] cursor-pointer"
            >
              <span>{t.nav.forBusinesses}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#7C9278]" />
            </button>

            <span className="w-[1px] h-4 bg-[#D8C9BE]" aria-hidden="true" />

            {/* Language Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#26382D] text-xs font-semibold tracking-wider hover:bg-[#F8F6F3] border border-transparent hover:border-[#D8C9BE] transition-all focus:outline-none cursor-pointer"
                aria-label="Language selector"
              >
                <Globe className="w-3.5 h-3.5 text-[#7C9278]" />
                <span className="uppercase">{currentLang}</span>
                <span className="text-[#A99587] text-[10px]">▼</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-[#F8F6F3] rounded-xl shadow-[0_8px_24px_rgba(38,56,45,0.08)] border border-[#D8C9BE] py-1.5 z-50 animate-in fade-in duration-150">
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer ${
                      currentLang === 'en' ? 'bg-[#D8C9BE]/30 font-semibold text-[#26382D]' : 'text-[#26382D]/80 hover:bg-[#F1EDE9]'
                    }`}
                  >
                    <span>English</span>
                    <span className="text-[11px] text-[#A99587]">EN</span>
                  </button>
                  <button
                    onClick={() => handleLanguageChange('hi')}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer ${
                      currentLang === 'hi' ? 'bg-[#D8C9BE]/30 font-semibold text-[#26382D]' : 'text-[#26382D]/80 hover:bg-[#F1EDE9]'
                    }`}
                  >
                    <span>हिन्दी</span>
                    <span className="text-[11px] text-[#A99587]">HI</span>
                  </button>
                  <button
                    onClick={() => handleLanguageChange('mr')}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer ${
                      currentLang === 'mr' ? 'bg-[#D8C9BE]/30 font-semibold text-[#26382D]' : 'text-[#26382D]/80 hover:bg-[#F1EDE9]'
                    }`}
                  >
                    <span>मराठी</span>
                    <span className="text-[11px] text-[#A99587]">MR</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSignInModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#26382D]/20 text-[#26382D] text-xs font-semibold tracking-wide hover:bg-[#F8F6F3] hover:border-[#26382D] transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#7C9278]" />
              <span>{t.nav.signIn}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="px-2.5 py-1.5 rounded-lg border border-[#D8C9BE] text-[#26382D] text-xs font-semibold flex items-center gap-1 bg-[#F8F6F3]"
            >
              <Globe className="w-3 h-3 text-[#7C9278]" />
              <span className="uppercase">{currentLang}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#26382D] hover:bg-[#F8F6F3] transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#F8F6F3] border-b border-[#D8C9BE] px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col space-y-3 text-base font-medium text-[#26382D]">
              <a 
                href="#trip-input" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 border-b border-[#26382D]/5"
              >
                {t.nav.planTrip}
              </a>
              <a 
                href="#value-propositions" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 border-b border-[#26382D]/5"
              >
                {t.nav.explore}
              </a>
              <a 
                href="#editorial-philosophy" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 border-b border-[#26382D]/5"
              >
                {t.nav.trips}
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsBusinessModalOpen(true);
                }}
                className="text-left py-1 text-[#7C9278] flex items-center justify-between"
              >
                <span>{t.nav.forBusinesses}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </nav>

            <div className="pt-2 border-t border-[#D8C9BE]/60 flex items-center justify-between">
              <span className="text-xs text-[#A99587] font-medium">{t.nav.language}:</span>
              <div className="flex gap-1.5">
                {(['en', 'hi', 'mr'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      handleLanguageChange(l);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1 rounded text-xs uppercase font-semibold transition-all ${
                      currentLang === l ? 'bg-[#26382D] text-[#F8F6F3]' : 'bg-[#E8CFC4]/30 text-[#26382D]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* -------------------------------------- */}
      {/* MAIN HOMEPAGE SECTIONS                */}
      {/* -------------------------------------- */}
      <main className="flex-1">
        
        {/* 2. HERO SECTION */}
        <section id="trip-input" className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0 ambient-subtle-glow" />

          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 text-center">
            
            {/* Cormorant Garamond Headline */}
            <div className="space-y-2 mb-6">
              <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-[#26382D] leading-[1.08] text-balance">
                <span className="block">{t.hero.headlinePart1}</span>
                <span className="block font-light italic text-[#7C9278]">{t.hero.headlinePart2}</span>
                <span className="block">{t.hero.headlinePart3}</span>
              </h1>

              {/* DM Sans Supporting Statement */}
              <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#26382D]/75 font-normal leading-relaxed pt-2">
                {t.hero.supporting}
              </p>
            </div>

            {/* 3. PRIMARY TRIP INPUT: Large rounded search-like card */}
            <div className="mt-10 max-w-3xl mx-auto text-left">
              <div className="bg-[#F8F6F3] rounded-3xl p-5 sm:p-7 border border-[#D8C9BE] shadow-[0_12px_36px_rgba(38,56,45,0.06)] hover:border-[#A99587] transition-all duration-300">
                
                <div className="flex items-center justify-between mb-3 text-xs tracking-wide">
                  <label 
                    htmlFor="trip-natural-input" 
                    className="font-medium text-[#26382D] flex items-center gap-2 cursor-pointer uppercase tracking-[0.12em]"
                  >
                    <Search className="w-3.5 h-3.5 text-[#7C9278]" />
                    <span>{t.inputCard.label}</span>
                  </label>

                  <div className="flex items-center gap-3">
                    {tripQuery && (
                      <button
                        type="button"
                        onClick={() => setTripQuery('')}
                        className="text-[#A99587] hover:text-[#26382D] transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>{t.inputCard.clear}</span>
                      </button>
                    )}
                    <span className="text-[#A99587] text-[11px] font-mono tabular-nums">
                      {tripQuery.length} {t.inputCard.charCount}
                    </span>
                  </div>
                </div>

                {/* Natural Language Textarea */}
                <div className="relative">
                  <textarea
                    id="trip-natural-input"
                    rows={3}
                    value={tripQuery}
                    onChange={(e) => setTripQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t.inputCard.placeholder}
                    className="w-full bg-transparent text-[#26382D] placeholder-[#26382D]/40 text-base sm:text-lg font-normal leading-relaxed resize-none focus:outline-none border-b border-[#D8C9BE]/50 pb-3"
                    aria-label={t.inputCard.label}
                  />
                </div>

                {/* Action Bar */}
                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
                  
                  {/* Left: Dictate button & key hint */}
                  <div className="flex items-center gap-3 text-xs text-[#26382D]/60">
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs cursor-pointer ${
                        isListening 
                          ? 'bg-[#E8CFC4] border-[#A99587] text-[#26382D] animate-pulse font-medium'
                          : 'border-[#D8C9BE] text-[#26382D]/75 hover:bg-[#F1EDE9] hover:text-[#26382D]'
                      }`}
                      title={t.inputCard.voiceInputTooltip}
                    >
                      <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-[#26382D]' : 'text-[#7C9278]'}`} />
                      <span>{isListening ? 'Listening...' : 'Dictate'}</span>
                    </button>

                    <span className="hidden sm:inline text-[#A99587] text-[11px]">
                      Press <kbd className="px-1.5 py-0.5 rounded bg-[#F1EDE9] text-[#26382D] font-mono text-[10px] border border-[#D8C9BE]">↵ Enter</kbd> to search
                    </span>
                  </div>

                  {/* 4. PRIMARY CTA: Find My Options */}
                  <button
                    type="button"
                    onClick={handleFindOptions}
                    className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#26382D] text-[#F8F6F3] text-sm font-medium tracking-wide hover:bg-[#1d2c23] active:scale-[0.98] transition-all shadow-[0_4px_16px_rgba(38,56,45,0.12)] cursor-pointer"
                  >
                    <span>{t.inputCard.buttonText}</span>
                    <ArrowRight className="w-4 h-4 text-[#A9B8A3] group-hover:translate-x-1 transition-transform" />
                  </button>

                </div>

                <div className="mt-3 text-center sm:text-left">
                  <p className="text-[12px] text-[#A99587] font-light">
                    {t.inputCard.helperText}
                  </p>
                </div>

              </div>
            </div>

            {/* 5. EXAMPLE PROMPTS */}
            <div className="mt-8 max-w-3xl mx-auto text-left">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7C9278]">
                  {t.examplePrompts.heading}
                </span>
                <span className="h-[1px] flex-1 bg-[#D8C9BE]/50" />
              </div>

              <div className="flex flex-wrap gap-2.5">
                {t.examplePrompts.items.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => setTripQuery(prompt.query)}
                    className="text-left text-xs sm:text-[13px] px-3.5 py-2 rounded-xl bg-[#F8F6F3] border border-[#D8C9BE] text-[#26382D] hover:border-[#7C9278] hover:bg-white active:scale-[0.99] transition-all shadow-2xs group flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-[#A9B8A3] group-hover:text-[#7C9278] transition-colors">↗</span>
                    <span className="font-normal">{prompt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Photographic Vignette Anchor */}
            <div className="mt-14 max-w-4xl mx-auto rounded-2xl overflow-hidden border border-[#D8C9BE]/60 relative shadow-sm">
              <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full bg-[#D8C9BE]/30 overflow-hidden">
                <img 
                  src={heroBgImage} 
                  alt="Lush green Western Ghats with electric train route between Mumbai and Goa" 
                  className="w-full h-full object-cover object-center filter brightness-[0.96] contrast-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#26382D]/75 via-[#26382D]/20 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex flex-col sm:flex-row sm:items-center justify-between text-left text-[#F8F6F3]">
                  <div className="space-y-0.5">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-[#A9B8A3] font-medium">
                      Konkan Corridor &bull; Western Ghats Rail
                    </span>
                    <p className="font-serif text-lg sm:text-xl font-light italic">
                      Step-free platform boarding &bull; 82% lower emissions than Mumbai–Goa flights
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center gap-2 text-xs font-mono text-[#E8CFC4]">
                    <span>18.4 kg CO₂e / traveler</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 6. QUICK VALUE PROPOSITION (4 Simple Benefits with Evidence Badges) */}
        <section id="value-propositions" className="py-16 sm:py-20 border-t border-[#D8C9BE]/50 relative z-10">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#7C9278] block mb-2">
                The Decision Matrix
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#26382D]">
                {t.valueProps.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.valueProps.items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#F8F6F3] rounded-2xl p-6 border border-[#D8C9BE]/60 shadow-[0_4px_16px_rgba(38,56,45,0.03)] hover:border-[#7C9278]/50 hover:shadow-[0_8px_24px_rgba(38,56,45,0.06)] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#26382D]/8">
                      <div className="w-10 h-10 rounded-xl bg-[#F1EDE9] flex items-center justify-center text-lg">
                        {item.symbol}
                      </div>
                      <span className="text-xs font-mono text-[#A99587]">0{idx + 1}</span>
                    </div>

                    <h3 className="text-lg font-serif font-medium text-[#26382D] mb-2 group-hover:text-[#7C9278] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-[13px] text-[#26382D]/75 font-normal leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#26382D]/6 flex items-center justify-between">
                    <DataStateBadge state={item.badgeState} label={item.tag} />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* 7. SMALL TRUST / EDITORIAL EXPLANATION SECTION */}
        <section id="editorial-philosophy" className="py-20 sm:py-28 bg-[#F8F6F3] border-t border-[#D8C9BE]/50 relative z-10">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
              
              <div className="lg:col-span-7 space-y-6">
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#7C9278]">
                  {t.editorial.kicker}
                </span>

                <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#26382D] leading-[1.12] text-balance">
                  {t.editorial.heading}
                </h2>

                <p className="text-base sm:text-lg text-[#26382D]/80 font-light leading-relaxed max-w-2xl">
                  {t.editorial.supporting}
                </p>

                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2 border-l-2 border-[#7C9278] pl-4">
                    <h4 className="text-sm font-semibold text-[#26382D]">{t.editorial.bullet1Title}</h4>
                    <p className="text-xs text-[#26382D]/70 font-light leading-relaxed">
                      {t.editorial.bullet1Desc}
                    </p>
                  </div>

                  <div className="space-y-2 border-l-2 border-[#A9B8A3] pl-4">
                    <h4 className="text-sm font-semibold text-[#26382D]">{t.editorial.bullet2Title}</h4>
                    <p className="text-xs text-[#26382D]/70 font-light leading-relaxed">
                      {t.editorial.bullet2Desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Editorial verified stay card */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden shadow-[0_16px_36px_rgba(38,56,45,0.08)] border border-[#D8C9BE]">
                  <div className="aspect-[4/3] w-full bg-[#D8C9BE]/30 overflow-hidden">
                    <img 
                      src={accessibleGoaImg} 
                      alt="Verified barrier-free eco retreat in Goa with ramped stone pathways and open verandas" 
                      className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="p-4 bg-[#F8F6F3] border-t border-[#D8C9BE]/50 flex items-center justify-between text-xs text-[#26382D]">
                    <div>
                      <span className="font-semibold block">Sernabatim Heritage Haven &bull; South Goa</span>
                      <span className="text-[#A99587] text-[11px]">100% Step-Free &bull; Rainwater-Harvested</span>
                    </div>
                    <DataStateBadge state="verified" label="Audited" />
                  </div>
                </div>
              </div>

            </div>

            {/* Editorial Manifesto Quote */}
            <div className="pt-12 border-t border-[#26382D]/10 flex flex-col md:flex-row items-baseline justify-between gap-8">
              <blockquote className="font-serif italic text-xl sm:text-2xl text-[#26382D]/85 max-w-3xl leading-relaxed">
                {t.editorial.manifesto}
              </blockquote>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#A99587] shrink-0">
                {t.editorial.attribution}
              </div>
            </div>

          </div>
        </section>

        {/* 8. ACCESSIBILITY + SUSTAINABILITY VISUAL (CONVERGENCE) */}
        <section className="py-20 sm:py-28 relative overflow-hidden bg-[#F1EDE9]">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center">
            
            <div className="max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#7C9278] block">
                {t.convergence.kicker}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#26382D] text-balance">
                {t.convergence.title}
              </h2>
              <p className="text-sm sm:text-base text-[#26382D]/75 font-light leading-relaxed">
                {t.convergence.description}
              </p>
            </div>

            {/* Abstract Tasteful Visual Composition */}
            <div className="relative max-w-4xl mx-auto bg-[#F8F6F3] rounded-3xl p-8 sm:p-12 border border-[#D8C9BE] shadow-[0_12px_32px_rgba(38,56,45,0.04)]">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative z-10">
                
                {/* Accessibility Pillar */}
                <div className="p-6 rounded-2xl bg-[#F1EDE9]/70 border border-[#A9B8A3] text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#26382D] text-[#F8F6F3] flex items-center justify-center">
                      <Accessibility className="w-5 h-5 text-[#E8CFC4]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-medium text-[#26382D]">
                        {t.convergence.leftLabel}
                      </h3>
                      <span className="text-[11px] text-[#A99587] uppercase tracking-wider">Physical Dignity &amp; Ease</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#26382D]/80 leading-relaxed font-light mt-2">
                    {t.convergence.leftDesc}
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#D8C9BE]/50 flex items-center gap-2 text-[11px] text-[#7C9278] font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Audited door clearances &amp; platform hoists</span>
                  </div>
                </div>

                {/* Sustainability Pillar */}
                <div className="p-6 rounded-2xl bg-[#F1EDE9]/70 border border-[#7C9278]/60 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#7C9278] text-[#F8F6F3] flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-medium text-[#26382D]">
                        {t.convergence.rightLabel}
                      </h3>
                      <span className="text-[11px] text-[#7C9278] uppercase tracking-wider">Ecological Harmony</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#26382D]/80 leading-relaxed font-light mt-2">
                    {t.convergence.rightDesc}
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#D8C9BE]/50 flex items-center gap-2 text-[11px] text-[#7C9278] font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Electric rail corridors &amp; zero-waste homestays</span>
                  </div>
                </div>

              </div>

              {/* Vector Convergence Graphic */}
              <div className="my-8 relative flex items-center justify-center">
                <div className="hidden md:flex items-center justify-center w-full max-w-md">
                  <svg className="w-full h-16 text-[#A9B8A3]" viewBox="0 0 400 64" fill="none">
                    <path d="M 50 10 L 200 50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                    <path d="M 350 10 L 200 50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                    <circle cx="200" cy="50" r="5" fill="#7C9278" />
                  </svg>
                </div>
              </div>

              {/* Center Box: YOUR JOURNEY */}
              <div className="relative z-10 max-w-lg mx-auto bg-[#26382D] text-[#F8F6F3] rounded-2xl p-7 shadow-[0_16px_36px_rgba(38,56,45,0.16)] border border-[#7C9278]/30">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F8F6F3]/10 text-[#E8CFC4] text-[11px] font-mono uppercase tracking-[0.2em] mb-2">
                  <Sparkles className="w-3 h-3 text-[#E8CFC4]" />
                  Conscious Synthesis
                </div>
                <h4 className="font-serif text-2xl sm:text-3xl font-medium tracking-wide text-[#F8F6F3]">
                  {t.convergence.centerLabel}
                </h4>
                <p className="text-xs sm:text-sm text-[#F8F6F3]/80 font-light mt-1 mb-4">
                  {t.convergence.centerSub}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#F8F6F3]/15 text-center text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[#A9B8A3] text-[10px] block uppercase tracking-wider">Mobility</span>
                    <span className="font-medium">100% Step-Free</span>
                  </div>
                  <div className="space-y-0.5 border-x border-[#F8F6F3]/15 px-1">
                    <span className="text-[#A9B8A3] text-[10px] block uppercase tracking-wider">Carbon</span>
                    <span className="font-medium">-82% vs Flights</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[#A9B8A3] text-[10px] block uppercase tracking-wider">Certainty</span>
                    <span className="font-medium">Verified Evidence</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 9. BUSINESS CTA SECTION */}
        <section id="for-businesses" className="py-20 bg-[#D8C9BE]/35 border-t border-[#D8C9BE] relative z-10">
          <div className="max-w-5xl mx-auto px-6 sm:px-8">
            <div className="bg-[#F8F6F3] rounded-3xl p-8 sm:p-12 border border-[#D8C9BE] shadow-[0_8px_30px_rgba(38,56,45,0.04)] flex flex-col md:flex-row items-center justify-between gap-10">
              
              <div className="space-y-4 max-w-xl text-left">
                <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase text-[#7C9278]">
                  <Building2 className="w-4 h-4 text-[#7C9278]" />
                  <span>Hospitality &amp; Transit Operators</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#26382D] leading-tight text-balance">
                  {t.business.heading}
                </h2>

                <p className="text-sm sm:text-base text-[#26382D]/80 font-light leading-relaxed">
                  {t.business.supporting}
                </p>

                <div className="pt-2 space-y-1.5 text-xs text-[#26382D]/75">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#7C9278]" />
                    <span>{t.business.bullet1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#7C9278]" />
                    <span>{t.business.bullet2}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-center sm:items-start gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsBusinessModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#26382D] text-[#F8F6F3] text-sm font-semibold tracking-wide hover:bg-[#1a271f] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                >
                  <span>{t.business.cta}</span>
                  <ArrowRight className="w-4 h-4 text-[#A9B8A3]" />
                </button>
                <span className="text-[11px] text-[#A99587] text-center sm:text-left">
                  450+ verified eco-homestays in India
                </span>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* 10. MINIMAL DEEP FOREST FOOTER */}
      <footer className="bg-[#26382D] text-[#F8F6F3] pt-16 pb-24 md:pb-16 border-t border-[#26382D] relative z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#F8F6F3]/12">
            
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#7C9278] flex items-center justify-center text-[#26382D]">
                  <svg className="w-4 h-4 text-[#F8F6F3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                  </svg>
                </div>
                <span className="font-serif text-2xl tracking-tight font-medium text-[#F8F6F3]">
                  {t.brandName}
                </span>
              </div>

              <p className="text-xs sm:text-[13px] text-[#F8F6F3]/75 font-light leading-relaxed max-w-sm">
                {t.footer.description}
              </p>

              <div className="text-[11px] text-[#A9B8A3] font-mono tracking-wider pt-2">
                MUMBAI &bull; BENGALURU &bull; DELHI &bull; GOA &bull; KOCHI
              </div>
            </div>

            <div className="md:col-span-3 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A9B8A3]">
                Navigation
              </div>
              <ul className="text-xs space-y-2 text-[#F8F6F3]/85 font-light">
                <li>
                  <a href="#trip-input" className="hover:text-white transition-colors">
                    {t.footer.planTrip}
                  </a>
                </li>
                <li>
                  <a href="#value-propositions" className="hover:text-white transition-colors">
                    {t.footer.explore}
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => setIsBusinessModalOpen(true)} 
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    {t.footer.forBusinesses}
                  </button>
                </li>
                <li>
                  <a href="#editorial-philosophy" className="hover:text-white transition-colors">
                    {t.footer.about}
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A9B8A3]">
                {t.nav.language} Selector
              </div>

              <div className="flex items-center gap-2">
                {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      currentLang === lang
                        ? 'bg-[#7C9278] text-[#F8F6F3] font-semibold'
                        : 'bg-[#F8F6F3]/10 text-[#F8F6F3]/80 hover:bg-[#F8F6F3]/20'
                    }`}
                  >
                    {lang === 'en' ? 'English (EN)' : lang === 'hi' ? 'हिन्दी (HI)' : 'मराठी (MR)'}
                  </button>
                ))}
              </div>

              <div className="pt-2 text-[11px] text-[#A9B8A3] leading-relaxed">
                Prioritizing low-carbon electrified transit and physical accessibility standards across India.
              </div>

              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 text-xs text-[#A9B8A3] hover:text-[#F8F6F3] transition-colors pt-1 cursor-pointer"
              >
                <span>Back to top</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#F8F6F3]/60 font-light gap-4">
            <div>{t.footer.copyright}</div>
            <div className="flex items-center gap-6">
              <span className="text-[#A9B8A3]">WCAG 2.1 AA Accessible</span>
              <span>&bull;</span>
              <span className="text-[#A9B8A3]">B2C Travel Prototype</span>
            </div>
          </div>

        </div>
      </footer>

      {/* 11. MOBILE BOTTOM NAVIGATION (Fixed at bottom on small screens) */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F8F6F3]/95 backdrop-blur-lg border-t border-[#D8C9BE] px-4 py-2 shadow-[0_-4px_16px_rgba(38,56,45,0.06)]"
        style={{ maxHeight: '64px' }}
        aria-label="Mobile Bottom Navigation"
      >
        <div className="grid grid-cols-4 items-center h-12">
          {[
            { id: 'search', label: t.bottomNav.search, icon: Search, href: '#trip-input' },
            { id: 'explore', label: t.bottomNav.explore, icon: Compass, href: '#value-propositions' },
            { id: 'trips', label: t.bottomNav.trips, icon: Bookmark, href: '#editorial-philosophy' },
            { id: 'profile', label: t.bottomNav.profile, icon: User, href: '#for-businesses' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = mobileActiveTab === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setMobileActiveTab(item.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
                  isActive ? 'text-[#26382D] font-semibold' : 'text-[#26382D]/60 hover:text-[#26382D]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C9278]' : 'text-[#A99587]'}`} />
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* -------------------------------------- */}
      {/* MODAL 1: TRIP SETUP REVIEW MODAL      */}
      {/* -------------------------------------- */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        maxWidth="2xl"
      >
        <div className="text-left space-y-2 pb-5 border-b border-[#D8C9BE]/60">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7C9278]">
            <Sparkles className="w-3.5 h-3.5 text-[#7C9278]" />
            <span>Step 1: Setup Confirmation</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#26382D]">
            {t.reviewModal.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#26382D]/75 font-light leading-relaxed">
            {t.reviewModal.subtitle}
          </p>
        </div>

        <div className="mt-4 p-3.5 rounded-xl bg-[#F1EDE9] border border-[#D8C9BE]/50 text-xs text-[#26382D]/85 italic flex items-start justify-between gap-3">
          <div>
            <span className="font-semibold not-italic text-[#7C9278] block text-[11px] uppercase tracking-wider mb-0.5">
              Original Prompt
            </span>
            &ldquo;{tripQuery}&rdquo;
          </div>
          <button
            onClick={() => setIsEditingSetup(!isEditingSetup)}
            className="text-[#26382D] hover:text-[#7C9278] text-[11px] font-semibold flex items-center gap-1 shrink-0 not-italic pt-1 cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>{isEditingSetup ? 'Cancel Edit' : 'Adjust'}</span>
          </button>
        </div>

        <div className="mt-6 space-y-4 text-left text-sm">
          {/* Route Section */}
          <div className="bg-white rounded-2xl p-4 border border-[#D8C9BE]/70">
            <div className="flex items-center justify-between text-xs text-[#A99587] font-medium uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5 text-[#26382D]">
                <Train className="w-3.5 h-3.5 text-[#7C9278]" />
                {t.reviewModal.routeLabel}
              </span>
              <DataStateBadge state="verified" label="Direct Corridor" />
            </div>
            
            {isEditingSetup ? (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="text-[11px] text-[#A99587]">Origin</label>
                  <input
                    type="text"
                    value={parsedTrip.origin}
                    onChange={(e) => setParsedTrip({ ...parsedTrip, origin: e.target.value })}
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-[#D8C9BE] bg-[#F8F6F3]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#A99587]">Destination</label>
                  <input
                    type="text"
                    value={parsedTrip.destination}
                    onChange={(e) => setParsedTrip({ ...parsedTrip, destination: e.target.value })}
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-[#D8C9BE] bg-[#F8F6F3]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-base font-serif text-[#26382D] font-medium">
                <span>{parsedTrip.origin}</span>
                <span className="text-[#7C9278] text-sm font-sans">⟶</span>
                <span>{parsedTrip.destination}</span>
                <span className="text-xs font-sans text-[#A99587] font-normal ml-auto">
                  Est. 580 km
                </span>
              </div>
            )}
          </div>

          {/* Travelers */}
          <div className="bg-white rounded-2xl p-4 border border-[#D8C9BE]/70">
            <div className="flex items-center justify-between text-xs text-[#A99587] font-medium uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5 text-[#26382D]">
                <Users className="w-3.5 h-3.5 text-[#7C9278]" />
                {t.reviewModal.travelersLabel}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-[#26382D]">
              <span className="px-3 py-1.5 rounded-lg bg-[#F1EDE9] border border-[#D8C9BE]">
                {parsedTrip.travelers.adults} Adult(s)
              </span>
              {parsedTrip.travelers.children > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-[#F1EDE9] border border-[#D8C9BE]">
                  {parsedTrip.travelers.children} Child(ren)
                </span>
              )}
              {parsedTrip.travelers.seniors > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-[#F1EDE9] border border-[#D8C9BE]">
                  {parsedTrip.travelers.seniors} Senior Citizen
                </span>
              )}
              {parsedTrip.travelers.wheelchairUsers > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-[#E8CFC4]/50 border border-[#A99587] font-medium text-[#26382D] flex items-center gap-1.5">
                  <Accessibility className="w-3.5 h-3.5 text-[#26382D]" />
                  1 Wheelchair User
                </span>
              )}
            </div>
          </div>

          {/* Accessibility Requirements */}
          <div className="bg-white rounded-2xl p-4 border border-[#D8C9BE]/70">
            <div className="flex items-center justify-between text-xs text-[#A99587] font-medium uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5 text-[#26382D]">
                <Accessibility className="w-3.5 h-3.5 text-[#7C9278]" />
                {t.reviewModal.accessLabel}
              </span>
              <DataStateBadge state="verified" label="Priority Filter" />
            </div>

            <ul className="space-y-1.5 text-xs text-[#26382D]/85">
              {parsedTrip.accessibilityNeeds.map((need, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C9278]" />
                  <span>{need}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sustainability Parameters */}
          <div className="bg-white rounded-2xl p-4 border border-[#D8C9BE]/70">
            <div className="flex items-center justify-between text-xs text-[#A99587] font-medium uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5 text-[#26382D]">
                <Leaf className="w-3.5 h-3.5 text-[#7C9278]" />
                {t.reviewModal.sustainabilityLabel}
              </span>
              <DataStateBadge state="verified" label="-82% Target" />
            </div>

            <ul className="space-y-1.5 text-xs text-[#26382D]/85">
              {parsedTrip.sustainabilityGoals.map((goal, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A9B8A3]" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-[#D8C9BE]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[#A99587] text-center sm:text-left">
            {t.inputCard.helperText}
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isEditingSetup && (
              <button
                type="button"
                onClick={() => setIsEditingSetup(false)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#7C9278] text-white text-xs font-semibold hover:bg-[#6c8368] transition-all cursor-pointer"
              >
                Save Changes
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setConfirmedSetup(true);
                setTimeout(() => {
                  setTimeout(() => {
                    setIsReviewModalOpen(false);
                    setConfirmedSetup(false);
                  }, 1600);
                }, 300);
              }}
              className={`w-full sm:w-auto px-7 py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                confirmedSetup 
                  ? 'bg-[#7C9278] text-white' 
                  : 'bg-[#26382D] text-[#F8F6F3] hover:bg-[#1a271f]'
              }`}
            >
              {confirmedSetup ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Preferences Saved!</span>
                </>
              ) : (
                <span>{t.reviewModal.confirmAction}</span>
              )}
            </button>
          </div>
        </div>

        {confirmedSetup && (
          <div className="mt-4 p-3 rounded-xl bg-[#7C9278]/15 border border-[#7C9278] text-xs text-[#26382D] text-center animate-in fade-in">
            {t.reviewModal.toastMessage}
          </div>
        )}
      </Modal>

      {/* -------------------------------------- */}
      {/* MODAL 2: BUSINESS PARTNER REGISTRY     */}
      {/* -------------------------------------- */}
      <Modal
        isOpen={isBusinessModalOpen}
        onClose={() => setIsBusinessModalOpen(false)}
        maxWidth="lg"
      >
        <div className="text-left space-y-2 pb-4 border-b border-[#D8C9BE]/60">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7C9278]">
            <Building2 className="w-3.5 h-3.5" />
            <span>Green &amp; Inclusive Travel Network</span>
          </div>
          <h2 className="font-serif text-2xl font-medium text-[#26382D]">
            {t.business.cardTitle}
          </h2>
          <p className="text-xs text-[#26382D]/75 font-light">
            {t.business.tagline}
          </p>
        </div>

        {businessSubmitted ? (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#7C9278]/20 text-[#7C9278] mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl text-[#26382D]">Inquiry Received</h3>
            <p className="text-xs text-[#26382D]/80 max-w-xs mx-auto">
              Our audit team will connect within 24 hours to schedule your step-free and energy assessment.
            </p>
          </div>
        ) : (
          <form onSubmit={handleBusinessSubmit} className="mt-5 space-y-4 text-left">
            <div>
              <label className="block text-xs font-medium text-[#26382D] mb-1">
                Property / Service Name
              </label>
              <input
                type="text"
                required
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="e.g. Mandovi River Eco Villa, Goa"
                className="w-full text-xs p-3 rounded-xl border border-[#D8C9BE] bg-white text-[#26382D] focus:outline-none focus:border-[#7C9278]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#26382D] mb-1">
                  Region in India
                </label>
                <select
                  value={propertyLocation}
                  onChange={(e) => setPropertyLocation(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#D8C9BE] bg-white text-[#26382D] focus:outline-none"
                >
                  <option value="Goa">Goa</option>
                  <option value="Maharashtra">Maharashtra (Konkan / Mumbai)</option>
                  <option value="Kerala">Kerala (Backwaters / Wayanad)</option>
                  <option value="Rajasthan">Rajasthan (Jaipur / Udaipur)</option>
                  <option value="Karnataka">Karnataka (Coorg / Nilgiris)</option>
                  <option value="Himachal">Himachal Pradesh</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#26382D] mb-1">
                  Category
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#D8C9BE] bg-white text-[#26382D] focus:outline-none"
                >
                  <option value="Eco-Resort / Homestay">Eco-Resort / Homestay</option>
                  <option value="Accessible Ground Fleet">Accessible Ground Fleet</option>
                  <option value="Heritage Hotel">Heritage Hotel</option>
                  <option value="Activity / Tour Guide">Activity / Tour Guide</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F1EDE9] text-[11px] text-[#26382D]/75 space-y-1">
              <span className="font-semibold text-[#26382D] block">Inclusion Standards:</span>
              <p>• Verified doorway widths (&ge; 850mm) and step-free access</p>
              <p>• Renewable energy supply or zero-single-use plastics</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-5 rounded-xl bg-[#26382D] text-[#F8F6F3] text-xs font-semibold tracking-wide hover:bg-[#1f2e25] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#A9B8A3]" />
                <span>{t.business.button}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* -------------------------------------- */}
      {/* MODAL 3: SIGN IN MODAL                 */}
      {/* -------------------------------------- */}
      <Modal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        maxWidth="md"
      >
        <div className="text-center space-y-3 pt-2">
          <div className="w-12 h-12 rounded-full bg-[#7C9278]/20 text-[#26382D] mx-auto flex items-center justify-center">
            <Compass className="w-6 h-6 text-[#26382D]" />
          </div>
          <h3 className="font-serif text-2xl text-[#26382D]">Welcome to Conscious Travel</h3>
          <p className="text-sm text-[#26382D]/75 font-light">
            Sign in to save your verified accessibility preferences, low-carbon journey drafts, and favorite stays across India.
          </p>
        </div>
        <div className="mt-6 space-y-3">
          <button 
            onClick={() => setIsSignInModalOpen(false)}
            className="w-full py-3 px-4 rounded-xl bg-[#26382D] text-[#F8F6F3] text-sm font-semibold hover:bg-[#334b3d] transition-all cursor-pointer"
          >
            Sign in with Mobile OTP (India)
          </button>
          <button 
            onClick={() => setIsSignInModalOpen(false)}
            className="w-full py-3 px-4 rounded-xl bg-transparent border border-[#26382D]/20 text-[#26382D] text-sm font-semibold hover:bg-[#F1EDE9] transition-all cursor-pointer"
          >
            Continue with Email
          </button>
        </div>
        <div className="mt-5 text-center text-xs text-[#A99587]">
          Universal design standards compliant &bull; WCAG 2.1 AA
        </div>
      </Modal>

    </div>
  );
};

export default HomePage;
