interface Env {
  elevenlabs?: string;
}

interface TtsRequestBody {
  text?: string;
  language?: 'en' | 'hi';
}

const VOICE_BY_LANGUAGE: Record<'en' | 'hi', string> = {
  en: 'JBFqnCBsd6RMkjVDRZzb',
  hi: 'JBFqnCBsd6RMkjVDRZzb',
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const apiKey = context.env.elevenlabs;

  if (!apiKey) {
    return Response.json({ error: 'ElevenLabs API key is not configured.' }, { status: 500 });
  }

  let body: TtsRequestBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const text = body.text?.trim();
  const language = body.language === 'hi' ? 'hi' : 'en';

  if (!text) {
    return Response.json({ error: 'Missing text.' }, { status: 400 });
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_BY_LANGUAGE[language]}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs TTS failed:', response.status, errorText);
    return Response.json({ error: 'TTS generation failed.' }, { status: 502 });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  });
};

export const onRequestOptions = async () =>
  new Response(null, {
    headers: {
      Allow: 'POST, OPTIONS',
    },
  });
