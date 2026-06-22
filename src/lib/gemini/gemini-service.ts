import { getGeminiClient, GEMINI_MODELS } from "./gemini-client";

export interface GeminiResponse {
  text: string;
  tokensInput: number;
  tokensOutput: number;
}

export class GeminiService {
  /**
   * General text generation helper.
   */
  static async generateText(prompt: string, systemInstruction?: string): Promise<GeminiResponse> {
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({
      model: GEMINI_MODELS.FLASH,
      systemInstruction: systemInstruction ? { role: "system", parts: [{ text: systemInstruction }] } : undefined
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text() || "";

    // Extract token usage
    const tokensInput = response.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
    const tokensOutput = response.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);

    return {
      text,
      tokensInput,
      tokensOutput
    };
  }

  /**
   * JSON structured content generation helper.
   */
  static async generateJson(prompt: string, systemInstruction?: string): Promise<GeminiResponse> {
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({
      model: GEMINI_MODELS.FLASH,
      systemInstruction: systemInstruction ? { role: "system", parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text() || "";

    const tokensInput = response.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
    const tokensOutput = response.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);

    return {
      text,
      tokensInput,
      tokensOutput
    };
  }

  /**
   * Yield chunks of text in real-time.
   */
  static async *streamResponse(prompt: string, systemInstruction?: string): AsyncGenerator<{ text: string; tokensInput?: number; tokensOutput?: number }> {
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({
      model: GEMINI_MODELS.FLASH,
      systemInstruction: systemInstruction ? { role: "system", parts: [{ text: systemInstruction }] } : undefined
    });

    const result = await model.generateContentStream(prompt);
    
    let accumulatedText = "";
    for await (const chunk of result.stream) {
      const text = chunk.text();
      accumulatedText += text;
      yield { text };
    }

    // Call response getter at the end to get full metadata if available
    try {
      const response = await result.response;
      const tokensInput = response.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
      const tokensOutput = response.usageMetadata?.candidatesTokenCount || Math.ceil(accumulatedText.length / 4);
      
      yield { text: "", tokensInput, tokensOutput };
    } catch {
      // Return basic estimates if response metadata getter throws (happens in streaming edge cases)
      yield {
        text: "",
        tokensInput: Math.ceil(prompt.length / 4),
        tokensOutput: Math.ceil(accumulatedText.length / 4)
      };
    }
  }

  // Feature specific methods delegated to generateText or generateJson
  
  static async chatWithPdf(prompt: string, systemInstruction: string): Promise<GeminiResponse> {
    return this.generateText(prompt, systemInstruction);
  }

  static async summarize(prompt: string): Promise<GeminiResponse> {
    return this.generateText(prompt);
  }

  static async generateNotes(prompt: string): Promise<GeminiResponse> {
    return this.generateText(prompt);
  }

  static async generateFlashcards(prompt: string): Promise<GeminiResponse> {
    return this.generateJson(prompt);
  }

  static async generateQuiz(prompt: string): Promise<GeminiResponse> {
    return this.generateJson(prompt);
  }
}
