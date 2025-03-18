
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GroqService } from '@/services/GroqService';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
  return (
    <div className="w-full">
      <div className="mb-1 text-xs font-medium text-muted-foreground">AI Model</div>
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
