import { SupportedLanguage } from "@/App";

// Common UI translations - only English and Hindi
export const uiTranslations: Record<
  string,
  Record<SupportedLanguage, string>
> = {
  // Navigation
  home: {
    en: "Home",
    hi: "होम",
  },
  reports: {
    en: "Reports",
    hi: "रिपोर्ट्स",
  },
  news: {
    en: "News",
    hi: "समाचार",
  },

  // KrishiMitraAI button
  askMe: {
    en: "Ask Me Anything",
    hi: "कुछ भी पूछें",
  },

  // Common labels and buttons
  loading: {
    en: "Loading...",
    hi: "लोड हो रहा है...",
  },
  submit: {
    en: "Submit",
    hi: "सबमिट",
  },
  cancel: {
    en: "Cancel",
    hi: "रद्द करें",
  },
  retry: {
    en: "Retry",
    hi: "पुनः प्रयास करें",
  },

  // KrishiMitraAI features
  listening: {
    en: "Listening...",
    hi: "सुन रहा हूँ...",
  },
  processing: {
    en: "Processing...",
    hi: "प्रोसेस कर रहा हूँ...",
  },
  speaking: {
    en: "Speaking...",
    hi: "बोल रहा हूँ...",
  },
  typeYourQuestion: {
    en: "Type your question...",
    hi: "अपना प्रश्न टाइप करें...",
  },
  speakNow: {
    en: "Speak now",
    hi: "अब बोलिए",
  },
  microphoneNotAvailable: {
    en: "Microphone not available",
    hi: "माइक्रोफोन उपलब्ध नहीं है",
  },

  // Confidence levels
  highConfidence: {
    en: "High confidence",
    hi: "उच्च विश्वास",
  },
  mediumConfidence: {
    en: "Medium confidence",
    hi: "मध्यम विश्वास",
  },
  lowConfidence: {
    en: "Low confidence",
    hi: "निम्न विश्वास",
  },

  // Suggested prompts categories
  weatherInfo: {
    en: "Weather Info",
    hi: "मौसम की जानकारी",
  },
  pestAdvice: {
    en: "Pest Advice",
    hi: "कीट सलाह",
  },
  cropRotation: {
    en: "Crop Rotation",
    hi: "फसल चक्र",
  },
  soilHealth: {
    en: "Soil Health",
    hi: "मिट्टी का स्वास्थ्य",
  },

  // Error messages
  errorOccurred: {
    en: "An error occurred",
    hi: "एक त्रुटि हुई",
  },
  tryAgainLater: {
    en: "Please try again later",
    hi: "कृपया बाद में पुनः प्रयास करें",
  },
  notUnderstoodQuestion: {
    en: "I couldn't understand your question",
    hi: "मैं आपके प्रश्न को समझ नहीं पाया",
  },

  // News page translations
  newsTitle: {
    en: "Agriculture News & Schemes",
    hi: "कृषि समाचार और योजनाएँ",
  },
  newsDescription: {
    en: "Latest farming news and government schemes for farmers",
    hi: "किसानों के लिए नवीनतम खेती समाचार और सरकारी योजनाएँ",
  },
  farmingNewsTab: {
    en: "Farming News",
    hi: "खेती समाचार",
  },
  schemesTab: {
    en: "Government Schemes",
    hi: "सरकारी योजनाएँ",
  },
  readMore: {
    en: "Read More",
    hi: "और पढ़ें",
  },
  errorMessage: {
    en: "Failed to load news. Please try again later.",
    hi: "समाचार लोड करने में विफल। कृपया बाद में पुनः प्रयास करें।",
  },
  noNewsAvailable: {
    en: "No news available at the moment.",
    hi: "इस समय कोई समाचार उपलब्ध नहीं है।",
  },
  publishedOn: {
    en: "Published on",
    hi: "प्रकाशित",
  },
  source: {
    en: "Source",
    hi: "स्रोत",
  },
};

// Helper function to get translations
// Cache to avoid repeated lookups
const translationCache: Record<string, string> = {};

/**
 * Gets a translation for a given key and language
 * Uses a cache to improve performance for repeated lookups
 * @param key The translation key to look up
 * @param language The target language
 * @returns The translated text or the key itself if not found
 */
export const getTranslation = (
  key: string,
  language: SupportedLanguage,
): string => {
  // Check cache first
  const cacheKey = `${language}:${key}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  let result: string;

  // Look up in UI translations
  if (uiTranslations[key] && uiTranslations[key][language]) {
    result = uiTranslations[key][language];
  }
  // Fallback to English if translation doesn't exist
  else if (uiTranslations[key] && uiTranslations[key].en) {
    result = uiTranslations[key].en;
  }
  // Return the key itself if no translation found
  else {
    result = key;
  }

  // Cache the result
  translationCache[cacheKey] = result;

  return result;
};

// Helper function for language specific formatting
export const formatWithLanguage = (
  text: string,
  language: SupportedLanguage,
  replacements?: Record<string, string>,
): string => {
  let result = text;

  // Replace placeholders in the text if replacements are provided
  if (replacements) {
    Object.entries(replacements).forEach(([key, value]) => {
      result = result.replace(`{${key}}`, value);
    });
  }

  return result;
};
