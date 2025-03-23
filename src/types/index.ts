export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export type ProjectType = "html" | "react" | "python";

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  temperature: number;
  max_tokens: number;
}

export interface ChatCompletionChoice {
  message: Message;
  finish_reason: string;
  index: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  choices: ChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ElementDesign {
  html: string;
  css: string;
  javascript: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AppFile {
  name: string;
  content: string;
  type: "js" | "jsx" | "ts" | "tsx" | "css" | "html" | "json" | "md";
}

export interface AppProject {
  name: string;
  description: string;
  files: AppFile[];
  entryFile: string;
}
