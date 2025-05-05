
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GroqService } from '@/services/GroqService';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [isApiKeyPopoverOpen, setIsApiKeyPopoverOpen] = useState(false);

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      GroqService.setApiKey(apiKey.trim());
      setIsApiKeyPopoverOpen(false);
    }
  };

  return (
    <div className="w-full">
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
              <h4 className="font-medium text-sm">Groq API Key</h4>
              <p className="text-xs text-muted-foreground">
                Enter your Groq API key to use your own account.
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="gsk_..."
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
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="w-full bg-white border border-gray-200 rounded-xl h-10">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {GroqService.AVAILABLE_MODELS.map(model => (
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
    </div>
  );
};

export default ModelSelector;
