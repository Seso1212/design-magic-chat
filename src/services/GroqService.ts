
import { ChatCompletionRequest, ChatCompletionResponse, Message, AIModel, ProjectType } from "@/types";
import { toast } from "sonner";

export class GroqService {
  private static readonly API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
  private static readonly API_KEY = "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";
  
  public static readonly AVAILABLE_MODELS: AIModel[] = [
    {
      id: "qwen-2.5-coder-32b",
      name: "Qwen 2.5 Coder (32B)",
      description: "Specialized model for coding tasks with enhanced programming capabilities"
    },
    {
      id: "llama3-8b-8192",
      name: "Llama 3 (8B)",
      description: "Efficient and versatile model for general-purpose tasks"
    },
    {
      id: "llama3-70b-8192",
      name: "Llama 3 (70B)",
      description: "High-capacity model with strong reasoning and generation capabilities"
    },
    {
      id: "mixtral-8x7b-32768",
      name: "Mixtral (8x7B)",
      description: "Mixture of experts model with broad knowledge and long context window"
    },
    {
      id: "gemma-7b-it",
      name: "Gemma (7B)",
      description: "Lightweight model with good instruction-following abilities"
    }
  ];

  public static getDefaultModel(): string {
    return this.AVAILABLE_MODELS[0].id;
  }

  public static getModelName(modelId: string): string {
    const model = this.AVAILABLE_MODELS.find(model => model.id === modelId);
    return model ? model.name : modelId;
  }

  public static async generateCompletion(
    messages: Message[],
    model: string = this.getDefaultModel(),
    temperature: number = 0.7,
    maxTokens: number = 4096
  ): Promise<string> {
    const request: ChatCompletionRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    };

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || "Failed to generate completion";
        console.error("API Error:", errorData);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const data: ChatCompletionResponse = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Completion generation error:", error);
      toast.error(`Error: ${errorMessage}`);
      throw error;
    }
  }

  public static async generateElementDesign(
    elementDescription: string,
    model: string = this.getDefaultModel()
  ): Promise<{ html: string; css: string; javascript: string }> {
    const systemPrompt: Message = {
      role: "system",
      content: `You are an expert web developer specializing in creating beautiful, functional HTML elements. 
      When given a description of an element, you will generate the HTML, CSS, and JavaScript code needed to create it.
      
      Follow these guidelines:
      1. Create clean, semantic HTML that follows best practices
      2. Write modern CSS that is well-organized and responsive
      3. Include JavaScript functionality when appropriate
      4. Ensure all code works together seamlessly
      5. Provide well-commented code to explain your implementation
      
      Your response should be formatted with three distinct code sections:
      - HTML section (with <html>, <head>, and <body> tags if needed)
      - CSS section (all styles needed for the element)
      - JavaScript section (any interactive functionality)
      
      Make the element visually appealing and ensure it follows modern design principles.`
    };

    const userPrompt: Message = {
      role: "user",
      content: `Please design this element: ${elementDescription}`
    };

    const completion = await this.generateCompletion(
      [systemPrompt, userPrompt],
      model,
      0.7,
      4096
    );

    // Parse the response to extract HTML, CSS and JavaScript
    const htmlMatch = completion.match(/```html\s*([\s\S]*?)\s*```/);
    const cssMatch = completion.match(/```css\s*([\s\S]*?)\s*```/);
    const jsMatch = completion.match(/```(javascript|js)\s*([\s\S]*?)\s*```/);

    return {
      html: htmlMatch ? htmlMatch[1].trim() : "",
      css: cssMatch ? cssMatch[1].trim() : "",
      javascript: jsMatch ? jsMatch[2].trim() : ""
    };
  }

  public static async modifyElementDesign(
    currentDesign: { html: string; css: string; javascript: string },
    modificationRequest: string,
    model: string = this.getDefaultModel()
  ): Promise<{ html: string; css: string; javascript: string }> {
    const systemPrompt: Message = {
      role: "system",
      content: `You are an expert web developer specializing in modifying HTML elements. You will be provided with 
      existing HTML, CSS, and JavaScript code for an element, along with a request to modify it. Your task is to 
      update the code according to the request.
      
      Follow these guidelines:
      1. Preserve the overall structure and functionality unless specifically asked to change it
      2. Make precise, targeted changes based on the modification request
      3. Ensure all code remains valid and working together
      4. Comment new code sections to explain significant changes
      
      Your response should be formatted with three distinct code sections:
      - HTML section (the modified HTML code)
      - CSS section (the modified CSS code)
      - JavaScript section (the modified JavaScript code)
      
      Always provide the complete updated code for all three sections, even if some remain unchanged.`
    };

    const userPrompt: Message = {
      role: "user",
      content: `Here is the current code for my element:
      
      HTML:
      \`\`\`html
      ${currentDesign.html}
      \`\`\`
      
      CSS:
      \`\`\`css
      ${currentDesign.css}
      \`\`\`
      
      JavaScript:
      \`\`\`javascript
      ${currentDesign.javascript}
      \`\`\`
      
      Please modify the element as follows: ${modificationRequest}`
    };

    const completion = await this.generateCompletion(
      [systemPrompt, userPrompt],
      model,
      0.7,
      4096
    );

    // Parse the response to extract HTML, CSS and JavaScript
    const htmlMatch = completion.match(/```html\s*([\s\S]*?)\s*```/);
    const cssMatch = completion.match(/```css\s*([\s\S]*?)\s*```/);
    const jsMatch = completion.match(/```(javascript|js)\s*([\s\S]*?)\s*```/);

    return {
      html: htmlMatch ? htmlMatch[1].trim() : currentDesign.html,
      css: cssMatch ? cssMatch[1].trim() : currentDesign.css,
      javascript: jsMatch ? (jsMatch[2] || jsMatch[1]).trim() : currentDesign.javascript
    };
  }
}
