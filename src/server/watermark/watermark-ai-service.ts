import { getGeminiClient, GEMINI_MODELS } from "@/lib/gemini/gemini-client";

export interface DetectedRegion {
  x_min: number; // 0.0 to 1.0
  y_min: number; // 0.0 to 1.0
  x_max: number; // 0.0 to 1.0
  y_max: number; // 0.0 to 1.0
  type: "text" | "logo" | "diagonal";
  confidence: number;
  page_number?: number;
}

export class WatermarkAiService {
  /**
   * Identifies watermarks in an image buffer using Gemini Multimodal.
   */
  static async detectWatermarks(imageBuffer: Buffer): Promise<DetectedRegion[]> {
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({
      model: GEMINI_MODELS.FLASH,
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `You are a document analysis system. Locate all watermarks on the provided page image. Watermarks are typically transparent, semi-transparent, faint text, overlay logos, or diagonal stamps with words like "CONFIDENTIAL", "DRAFT", "COPY", or copyright markers.
For each detected watermark, specify its bounding box normalized between 0.0 and 1.0 (where 0.0,0.0 is top-left and 1.0,1.0 is bottom-right).
Return ONLY a valid JSON object matching this schema:
{
  "regions": [
    {
      "x_min": number,
      "y_min": number,
      "x_max": number,
      "y_max": number,
      "type": "text" | "logo" | "diagonal",
      "confidence": number
    }
  ]
}
If no watermarks are found, return:
{
  "regions": []
}`;

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: "image/png"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const jsonText = response.text() || "{}";

    try {
      const parsed = JSON.parse(jsonText);
      return parsed.regions || [];
    } catch (e) {
      console.error("Failed to parse Gemini watermark response JSON:", jsonText, e);
      return [];
    }
  }
}
