import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropletIcon, Sprout, Home } from "lucide-react";
import { getTranslation } from "@/utils/translations";
import { SupportedLanguage } from "@/App";

interface NotFoundProps {
  language?: SupportedLanguage;
}

const NotFound: React.FC<NotFoundProps> = ({ language = 'en' }) => {
  const navigate = useNavigate();

  const translations = {
    title: language === 'hi' ? 'पृष्जा नहीं मिला' : 'Page Not Found',
    description: language === 'hi'
      ? 'आप जो पृष्जा ढूंढ रही है जो मौजूद नहीं है। कृपया होम पेज वापस जाएं।'
      : 'The page you are looking for does not exist. Please return to home.',
    goHome: language === 'hi' ? 'होम पर जाएं' : 'Go Home'
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        {/* Icon Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="animate-pulse">
              <DropletIcon className="h-16 w-16 text-water opacity-20" />
            </div>
            <div className="absolute -top-2 -right-2 animate-ping">
              <Sprout className="h-6 w-6 text-earth opacity-60" />
            </div>
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl font-bold text-muted-foreground mb-2">404</h1>

        {/* Error Title */}
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          {translations.title}
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {translations.description}
        </p>

        {/* Home Button */}
        <Button
          onClick={() => navigate('/')}
          className="group"
          size="lg"
        >
          <Home className="mr-2 h-4 w-4 group-hover:animate-bounce" />
          {translations.goHome}
        </Button>

        {/* Water Drop Decoration */}
        <div className="fixed bottom-0 left-0 w-full h-32 overflow-hidden pointer-events-none opacity-10">
          <div className="flex animate-slide-up">
            {[...Array(6)].map((_, i) => (
              <DropletIcon
                key={i}
                className="h-8 w-8 text-water mx-2 animate-fall"
                style={{
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${3 + i * 0.5}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(calc(100vh + 100px)) rotate(180deg);
            opacity: 0;
          }
        }

        @keyframes ping {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes slide-up {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100vw);
          }
        }

        .animate-fall {
          animation: fall linear infinite;
        }

        .animate-ping {
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-slide-up {
          animation: slide-up 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
