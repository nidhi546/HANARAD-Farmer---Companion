export const site = {
  name: "HANARAD Farmer-Companion",
  shortName: "HANARAD",
  tagline: "Smart Farming, Better Harvest",
  description:
    "The free, multilingual farming app powered by NASA satellite weather data. Map your farm by satellite, get AI crop advice, scan for disease, track live mandi prices, and never miss a weather alert — all in one app built for farmers.",
  url: "https://hanarad-farmer-companion.vercel.app",
  supportPhone: "1800-180-1551",
  supportEmail: "hanaplatform.business@gmail.com",
  legalEmail: "legal@hanarad.app",
  supportHours: "Mon – Sat, 9 AM – 6 PM IST",
  copyrightYear: 2026,
  version: "1.0.0",
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.hanapaltform.farmerapp",
};

export const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#screenshots", label: "Screenshots" },
  { href: "#languages", label: "Languages" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

export const heroStats = [
  { value: "4", label: "Languages, more on the way" },
  { value: "NASA", label: "Satellite-powered climate data" },
  { value: "Free", label: "No subscription, ever" },
];

export type Feature = {
  icon: string;
  title: string;
  description: string;
  tag?: string;
};

export const primaryFeatures: Feature[] = [
  {
    icon: "map-pinned",
    title: "Satellite Farm Mapping",
    description:
      "Draw your farm boundary right on a satellite map, or walk the perimeter with GPS. Get instant, precise area in acres, bigha, vigha, hectares, or sq. ft — with automatic land-type checks so you never map onto someone else's plot.",
    tag: "Flagship feature",
  },
  {
    icon: "satellite",
    title: "NASA-Powered Weather Intelligence",
    description:
      "Live forecasts, 10-day history, 30-year climatology, and real-time natural-disaster tracking — all sourced from NASA POWER, NASA EONET, and Open-Meteo. The kind of climate data usually reserved for enterprise agriculture, free for every farmer.",
  },
  {
    icon: "scan-line",
    title: "AI Disease Scanner",
    description:
      "Photograph a leaf and get an instant diagnosis with symptoms, treatments, and medicine recommendations for the crops and diseases common to your region.",
  },
  {
    icon: "sprout",
    title: "Smart Crop Advisor",
    description:
      "A 0–100 climate-fit score for every crop, personalized to your exact farm location and the season — Kharif, Rabi, or Zaid.",
  },
  {
    icon: "line-chart",
    title: "Live Mandi Prices",
    description:
      "Track real government market (APMC) prices for cotton, wheat, groundnut, and more, so you know exactly when and where to sell.",
  },
  {
    icon: "languages",
    title: "Multilingual + Voice Guidance",
    description:
      "Every screen, every alert, every disclaimer — available in English, Hindi, and Gujarati (with Filipino for our overseas farming community) and read aloud for farmers who prefer listening to reading.",
  },
];

export const secondaryFeatures: Feature[] = [
  {
    icon: "droplets",
    title: "Irrigation Advisor",
    description: "Science-backed water need estimates using the Hargreaves-Samani formula, tuned per crop.",
  },
  {
    icon: "calendar-range",
    title: "Sowing Calendar",
    description: "A 12-month visual timeline showing the best sowing window for every crop you grow.",
  },
  {
    icon: "landmark",
    title: "Govt. Schemes Directory",
    description: "PM-KISAN, Fasal Bima Yojana, Kisan Credit Card, and more — eligibility and official links in one place.",
  },
  {
    icon: "phone-call",
    title: "Expert Helplines",
    description: "One-tap calling to Kisan Call Centre, ICAR, IMD Weather, NABARD, and Soil Health helplines.",
  },
  {
    icon: "store",
    title: "Nearby Agri Stores",
    description: "Find seed, fertilizer, and pesticide shops near you using free OpenStreetMap data.",
  },
  {
    icon: "calculator",
    title: "Smart Farm Calculators",
    description: "EMI/loan, fertilizer dosage, seed quantity, and land-unit converters, all in one tabbed toolkit.",
  },
  {
    icon: "bell-ring",
    title: "Real-Time Alerts",
    description: "Weather and disaster alerts merged with NASA EONET events, delivered as push notifications.",
  },
  {
    icon: "layout-dashboard",
    title: "One-Glance Dashboard",
    description: "Weather, alerts, crop recommendations, and every feature — organized on a single home screen.",
  },
];

export const aboutPoints = [
  {
    icon: "satellite-dish",
    title: "NASA-Powered",
    description: "Real climate data from NASA POWER and Open-Meteo, not guesswork or generic averages.",
  },
  {
    icon: "languages",
    title: "Truly Multilingual",
    description: "English, Hindi, and Gujarati today, built to expand into Marathi, Tamil, Telugu, and Punjabi.",
  },
  {
    icon: "wifi-off",
    title: "Works Offline",
    description: "Weather, saved farms, and crop data are cached on-device so poor connectivity never stops you.",
  },
  {
    icon: "shield-check",
    title: "Privacy First",
    description: "Your farm data stays yours — never sold, always visible, always deletable on request.",
  },
];

export const journeySteps = [
  {
    step: "01",
    title: "Pick your language & set up your profile",
    description:
      "Choose from English, Hindi, Gujarati, or Filipino, accept the farming/data disclaimers, and grant location access — every step narrated by voice for accessibility.",
  },
  {
    step: "02",
    title: "Map your farm by satellite or GPS",
    description:
      "Tap corner-by-corner on a satellite map, or walk your boundary with GPS. HANARAD checks land type automatically and calculates your exact area.",
  },
  {
    step: "03",
    title: "Get your personalized dashboard",
    description:
      "Live weather, NASA climate alerts, crop recommendations, and mandi prices for your farm's exact coordinates — updated automatically.",
  },
  {
    step: "04",
    title: "Farm smarter, every day",
    description:
      "Scan a diseased leaf, check your sowing calendar, calculate irrigation needs, or track a scheme — all from one dashboard, in your own language.",
  },
];

export type Screenshot = {
  id: string;
  title: string;
  description: string;
  accent: "green" | "gold" | "indigo";
};

export const screenshots: Screenshot[] = [
  {
    id: "home",
    title: "Home Dashboard",
    description: "Weather, alerts, and every feature in one glance.",
    accent: "green",
  },
  {
    id: "map",
    title: "Satellite Farm Mapping",
    description: "Draw or GPS-walk your farm boundary in seconds.",
    accent: "gold",
  },
  {
    id: "weather",
    title: "NASA Weather Hub",
    description: "Daily, monthly, and 30-year climatology views.",
    accent: "indigo",
  },
  {
    id: "crops",
    title: "Smart Crop Advisor",
    description: "Climate-fit scores personalized to your farm.",
    accent: "green",
  },
  {
    id: "mandi",
    title: "Live Mandi Prices",
    description: "Real market prices, trend arrows included.",
    accent: "gold",
  },
  {
    id: "disease",
    title: "Disease Scanner",
    description: "Photograph a leaf, get treatment guidance instantly.",
    accent: "indigo",
  },
];

export const languages = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧", region: "All regions", sample: "Good morning, farmer!" },
  { code: "hi", label: "Hindi", native: "हिंदी", flag: "🇮🇳", region: "North & Central India", sample: "सुप्रभात, किसान भाई!" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", flag: "🪔", region: "Gujarat, Saurashtra", sample: "સુપ્રભાત, ખેડૂત ભાઈ!" },
  { code: "tl", label: "Filipino", native: "Filipino", flag: "🇵🇭", region: "Philippines", sample: "Magandang umaga, magsasaka!" },
];

export const benefits = [
  {
    title: "Enterprise-grade data, zero cost",
    description:
      "NASA POWER climatology and satellite disaster tracking are the same class of data agribusinesses pay for — HANARAD brings it to every smallholder farmer for free.",
  },
  {
    title: "Built for the field, not the office",
    description:
      "High-contrast, sunlight-readable screens, offline caching, and voice narration mean the app works in a field with patchy signal, not just in a demo.",
  },
  {
    title: "One app instead of five",
    description:
      "Weather, crop advice, disease ID, market prices, government schemes, and calculators — no more switching between apps or waiting on a call to an agent.",
  },
  {
    title: "Speaks your language, literally",
    description:
      "Every disclaimer, alert, and instruction is translated and voice-narrated, designed for farmers who are more comfortable listening than reading.",
  },
];

export const techStack = [
  { name: "React Native", detail: "Cross-platform mobile app (iOS & Android)" },
  { name: "Expo", detail: "Managed native tooling & OTA-ready builds" },
  { name: "React Navigation", detail: "Stack, drawer & tab navigation" },
  { name: "NASA POWER API", detail: "Climate & weather data" },
  { name: "NASA EONET", detail: "Real-time natural disaster events" },
  { name: "Open-Meteo", detail: "Short-term weather forecasts" },
  { name: "OpenStreetMap", detail: "Land-use, geocoding & nearby stores" },
  { name: "Firebase Cloud Messaging", detail: "Push notifications" },
  { name: "Node.js & Express", detail: "Farm data & notification backend" },
  { name: "MongoDB", detail: "Farm boundary & notification storage" },
];

export const faqs = [
  {
    question: "Is HANARAD Farmer-Companion really free?",
    answer:
      "Yes. The app is free to download and free to use — no subscription, no paywalled features. It's built to make enterprise-grade farming data accessible to every farmer.",
  },
  {
    question: "Which languages are supported?",
    answer:
      "English, Hindi, and Gujarati today, with Filipino for our overseas farming community. Marathi, Tamil, Telugu, and Punjabi are coming soon.",
  },
  {
    question: "Does the app work without internet access?",
    answer:
      "Core data — weather, your saved farms, and crop information — is cached on your device, so you can keep working through patchy connectivity. A connection is needed to fetch fresh data.",
  },
  {
    question: "How does farm boundary mapping work?",
    answer:
      "You can tap corner-by-corner on a satellite map or physically walk your farm's edge with GPS tracking. HANARAD automatically closes the polygon, checks for overlap with buildings or water, and calculates area in acres, bigha, vigha, hectares, or square feet.",
  },
  {
    question: "Where does the weather and climate data come from?",
    answer:
      "Live and historical data comes from NASA POWER and Open-Meteo, and natural disaster alerts come from NASA EONET. These are the same public scientific data sources used by researchers and agribusinesses worldwide.",
  },
  {
    question: "Is my farm and location data private?",
    answer:
      "Yes. Your data is used only to power the app's features, is never sold to third parties, and you can request access, correction, or deletion at any time by contacting us.",
  },
  {
    question: "Is the disease scanner a certified diagnostic tool?",
    answer:
      "The scanner gives guidance based on visual symptoms and is intended to support — not replace — advice from a certified agricultural expert, especially for high-value crops or severe outbreaks.",
  },
];

export const footerLinks = {
  app: [
    { href: "#features", label: "Features" },
    { href: "#screenshots", label: "Screenshots" },
    { href: "#how-it-works", label: "How It Works" },
  ],
  languages: languages.map((l) => ({ href: "#languages", label: `${l.flag} ${l.native}` })),
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms & Conditions" },
    { href: `mailto:${site.legalEmail}`, label: "Contact Legal" },
  ],
};
