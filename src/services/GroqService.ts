import { ChatCompletionRequest, ChatCompletionResponse, Message, AIModel, ProjectType, ElementDesign } from "@/types";
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
    const requestBody: ChatCompletionRequest = {
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
    };

    try {
      const response = await fetch(GroqService.API_ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GroqService.API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error("Groq API Error:", errorBody);
        throw new Error(`Groq API failed with status ${response.status}: ${errorBody.error?.message || response.statusText}`);
      }

      const data: ChatCompletionResponse = await response.json();
      if (!data.choices || data.choices.length === 0) {
        throw new Error("No choices returned from Groq API");
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling Groq API:", error);
      toast.error(`Failed to generate completion: ${error.message}`);
      throw error;
    }
  }

  public static async generateProjectStructure(
    description: string, 
    projectType: ProjectType = "html", 
    model: string = this.getDefaultModel()
  ): Promise<string> {
    const systemPrompt: Message = {
      role: "system",
      content: `You are an expert software architect. Given a description of a project, generate a detailed file and folder structure.
      Specify the names of all files and folders that should be created, and provide a brief description of the purpose of each file.
      The project type is ${projectType}.
      
      Example format:
      project-name/
      ├── folder1/
      │   ├── file1.txt: Description of file1
      │   └── file2.txt: Description of file2
      ├── file3.txt: Description of file3
      └── README.md: General project description and setup instructions`
    };

    const userPrompt: Message = {
      role: "user",
      content: `Create a project structure for: ${description}`
    };

    try {
      return await this.generateCompletion(
        [systemPrompt, userPrompt],
        model,
        0.7,
        4096
      );
    } catch (error) {
      console.error("Failed to generate project structure:", error);
      throw error;
    }
  }

  public static async generateElementDesign(
    description: string,
    model: string = this.getDefaultModel()
  ): Promise<ElementDesign> {
    const systemPrompt: Message = {
      role: "system",
      content: `You are an expert web designer and developer specializing in creating beautiful UI elements.
      
      Given a description of a UI element, generate the HTML, CSS, and optionally JavaScript code to create it.
      
      Follow these guidelines:
      1. Create clean, semantic HTML
      2. Write modern CSS with appropriate styling
      3. Add JavaScript only if needed for interactions
      4. Ensure the element is responsive and accessible
      5. Use best practices for web development
      6. DO NOT use external libraries or frameworks
      7. Return ONLY the HTML, CSS, and JavaScript code
      
      Format your response as JSON with three fields: html, css, and javascript.
      Example format:
      {
        "html": "<div class=\\"my-element\\">Content</div>",
        "css": ".my-element { color: blue; }",
        "javascript": "document.querySelector('.my-element').addEventListener('click', () => { console.log('clicked') });"
      }
      
      Keep your response focused ONLY on creating this single UI element. Do not include explanations or any text outside of the JSON structure.`
    };

    const userPrompt: Message = {
      role: "user",
      content: `Create this UI element: ${description}`
    };

    try {
      const jsonResponse = await this.generateCompletion(
        [systemPrompt, userPrompt],
        model,
        0.7,
        4096
      );

      // Parse the JSON response
      try {
        // Clean up the response to handle potential markdown formatting
        let cleanResponse = jsonResponse.trim();
        
        // If response contains markdown code blocks, extract just the JSON
        if (cleanResponse.includes('```json')) {
          const match = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
          if (match && match[1]) {
            cleanResponse = match[1].trim();
          }
        } else if (cleanResponse.includes('```')) {
          const match = cleanResponse.match(/```\s*([\s\S]*?)\s*```/);
          if (match && match[1]) {
            cleanResponse = match[1].trim();
          }
        }
        
        // Look for JSON object if surrounded by other text
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : cleanResponse;
        
        const parsedDesign = JSON.parse(jsonString);
        
        // Ensure all three fields exist, defaulting to empty strings if missing
        return {
          html: parsedDesign.html || '',
          css: parsedDesign.css || '',
          javascript: parsedDesign.javascript || ''
        };
      } catch (error) {
        console.error("Failed to parse element design JSON:", error);
        toast.error("Failed to parse the AI response. Please try again.");
        return { html: '', css: '', javascript: '' };
      }
    } catch (error) {
      console.error("Failed to generate element design:", error);
      throw error;
    }
  }

  public static async modifyElementDesign(
    currentDesign: ElementDesign,
    modification: string,
    model: string = this.getDefaultModel()
  ): Promise<ElementDesign> {
    const systemPrompt: Message = {
      role: "system",
      content: `You are an expert web designer and developer specializing in modifying UI elements.
      
      You will be given the current HTML, CSS, and JavaScript code for an element, along with a request to modify it.
      Make the requested changes while preserving the overall structure and functionality unless explicitly asked to change it.
      
      Follow these guidelines:
      1. Preserve existing class names and IDs when possible
      2. Make minimal changes to achieve the requested modification
      3. Ensure the element remains responsive and accessible
      4. Format your response as JSON with three fields: html, css, and javascript
      5. Return the complete code after modifications, not just the changes
      
      Example format:
      {
        "html": "<div class=\\"my-element\\">Modified Content</div>",
        "css": ".my-element { color: red; }",
        "javascript": "document.querySelector('.my-element').addEventListener('click', () => { console.log('modified') });"
      }
      
      Keep your response focused ONLY on the modified UI element. Do not include explanations or any text outside of the JSON structure.`
    };

    const userPrompt: Message = {
      role: "user",
      content: `Here is the current code for the UI element:

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

Modification request: ${modification}

Please provide the updated code for this element.`
    };

    try {
      const jsonResponse = await this.generateCompletion(
        [systemPrompt, userPrompt],
        model,
        0.7,
        4096
      );

      // Parse the JSON response (similar to generateElementDesign)
      try {
        // Clean up the response to handle potential markdown formatting
        let cleanResponse = jsonResponse.trim();
        
        // If response contains markdown code blocks, extract just the JSON
        if (cleanResponse.includes('```json')) {
          const match = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
          if (match && match[1]) {
            cleanResponse = match[1].trim();
          }
        } else if (cleanResponse.includes('```')) {
          const match = cleanResponse.match(/```\s*([\s\S]*?)\s*```/);
          if (match && match[1]) {
            cleanResponse = match[1].trim();
          }
        }
        
        // Look for JSON object if surrounded by other text
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : cleanResponse;
        
        const parsedDesign = JSON.parse(jsonString);
        
        // Merge with current design, only replacing fields that were provided
        return {
          html: parsedDesign.html || currentDesign.html,
          css: parsedDesign.css || currentDesign.css,
          javascript: parsedDesign.javascript || currentDesign.javascript
        };
      } catch (error) {
        console.error("Failed to parse modified element design JSON:", error);
        toast.error("Failed to parse the AI response. Please try again.");
        return currentDesign; // Return the unchanged design if we can't parse the update
      }
    } catch (error) {
      console.error("Failed to modify element design:", error);
      throw error;
    }
  }
}
