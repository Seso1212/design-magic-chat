
import React, { useState, useEffect } from 'react';
import { ChatMessage, ElementDesign } from '@/types';
import { GroqService } from '@/services/GroqService';
import ModelSelector from '@/components/ModelSelector';
import ChatInterface from '@/components/ChatInterface';
import PreviewPanel from '@/components/PreviewPanel';
import CodeDisplay from '@/components/CodeDisplay';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const Index = () => {
  const [selectedModel, setSelectedModel] = useState<string>(GroqService.getDefaultModel());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [elementDesign, setElementDesign] = useState<ElementDesign>({
    html: '',
    css: '',
    javascript: ''
  });

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const addMessage = (content: string, sender: 'user' | 'assistant') => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      content,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async (message: string) => {
    addMessage(message, 'user');
    setIsLoading(true);
    
    try {
      // Check if this is the first message or a modification request
      if (elementDesign.html === '') {
        // Display a temporary message while we're generating
        addMessage("Generating your element design...", 'assistant');
        
        // Generate new element design
        const design = await GroqService.generateElementDesign(message, selectedModel);
        setElementDesign(design);
        
        // Replace the temporary message with the success message
        setMessages(prev => {
          const updated = [...prev];
          // Remove the last message (which is the temporary one)
          updated.pop();
          // Add the success message
          updated.push({
            id: uuidv4(),
            content: "I've created that element for you. You can see it in the preview panel. What would you like to change?",
            sender: 'assistant',
            timestamp: new Date()
          });
          return updated;
        });
      } else {
        // Modify existing design
        const updatedDesign = await GroqService.modifyElementDesign(
          elementDesign,
          message,
          selectedModel
        );
        setElementDesign(updatedDesign);
        
        addMessage("I've updated the element based on your request. Anything else you'd like to change?", 'assistant');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast.error(`Error: ${errorMessage}`);
      console.error("Error handling message:", error);
      
      addMessage("I'm sorry, there was an error processing your request. Please try again.", 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  // Add welcome message when component mounts
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      content: "Welcome to the AI Element Designer! Tell me what kind of element you'd like to create, and I'll help you design it. For example, you could ask for 'a glossy blue button with hover effects' or 'a responsive card with an image and description'.",
      sender: 'assistant',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  return (
    <div className="min-h-screen bg-designer-gray px-6 py-8 animate-fade-in">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8 text-center animate-slide-up">
          <h1 className="text-3xl font-bold mb-2">AI Element Design Builder</h1>
          <p className="text-muted-foreground">Create beautiful web elements with AI assistance</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="p-5 bg-white rounded-3xl shadow-sm border border-gray-100">
              <ModelSelector selectedModel={selectedModel} onModelChange={handleModelChange} />
            </div>
            
            <div className="h-[calc(100vh-20rem)]">
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading} 
              />
            </div>
          </div>
          
          <div className="lg:col-span-8 space-y-6">
            <div className="h-[calc(50vh-6rem)]">
              <PreviewPanel design={elementDesign} />
            </div>
            
            <div className="h-[calc(50vh-6rem)]">
              <CodeDisplay design={elementDesign} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
