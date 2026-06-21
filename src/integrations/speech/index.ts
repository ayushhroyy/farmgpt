/**
 * Speech services for text-to-speech and speech recognition.
 */

import { transcribeAudioWithWebSpeech, SpeechRecognitionResult } from './speech-recognition';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language_code?: string;
  error?: string;
}

let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;

export function stopTTS() {
  window.speechSynthesis?.cancel();

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeAttribute('src');
    currentAudio.load();
    currentAudio = null;
  }

  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
}

async function playElevenLabsTTS(text: string, language: 'en' | 'hi'): Promise<void> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, language }),
  });

  if (!response.ok) {
    throw new Error(`TTS request failed with ${response.status}`);
  }

  const audioBlob = await response.blob();
  const audio = new Audio();
  currentAudioUrl = URL.createObjectURL(audioBlob);
  currentAudio = audio;
  audio.src = currentAudioUrl;

  await new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      stopTTS();
      resolve();
    };
    audio.onerror = () => {
      stopTTS();
      reject(new Error('Audio playback failed'));
    };
    audio.play().catch((error) => {
      stopTTS();
      reject(error);
    });
  });
}

/**
 * Play text using ElevenLabs, falling back to browser speech synthesis.
 * @param text Text to speak
 * @param language Language code ('en' or 'hi')
 */
export async function playTTS(text: string, language: 'en' | 'hi' = 'en'): Promise<void> {
  stopTTS();

  try {
    await playElevenLabsTTS(text, language);
    return;
  } catch (error) {
    console.warn('ElevenLabs TTS failed, falling back to browser speech synthesis:', error);
  }

  return new Promise((resolve, reject) => {
    try {
      const langCode = language === 'hi' ? 'hi' : 'en';

      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const languageVoices = voices.filter(voice => 
          voice.lang.startsWith(langCode === 'hi' ? 'hi' : 'en')
        );

        if (languageVoices.length > 0) {
          utterance.voice = languageVoices[0];
          utterance.lang = languageVoices[0].lang;
        } else {
          utterance.lang = langCode === 'hi' ? 'hi-IN' : 'en-US';
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => resolve();
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          reject(event);
        };

        window.speechSynthesis.speak(utterance);
        return;
      }

      reject(new Error('Speech synthesis not available'));
    } catch (error) {
      console.error('Error in TTS playback:', error);
      reject(error);
    }
  });
}

/**
 * Transcribe audio blob using Web Speech API
 * This is a simplified implementation that works directly with the audio blob
 * @param audioBlob Audio blob from recording
 * @param language Language code ('en' or 'hi')
 */
export async function transcribeAudio(
  audioBlob: Blob,
  language: 'en' | 'hi' = 'en'
): Promise<TranscriptionResult> {
  try {
    // Use our standardized WebSpeech implementation
    const result = await transcribeAudioWithWebSpeech(audioBlob, language);
    
    return {
      text: result.text,
      confidence: result.confidence,
      language_code: language === 'hi' ? 'hi-IN' : 'en-US',
      error: result.error
    };
    
  } catch (error) {
    console.error("Speech recognition failed:", error);
    
    // Return empty result on failure
    return {
      text: "",
      confidence: 0,
      language_code: language === 'hi' ? 'hi-IN' : 'en-US'
    };
  }
}

// Replace simplified Speech to Text with our standardized implementation
// This will be kept for backward compatibility
// but will now delegate to the new standardized version
async function simplifiedSpeechToText(audioBlob: Blob, language: 'en' | 'hi'): Promise<TranscriptionResult> {
  try {
    const result = await transcribeAudioWithWebSpeech(audioBlob, language);
    
    return {
      text: result.text,
      confidence: result.confidence,
      language_code: language === 'hi' ? 'hi-IN' : 'en-US',
      error: result.error
    };
  } catch (error) {
    console.error("Error in simplified speech to text:", error);
    return {
      text: "",
      confidence: 0,
      language_code: language === 'hi' ? 'hi-IN' : 'en-US'
    };
  }
}

/**
 * Convert Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Direct transcription method for development and testing
 * This simulates Google Translation by using fixed common phrases
 */
export function simulateTranscription(audioBlob: Blob, language: 'en' | 'hi'): Promise<TranscriptionResult> {
  return new Promise((resolve) => {
    // For development purposes, return a fake transcription
    // In production, this would be replaced with actual Google API calls
    
    setTimeout(() => {
      // Randomly select a farming-related phrase based on language
      const enPhrases = [
        "What crops are good for water conservation?",
        "How much water does rice need?",
        "When should I plant wheat?",
        "Tell me about drip irrigation",
        "How to prevent pest attacks on my farm?",
        "What fertilizer should I use for tomatoes?"
      ];
      
      const hiPhrases = [
        "पानी संरक्षण के लिए कौन सी फसलें अच्छी हैं?",
        "चावल को कितने पानी की आवश्यकता होती है?",
        "मुझे गेहूं कब लगाना चाहिए?",
        "ड्रिप सिंचाई के बारे में बताएं",
        "अपने खेत पर कीट हमलों को कैसे रोकें?",
        "टमाटर के लिए कौन सा उर्वरक इस्तेमाल करना चाहिए?"
      ];
      
      const phrases = language === 'hi' ? hiPhrases : enPhrases;
      const randomIndex = Math.floor(Math.random() * phrases.length);
      
      resolve({
        text: phrases[randomIndex],
        confidence: 0.8,
        language_code: language === 'hi' ? 'hi-IN' : 'en-US'
      });
    }, 1500); // Simulate API delay
  });
}

/**
 * Detect language of speech (placeholder function)
 * In a real implementation, you would use Google's language detection API
 */
export async function detectSpeechLanguage(audioBlob: Blob): Promise<'en' | 'hi' | null> {
  // For simplicity, we'll just return the default language
  // In a real app, you would use Google's language detection API
  return 'en';
} 
