
import { Message, GeminiRequest, GeminiResponse } from "@/types";
import { toast } from "sonner";

export class GeminiService {
  private static readonly API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
  private static API_KEY = "AIzaSyDn1iotas1u9qnXr_9yWT68Sskai7JiFAo";

  public static readonly AVAILABLE_MODELS = [
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      description: "Fast and efficient model for quick responses",
      maxTokens: 8192,
      provider: "gemini" as const
    },
    {
      id: "gemini-2.0-pro",
      name: "Gemini 2.0 Pro",
      description: "Advanced model for complex reasoning and generation",
      maxTokens: 32768,
      provider: "gemini" as const
    }
  ];

  public static setApiKey(key: string): void {
    this.API_KEY = key;
  }

  public static getDefaultModel(): string {
    return this.AVAILABLE_MODELS[0].id;
  }

  private static formatMessagesForGemini(messages: Message[]): GeminiContent[] {
    return messages.map(message => ({
      parts: [{ text: message.content }]
    }));
  }

  public static async generateCompletion(
    messages: Message[],
    model: string = this.getDefaultModel(),
    temperature: number = 0.7,
    maxTokens: number = 4096
  ): Promise<string> {
    const requestBody: GeminiRequest = {
      contents: this.formatMessagesForGemini(messages),
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxTokens
      }
    };

    const endpoint = `${GeminiService.API_ENDPOINT}/${model}:generateContent?key=${GeminiService.API_KEY}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error("Gemini API Error:", errorBody);
        throw new Error(`Gemini API failed with status ${response.status}: ${errorBody.error?.message || response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No candidates returned from Gemini API");
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      toast.error(`Failed to generate completion: ${error.message}`);
      throw error;
    }
  }
}
