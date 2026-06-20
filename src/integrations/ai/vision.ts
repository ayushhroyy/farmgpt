import OpenAI from "openai";
import { ImageAnalysisResult } from "@/components/ui/image-analysis";
import { getOpenRouterApiKey, VISION_MODEL } from "@/integrations/ai/config";

export class VisionAI {
  private apiKey: string;

  constructor(apiKey: string) {
    // Allow initialization without API key - will handle missing key gracefully
    if (!apiKey) {
      console.warn('Vision AI initialized without API key. Image analysis will not work until key is provided.');
      this.apiKey = '';
    } else {
      console.log('Vision AI initialized with API key');
      this.apiKey = apiKey;
    }
  }

  async analyzeImage(imageFile: File): Promise<ImageAnalysisResult> {
    try {
      console.log("Analyzing image:", imageFile.name);
      // Convert file to base64
      const base64Image = await this.fileToBase64(imageFile);
      console.log("Image converted to base64, length:", base64Image.length);

      console.log("Sending request to Gemini vision model via OpenRouter...");
      const result = await this.analyzeWithOpenRouter(base64Image, imageFile.type);
      console.log("✅ AI model generated content");
      console.log("✅ Received response from AI");

      console.log("Raw AI Response:", result);
      console.log(
        "Image file analyzed:",
        imageFile.name,
        "Type:",
        imageFile.type,
      );

      return result;
    } catch (error) {
      console.error("Vision AI analysis failed:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
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

  private async analyzeWithOpenRouter(
    imageBase64: string,
    mimeType: string,
  ): Promise<ImageAnalysisResult> {
    if (!this.apiKey) {
      throw new Error("VITE_OPENROUTER_API_KEY is not set");
    }

    const prompt = `Analyze this image for farming/agricultural content and visible sun/solar content.

Respond with ONLY this JSON format:
{"isFarmRelated": true/false, "isSunRelated": true/false, "confidence": 0.0-1.0, "description": "what you see", "category": "farm/sun/farm_sun/other", "issues": [], "formData": {"location": null, "currentCrops": [], "soilType": null, "waterSource": null, "currentIrrigationMethod": null, "soilMoisture": null, "cropRotationPattern": null, "majorChallenges": null, "harvestSeason": null, "fertilizerType": null}}

Rules:
- Mark isFarmRelated true when the image contains crops, farm fields, soil beds, irrigation, farm equipment, livestock areas, farmers working, orchards, greenhouses, or agricultural land.
- Mark isSunRelated true only when the sun, strong direct sunlight, solar panels, shade/sun exposure, or visible solar equipment is clearly relevant.
- confidence should reflect how confident you are in the overall visual classification.
- For formData, only include values you can clearly see.`;

    const client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true,
    });

    const response = await client.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const text = response.choices[0]?.message?.content || "";
    if (!text.trim()) {
      throw new Error("Vision model returned an empty response");
    }

    let cleanedText = text.trim();

    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\s*/, "").replace(/```\s*$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\s*/, "").replace(/```\s*$/, "");
    }

    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch && !cleanedText.startsWith("{")) {
      throw new Error(`Vision model returned non-JSON response: ${cleanedText.slice(0, 200)}`);
    }

    const analysisResult = JSON.parse(jsonMatch ? jsonMatch[0] : cleanedText);

    return {
      isFarmRelated: Boolean(analysisResult.isFarmRelated),
      isSunRelated: Boolean(analysisResult.isSunRelated),
      confidence: typeof analysisResult.confidence === "number"
        ? analysisResult.confidence
        : 0.5,
      description: analysisResult.description || "Unable to generate description",
      category: analysisResult.category || "other",
      issues: Array.isArray(analysisResult.issues) ? analysisResult.issues : [],
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
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  async generateReport(analysisResult: ImageAnalysisResult): Promise<string> {
    const prompt = `Based on the following image analysis, generate a brief report for water management:

Analysis Results:
- Farm Related: ${analysisResult.isFarmRelated}
- Sun Related: ${analysisResult.isSunRelated}
- Description: ${analysisResult.description}
- Category: ${analysisResult.category}
- Issues: ${analysisResult.issues?.join(", ") || "None"}

Generate a concise report (2-3 paragraphs) about the water management implications of this image, considering farming and sun exposure factors.`;

    try {
      if (!this.apiKey) {
        throw new Error("VITE_OPENROUTER_API_KEY is not set");
      }

      const client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        dangerouslyAllowBrowser: true,
      });

      const result = await client.chat.completions.create({
        model: VISION_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      });

      return result.choices[0]?.message?.content || "Unable to generate report at this time.";
    } catch (error) {
      console.error("Report generation failed:", error);
      return "Unable to generate report at this time.";
    }
  }
}

// Initialize with API key from environment or localStorage
export const visionAI = new VisionAI(getOpenRouterApiKey());
