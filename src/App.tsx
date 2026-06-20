import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import ApiKeySettings from "@/components/ApiKeySettings";
import NotFound from "./pages/NotFound";
import { TranslationProvider } from "./contexts/TranslationContext";
import { AppProvider } from "./contexts/AppContext";
import { refreshOpenRouterClient } from "@/integrations/openrouter";
import {
  IndexPage,
  ReportsPage,
  NewsPage,
  SavedReportsPage,
} from "./pages/LazyComponents";

const queryClient = new QueryClient();

// Define supported languages - only English and Hindi
export type SupportedLanguage = "en" | "hi";

// Language display names
export const languageNames: Record<SupportedLanguage, string> = {
  en: "English",
  hi: "हिंदी", // Hindi
};

// Footer translations
export const footerText: Record<SupportedLanguage, string> = {
  en: "© 2025 FarmGPT - AI-Powered Farm Management Assistant",
  hi: "© 2025 फार्मजीपीटी - AI-संचालित खेत प्रबंधन सहायक",
};

const App = () => {
  const [language, setLanguage] = useState<SupportedLanguage>("en");

  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferredLanguage");
    if (savedLanguage && Object.keys(languageNames).includes(savedLanguage)) {
      setLanguage(savedLanguage as SupportedLanguage);
    }
  }, []);

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("preferredLanguage", language);
  }, [language]);

  // Handle API key changes - refresh OpenRouter client
  const handleApiKeyChange = useCallback((apiKey: string) => {
    if (apiKey) {
      refreshOpenRouterClient();
      console.log('OpenRouter API key updated');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <TranslationProvider language={language}>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen flex flex-col">
                <ApiKeySettings onApiKeyChange={handleApiKeyChange} />
                <Header
                  currentLanguage={language}
                  onLanguageChange={setLanguage}
                />
                <main className="flex-1">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <IndexPage
                          language={language}
                          onLanguageChange={setLanguage}
                        />
                      }
                    />
                    <Route
                      path="/reports"
                      element={<ReportsPage language={language} />}
                    />
                    <Route
                      path="/news"
                      element={<NewsPage language={language} />}
                    />
                    <Route
                      path="/saved-reports"
                      element={<SavedReportsPage language={language} />}
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <footer className="border-t py-4 text-center text-sm text-muted-foreground relative">
                  {footerText[language]}
                </footer>
              </div>
            </BrowserRouter>
          </TranslationProvider>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
