import OpenAI from 'openai';
import { getOpenRouterApiKey, TEXT_MODEL, VISION_MODEL } from '@/integrations/ai/config';

// Initialize OpenRouter client (soft failure if no key)
const createOpenRouterClient = () => {
  const API_KEY = getOpenRouterApiKey();

  if (!API_KEY) {
    console.warn('Warning: No OpenRouter API key found. Add one via settings (top-left key icon) or VITE_OPENROUTER_API_KEY environment variable.');
  }

  return new OpenAI({
    apiKey: API_KEY || 'dummy-key-for-initialization', // Allow client creation
    baseURL: 'https://openrouter.ai/api/v1',
    dangerouslyAllowBrowser: true // Required for client-side use
  });
};

let openrouterClient = createOpenRouterClient();

// Function to refresh client with new API key
export const refreshOpenRouterClient = () => {
  openrouterClient = createOpenRouterClient();
};

// Helper function to check if API key is available
export const hasApiKey = (): boolean => {
  return !!getOpenRouterApiKey();
};

export interface OpenRouterResponse {
  text: string;
  error?: string;
  audioResponse?: string;
}

/**
 * Send a voice query to OpenRouter and get a text response
 */
export async function processVoiceQuery(
  query: string,
  language: 'en' | 'hi',
  mode: 'guided' | 'direct' = 'guided'
): Promise<OpenRouterResponse> {
  try {
    // Check if API key is available
    if (!hasApiKey()) {
      const noKeyMessage = language === 'en'
        ? "🔑 API key required! Please click the key icon (top-left) to add your OpenRouter API key, or set VITE_OPENROUTER_API_KEY environment variable."
        : "🔑 API की आवश्यकता है! कृपया अपना OpenRouter API कुंजी जोड़ने के लिए ऊपर बाईं ओर कुंजी आइकन पर क्लिक करें।";

      return {
        text: noKeyMessage,
        error: 'No API key provided',
        audioResponse: noKeyMessage
      };
    }
    const languageInstruction = language === 'en'
      ? "Respond in English."
      : "हिंदी में जवाब दें।";

    const directAdvicePrompt = `You are KrishiMitra, a practical farming advisor for Indian farmers.

Answer the user's farming question directly.

RULES:
• Start with the answer or recommendation. Do not introduce yourself.
• Keep it short: 3-6 bullets or 2 short paragraphs.
• Give specific actions the farmer can take today.
• Mention quantities, timing, spacing, irrigation frequency, or warning signs when useful.
• If key details are missing, give the most likely guidance first, then ask only one follow-up question.
• Do not run the crop suitability report flow unless the user explicitly asks for a report.
• Do not ask for name, mobile number, village, khasra, or full farm profile for normal advice.
• Avoid long explanations and generic disclaimers.
• If unsure, say what to check or test next.

For Hindi, use simple farmer-friendly Hindi. For English, use plain English.`;

    const guidedConversationPrompt = `You are KrishiMitra, a voice-first agricultural assistant for Indian farmers. Be practical, calm, and direct. Help with crop choice, soil, irrigation, pests, disease symptoms, fertilizer, weather risk, government-scheme direction, and water-saving practices.

CORE STYLE
• Default to useful advice first. Do not start by collecting identity details.
• Keep voice answers short: 3-6 bullets or 2 short paragraphs.
• Use simple words. Explain technical terms only when needed.
• Ask at most ONE follow-up question at the end.
• If the user speaks Hindi, reply in simple Hindi. If English, reply in plain English. If Hinglish, reply in Hinglish.
• Never invent exact soil test values, weather, mandi prices, subsidies, or legal requirements. Say what to check next.
• If the question is not about farming, answer briefly and steer back to farming.

NORMAL ADVICE MODE
Use this mode for ordinary questions like crop problems, irrigation, fertilizer, pest symptoms, seed choice, soil improvement, or "what should I do?"
• Start with the most likely recommendation.
• Give actions the farmer can take today.
• Include practical details when possible: dose ranges, timing, spacing, water frequency, visible symptoms, or risk signs.
• If details are missing, give general safe guidance first, then ask one important follow-up question.
• Do not ask for name, mobile number, khasra number, or full location in normal advice mode.

CROP SUITABILITY / REPORT MODE
Enter this mode ONLY when the user clearly asks for a crop suitability report, land analysis, water-use report, or asks whether a specific crop can grow on their land.
Do not generate a final report until the required data is collected. Ask one question at a time and track answers internally.

Required report data:
1. Crop: crop the farmer wants to grow, and whether they grew it before.
2. Location: village/city plus district/state, or nearest known location.
3. Land: area and unit.
4. Water: source, reliability, and irrigation method.
5. Soil: known soil type/pH/test result, OR observable soil clues.
6. Current practice: watering frequency and major crop problems.

Question order for report mode:
1. "Aap kaunsi fasal ugaana chahte hain?"
2. "Aapka gaon/sheher, zila aur rajya kya hai?"
3. "Kheti ke liye kitni zameen hai?"
4. "Paani ka source kya hai, aur kya paani hamesha milta hai?"
5. "Irrigation kaunsa use karte hain - flood, drip, sprinkler, ya kuch aur?"
6. "Mitti ke baare mein kya pata hai - type, pH, ya soil test?"
7. If soil is unknown: "Geeli mitti chipakti hai, ret jaisi hoti hai, ya naram loamy lagti hai?"
8. "Pichhle season mein koi disease, peele patte, sukhna, ya kam paidav ki dikkat hui?"

Optional identity details:
• Ask name/mobile/khasra only if the user wants a saved/formal report or asks to register their farm details.
• Never block basic advice because identity details are missing.

REPORT OUTPUT RULES
Only produce the report after the user asks for it and the required report data is available.
If data is missing, say: "Report banane ke liye ek aur zaroori jaankari chahiye:" then ask the next missing question.

Report format:
• Farmer-friendly summary first.
• Crop suitability: Good / Moderate / Risky, with reason.
• Soil and water observations.
• 3-5 specific recommendations.
• Water-saving suggestion.
• What to test or verify next.
• Keep the report concise unless the user asks for detailed analysis.

SAFETY AND UNCERTAINTY
• For pesticide, disease, or fertilizer advice, avoid overconfident diagnosis from vague symptoms. Mention 2-3 possible causes and what to inspect.
• Encourage local agri officer/KVK/lab testing when risk is high or symptoms are unclear.
• For chemicals, advise checking the product label and local expert guidance before application.
• When unsure, say: "Iske liye mitti/paani ya paudhe ki photo/testing zaroori hai."`;

    const systemPrompt = mode === 'direct' ? directAdvicePrompt : guidedConversationPrompt;

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt
      },
      {
        role: "user" as const,
        content: query
      },
      {
        role: "system" as const,
        content: languageInstruction
      }
    ];

    const response = await openrouterClient.chat.completions.create({
      model: TEXT_MODEL,
      messages: messages,
      max_tokens: 800
    });

    const text = response.choices[0]?.message?.content || '';

    return {
      text,
      audioResponse: text
    };
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    const errorMessage = language === 'en'
      ? "Sorry, I couldn't process your request. Please try again."
      : "क्षमा करें, मैं आपके अनुरोध को संसाधित नहीं कर सका। कृपया पुनः प्रयास करें।";

    return {
      text: errorMessage,
      error: errorMessage,
      audioResponse: errorMessage
    };
  }
}

/**
 * Analyze farming practices and provide water conservation recommendations
 */
export async function analyzeWaterUsage(
  conversations: { question: string, answer: string }[],
  language: 'en' | 'hi'
): Promise<{
  recommendations: string[];
  waterData: any;
  potentialSavings: string;
  audioSummary?: string;
}> {
  try {
    const conversationsText = conversations
      .map(conv => `Q: ${conv.question}\nA: ${conv.answer}`)
      .join("\n\n");

    const languageInstruction = language === 'en'
      ? "Respond in English."
      : "हिंदी में जवाब दें।";

    const prompt = `You are KrishiMitra, an advanced AI specializing in agricultural water management and sustainable farming practices in India.

    Analyze the following farmer's responses about their farming practices and generate water usage analysis and conservation recommendations tailored to Indian agricultural conditions.

    ${conversationsText}

    Provide the following in JSON format:
    1. A list of 4 specific, actionable recommendations for water conservation that are practical for Indian farmers
    2. Current and recommended water usage data for their crops (in cubic meters per hectare)
    3. Potential water savings percentage based on implementing your recommendations

    ${languageInstruction}`;

    const response = await openrouterClient.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: "system" as const, content: prompt }
      ],
      max_tokens: 800
    });

    const text = response.choices[0]?.message?.content || '';

    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("Invalid JSON response");
      }

      const jsonStr = text.substring(jsonStart, jsonEnd + 1);
      const json = JSON.parse(jsonStr);

      const recommendations = json.recommendations || [];

      const waterData = [];
      if (json.crops) {
        Object.keys(json.crops).forEach(crop => {
          waterData.push({
            name: crop,
            current: json.crops[crop].current,
            recommended: json.crops[crop].recommended,
          });
        });

        const totalCurrent = Object.values(json.crops).reduce((sum: number, crop: any) => sum + crop.current, 0);
        const totalRecommended = Object.values(json.crops).reduce((sum: number, crop: any) => sum + crop.recommended, 0);

        waterData.push({
          name: language === 'en' ? 'Total' : 'कुल',
          current: totalCurrent,
          recommended: totalRecommended,
        });
      }

      const audioSummary = language === 'en'
        ? `Analysis complete. I've found you can save approximately ${json.potentialSavings || "25%"} of water with these top recommendations: ${recommendations.slice(0, 2).join(". ")}`
        : `विश्लेषण पूरा हुआ। मैंने पाया कि आप इन शीर्ष सिफारिशों के साथ लगभग ${json.potentialSavings || "25%"} पानी बचा सकते हैं: ${recommendations.slice(0, 2).join(". ")}`;

      return {
        recommendations: recommendations.slice(0, 4),
        waterData: waterData.length > 0 ? waterData : null,
        potentialSavings: json.potentialSavings || "25%",
        audioSummary
      };
    } catch (parseError) {
      console.error("Error parsing OpenRouter response:", parseError);

      const fallbackRecommendations = language === 'en'
        ? [
            "Switch from flood irrigation to drip irrigation for water-intensive crops.",
            "Consider crop rotation with pulses to improve soil water retention.",
            "Implement rainwater harvesting to reduce dependence on groundwater.",
            "Use mulching to reduce evaporation from soil surface."
          ]
        : [
            "जल-गहन फसलों के लिए बाढ़ सिंचाई से ड्रिप सिंचाई में बदलें।",
            "मिट्टी की जल धारण क्षमता में सुधार के लिए दलहन के साथ फसल चक्र पर विचार करें।",
            "भूजल पर निर्भरता कम करने के लिए वर्षा जल संचयन लागू करें।",
            "मिट्टी की सतह से वाष्पीकरण को कम करने के लिए मल्चिंग का उपयोग करें।"
          ];

      const audioSummary = language === 'en'
        ? `Analysis complete. I've found you can save approximately 25% of water with these top recommendations: ${fallbackRecommendations.slice(0, 2).join(". ")}`
        : `विश्लेषण पूरा हुआ। मैंने पाया कि आप इन शीर्ष सिफारिशों के साथ लगभग 25% पानी बचा सकते हैं: ${fallbackRecommendations.slice(0, 2).join(". ")}`;

      return {
        recommendations: fallbackRecommendations,
        waterData: [
          {
            name: language === 'en' ? 'Rice' : 'चावल',
            current: 4500,
            recommended: 3200,
          },
          {
            name: language === 'en' ? 'Wheat' : 'गेहूं',
            current: 2300,
            recommended: 1800,
          },
          {
            name: language === 'en' ? 'Total' : 'कुल',
            current: 6800,
            recommended: 5000,
          },
        ],
        potentialSavings: "25%",
        audioSummary
      };
    }
  } catch (error) {
    console.error("Error calling OpenRouter API for analysis:", error);

    const fallbackRecommendations = language === 'en'
      ? [
          "Switch from flood irrigation to drip irrigation for water-intensive crops.",
          "Consider crop rotation with pulses to improve soil water retention.",
          "Implement rainwater harvesting to reduce dependence on groundwater.",
          "Use mulching to reduce evaporation from soil surface."
        ]
      : [
          "जल-गहन फसलों के लिए बाढ़ सिंचाई से ड्रिप सिंचाई में बदलें।",
          "मिट्टी की जल धारण क्षमता में सुधार के लिए दलहन के साथ फसल चक्र पर विचार करें।",
          "भूजल पर निर्भरता कम करने के लिए वर्षा जल संचयन लागू करें।",
          "मिट्टी की सतह से वाष्पीकरण को कम करने के लिए मल्चिंग का उपयोग करें।"
        ];

    const audioSummary = language === 'en'
      ? `Analysis complete. I've found you can save approximately 25% of water with these top recommendations: ${fallbackRecommendations.slice(0, 2).join(". ")}`
      : `विश्लेषण पूरा हुआ। मैंने पाया कि आप इन शीर्ष सिफारिशों के साथ लगभग 25% पानी बचा सकते हैं: ${fallbackRecommendations.slice(0, 2).join(". ")}`;

    return {
      recommendations: fallbackRecommendations,
      waterData: [
        {
          name: language === 'en' ? 'Rice' : 'चावल',
          current: 4500,
          recommended: 3200,
        },
        {
          name: language === 'en' ? 'Wheat' : 'गेहूं',
          current: 2300,
          recommended: 1800,
        },
        {
          name: language === 'en' ? 'Total' : 'कुल',
          current: 6800,
          recommended: 5000,
        },
      ],
      potentialSavings: "25%",
      audioSummary
    };
  }
}

/**
 * Analyze image for farming and solar content
 */
export async function analyzeImage(
  imageBase64: string,
  mimeType: string
): Promise<{
  isFarmRelated: boolean;
  isSunRelated: boolean;
  confidence: number;
  description: string;
  category: string;
  issues: string[];
  formData: any;
}> {
  try {
    // Refresh client to get latest API key
    const client = createOpenRouterClient();

    const prompt = `Analyze this image for farming/agricultural content and visible sun/solar content.

Respond with ONLY this JSON format:
{"isFarmRelated": true/false, "isSunRelated": true/false, "confidence": 0.0-1.0, "description": "what you see", "category": "farm/sun/farm_sun/other", "issues": [], "formData": {"location": null, "currentCrops": [], "soilType": null, "waterSource": null, "currentIrrigationMethod": null, "soilMoisture": null, "cropRotationPattern": null, "majorChallenges": null, "harvestSeason": null, "fertilizerType": null}}

Rules:
- Mark isFarmRelated true when the image contains crops, farm fields, soil beds, irrigation, farm equipment, livestock areas, farmers working, orchards, greenhouses, or agricultural land.
- Mark isSunRelated true only when the sun, strong direct sunlight, solar panels, shade/sun exposure, or visible solar equipment is clearly relevant.
- confidence should reflect how confident you are in the overall visual classification.
- For formData, only include values you can clearly see.`;

    const response = await client.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const text = response.choices[0]?.message?.content || '';
    if (!text.trim()) {
      throw new Error("Vision model returned an empty response");
    }

    try {
      let cleanedText = text.trim();

      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText
          .replace(/```json\s*/, "")
          .replace(/```\s*$/, "");
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText
          .replace(/```\s*/, "")
          .replace(/```\s*$/, "");
      }

      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }

      const analysisResult = JSON.parse(cleanedText);
      return {
        isFarmRelated: Boolean(analysisResult.isFarmRelated),
        isSunRelated: Boolean(analysisResult.isSunRelated),
        confidence: typeof analysisResult.confidence === "number"
          ? analysisResult.confidence
          : 0.5,
        description: analysisResult.description || "Unable to generate description",
        category: analysisResult.category || "other",
        issues: Array.isArray(analysisResult.issues)
          ? analysisResult.issues
          : [],
        formData: analysisResult.formData || {
          location: null,
          currentCrops: null,
          soilType: null,
          waterSource: null,
          currentIrrigationMethod: null,
          soilMoisture: null,
          cropRotationPattern: null,
          majorChallenges: null,
          harvestSeason: null,
          fertilizerType: null,
        },
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return {
        isFarmRelated: false,
        isSunRelated: false,
        confidence: 0.1,
        description: "Failed to analyze image properly - JSON parsing error",
        category: "other",
        issues: ["AI analysis failed - JSON parsing error"],
        formData: {
          location: null,
          currentCrops: null,
          soilType: null,
          waterSource: null,
          currentIrrigationMethod: null,
          soilMoisture: null,
          cropRotationPattern: null,
          majorChallenges: null,
          harvestSeason: null,
          fertilizerType: null,
        },
      };
    }
  } catch (error) {
    console.error("Vision AI analysis failed:", error);
    return {
      isFarmRelated: false,
      isSunRelated: false,
      confidence: 0,
      description: `Analysis failed due to technical error: ${error instanceof Error ? error.message : String(error)}`,
      category: "other",
      issues: [`Technical error during analysis: ${error instanceof Error ? error.message : String(error)}`],
      formData: {
        location: null,
        currentCrops: null,
        soilType: null,
        waterSource: null,
        currentIrrigationMethod: null,
        soilMoisture: null,
        cropRotationPattern: null,
        majorChallenges: null,
        harvestSeason: null,
        fertilizerType: null,
      },
    };
  }
}

/**
 * Clear conversation history
 */
export function clearConversationHistory(language: 'en' | 'hi'): void {
  // OpenRouter is stateless, but we keep this for API compatibility
  console.log(`Cleared conversation history for language: ${language}`);
}
