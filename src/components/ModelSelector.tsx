
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GroqService } from '@/services/GroqService';
import { GeminiService } from '@/services/GeminiService';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [apiProvider, setApiProvider] = useState<"groq" | "gemini">("groq");
  const [isApiKeyPopoverOpen, setIsApiKeyPopoverOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customModel, setCustomModel] = useState("");

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      if (apiProvider === "groq") {
        GroqService.setApiKey(apiKey.trim());
      } else {
        GeminiService.setApiKey(apiKey.trim());
      }
      setIsApiKeyPopoverOpen(false);
    }
  };

  const handleCustomModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomModel(e.target.value);
    if (e.target.value.trim()) {
      onModelChange(e.target.value.trim());
    }
  };

  const toggleCustomMode = (checked: boolean) => {
    setCustomMode(checked);
    if (!checked && selectedModel !== customModel) {
      // Switch back to predefined model
      if (apiProvider === "groq") {
        onModelChange(GroqService.getDefaultModel());
      } else {
        onModelChange(GeminiService.getDefaultModel());
      }
    } else if (checked && customModel) {
      // Apply custom model if it exists
      onModelChange(customModel);
    }
  };

  const handleProviderChange = (provider: "groq" | "gemini") => {
    setApiProvider(provider);
    setCustomMode(false);
    onModelChange(provider === "groq" ? GroqService.getDefaultModel() : GeminiService.getDefaultModel());
  };

  // Combine models from both services
  const allModels = [
    ...GroqService.AVAILABLE_MODELS,
    ...GeminiService.AVAILABLE_MODELS
  ];

  // Filter models based on selected provider
  const availableModels = allModels.filter(model => 
    model.provider === apiProvider || (!model.provider && apiProvider === "groq")
  );

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-medium text-muted-foreground">AI Model</div>
        <Popover open={isApiKeyPopoverOpen} onOpenChange={setIsApiKeyPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
            >
              API Key
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <Tabs defaultValue="groq" onValueChange={(value) => setApiProvider(value as "groq" | "gemini")}>
                <TabsList className="w-full">
                  <TabsTrigger value="groq" className="flex-1">Groq</TabsTrigger>
                  <TabsTrigger value="gemini" className="flex-1">Gemini</TabsTrigger>
                </TabsList>
                <TabsContent value="groq">
                  <h4 className="font-medium text-sm">Groq API Key</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Enter your Groq API key to use your own account.
                  </p>
                </TabsContent>
                <TabsContent value="gemini">
                  <h4 className="font-medium text-sm">Gemini API Key</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Enter your Google Gemini API key to use your own account.
                  </p>
                </TabsContent>
              </Tabs>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder={apiProvider === "groq" ? "gsk_..." : "AIzaSy..."}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleApiKeySubmit}>Save</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Tabs defaultValue="groq" onValueChange={(value) => handleProviderChange(value as "groq" | "gemini")} className="w-full">
        <TabsList className="w-full mb-3">
          <TabsTrigger value="groq" className="flex-1">Groq</TabsTrigger>
          <TabsTrigger value="gemini" className="flex-1">Gemini</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center space-x-2 mb-2">
        <Switch
          id="custom-model-mode"
          checked={customMode}
          onCheckedChange={toggleCustomMode}
        />
        <Label htmlFor="custom-model-mode">Use custom model</Label>
      </div>

      {customMode ? (
        <Input
          placeholder={apiProvider === "groq" ? 
            "Enter custom Groq model ID (e.g., llama3-70b-8192)" : 
            "Enter custom Gemini model ID (e.g., gemini-pro)"
          }
          value={customModel}
          onChange={handleCustomModelChange}
          className="w-full"
        />
      ) : (
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-full bg-white border border-gray-200 rounded-xl h-10">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {availableModels.map(model => (
              <SelectItem 
                key={model.id} 
                value={model.id}
                className="cursor-pointer py-2.5 px-4 hover:bg-designer-light-blue transition-colors duration-200"
              >
                <div>
                  <div className="font-medium">{model.name}</div>
                  <div className="text-xs text-muted-foreground">{model.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default ModelSelector;
