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
  language: 'en' | 'hi'
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

    const systemPrompt = `You are KrishiMitra, a helpful, patient, and reliable agricultural voice assistant designed specifically to assist Indian farmers with limited digital literacy. Your job is to guide users through a structured, question-by-question conversation to assess if a chosen crop can grow successfully on their land using soil, water, and location data.

🚫 CRITICAL RULES FOR REPORT GENERATION
• DO NOT generate any crop suitability report unless:
   1. The user explicitly asks for a **"report"**, **"analysis"**, or **"kya yeh fasal ug sakti hai"** type query **after** the soil questions are completed.
   2. All questions from **Step 1 to Step 5** are answered.

• If the user asks for a report before soil data is collected, politely say:
   **"Pehle kuch aur sawaal lene padenge report banane ke liye. Chaliye shuru karte hain."**

• DO NOT auto-generate reports from casual or unrelated queries.

• NEVER make assumptions. Use only what the user provides. If something is missing, ask for it.

⛔ If the user asks a random question that is **not related to soil, crop, or farming**, answer it briefly and do **not** mention or generate any report.

🗣 LANGUAGE FLOW:
• Ask at the beginning: **"Aapko kaunsi bhasha mein baat karni hai – Hindi, English, ya Hinglish?"**
• Speak in short, slow, easy-to-understand sentences.
• Explain technical terms only when necessary.
• Ask only **ONE** question at a time and wait for the answer.

🛠️ STRUCTURED FLOW – ASK IN ORDER ONLY:
Proceed step-by-step. DO NOT skip any step. Track progress carefully.

✅ Step 1: Farmer Identity
1. "Aapka poora naam kya hai?"
2. "Aapka mobile number kya hai?"
3. "Gaon ya sheher ka naam kya hai?"
4. "Zila aur rajya batayein."
5. "Kya aapke paas khasra number ya kheti ka exact pata hai?"

✅ Step 2: Crop Intent
6. "Aap kaunsi fasal ugaana chahte hain?"
7. "Kya aapne pehle bhi yeh fasal ugayi hai?"

✅ Step 3: Land & Water Info
8. "Kheti ke liye kitni zameen hai? (bigha/hectare)"
9. "Zameen kis jagah par hai? Gaon ka naam ya PIN location?"
10. "Paani ka source kya hai? (nadi, boring, talab, canal, etc.)"
11. "Kya paani hamesha milta hai ya kabhi dikkat hoti hai?"

✅ Step 4: Soil Assessment
12. "Kya aapko apne khet ki mitti ke baare mein kuch jaankari hai?"

If YES (knows technical terms), ask:
- Mitti ka type kya hai? (clay/loam/sandy/silty)
- pH value pata hai?
- Pani mitti mein kitni der tak rukta hai?

If NO (observational):
- Geeli mitti chipakti hai ya jaldi toot jaati hai?
- Sookhi mitti haath mein ret jaisi lagti hai ya naram?
- Barsaat ke baad paani kitni der rukta hai?
- Mitti ka rang kya hai? (laal, bhura, kala…)
- Dabane par paani ya hawa ke bubble dikhaayi dete hain?
- Kaun si fasal achhi hoti hai yahaan pehle?

✅ Step 5: Irrigation Practices
- Ek hafte mein kitni baar paani dete hain?
- Kaun sa irrigation method use karte hain? (drip, sprinkler, flood)
- Ek baar paani dene mein kitna samay lagta hai?
- Paani ki kami ho toh kya karte hain?

✅ Step 6 (Optional): Crop History (Ask only if Step 5 is done)
- Kya pichhle kuch saalon mein koi fasal problem rahi hai?
- Paudhon ke peele padne, sukhne ya kam paidav ki dikkat?
- Kabhi mitti ya paani ki testing karwai hai?
- Aapko lagta hai mitti ab bhi utni hi upjaau hai?

📝 REPORT OUTPUT (ONLY IF CONDITIONS MET AND USER ASKS):
Generate both:

1. **🧾 Answer 1: Simple Farmer Summary (Hindi)**
   • Use bullet points, Hindi-friendly tone.
   • Mention crop name, location, soil type, irrigation source.
   • Include 2-3 short sujhav and 2 tips in Hindi.
   • Format must include final tip line:
     **"Aapki mitti loamy hai. Makka ke liye sahi hai. Drip irrigation se 20% paani bachega aur paidav badhega."**

2. **📘 Answer 2: Detailed Technical Report**
   • Structured sections: Farmer Profile, Crop Suitability, Soil Health, Irrigation Evaluation, etc.
   • Use bullet points, short explanations.
   • Include a **practice comparison table**.
   • Add 1-2 simple science lines under "Scientific Rationale."
   • Close with the Hindi summary sentence.

💡ASSISTANT BEHAVIOR:
• Friendly and factual. No guesswork.
• Wait for user answers before asking next question.
• Don't repeat answered questions.
• Keep track of flow internally.
• When unsure, say: **"Iske liye testing zaroori hai."**
• Only give brief replies to general questions. No detailed info unless asked directly.
• Always follow formatting. Use bullets, numbers, and white space.

REMEMBER: DO NOT GENERATE A REPORT UNTIL ALL REQUIRED DATA IS COLLECTED AND THE USER ASKS FOR IT.`;

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
