import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Key, Eye, EyeOff, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeySettingsProps {
  onApiKeyChange?: (apiKey: string) => void;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [savedKey, setSavedKey] = useState('');

  // Load saved API key on component mount
  useEffect(() => {
    const storedKey = localStorage.getItem('openrouter_api_key');
    if (storedKey) {
      setSavedKey(storedKey);
      setApiKey(storedKey);
      onApiKeyChange?.(storedKey);
    }
  }, [onApiKeyChange]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openrouter_api_key', apiKey.trim());
      setSavedKey(apiKey.trim());
      onApiKeyChange?.(apiKey.trim());
      setIsOpen(false);
      toast.success('API key saved successfully!', {
        description: 'Your OpenRouter API key has been saved locally.'
      });
    }
  };

  const handleClear = () => {
    localStorage.removeItem('openrouter_api_key');
    setApiKey('');
    setSavedKey('');
    onApiKeyChange?.('');
    toast.success('API key cleared', {
      description: 'Your API key has been removed from local storage.'
    });
  };

  const handleCancel = () => {
    setApiKey(savedKey);
    setIsOpen(false);
  };

  const isKeyValid = apiKey.trim().startsWith('sk-or-v1-');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200 group"
          aria-label="API Key Settings"
          title="API Key Settings"
        >
          <Key className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            OpenRouter API Key
          </DialogTitle>
          <DialogDescription>
            Add your OpenRouter API key to enable AI features. Your key is stored locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-20 font-mono text-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {apiKey && (
                  <>
                    {isKeyValid ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            {apiKey && !isKeyValid && (
              <p className="text-sm text-red-500">
                Invalid key format. OpenRouter keys start with 'sk-or-v1-'
              </p>
            )}
            {savedKey && !apiKey && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                API key is configured
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Get your API key:</strong>{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-600"
              >
                openrouter.ai/keys
              </a>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Your key is stored locally and never sent to our servers.
            </p>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={!savedKey}
          >
            Clear Key
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!apiKey.trim() || !isKeyValid}
            >
              Save Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeySettings;
