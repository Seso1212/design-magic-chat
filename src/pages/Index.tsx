import React, { useState, useEffect } from 'react';
import { ChatMessage, ElementDesign } from '@/types';
import { GroqService } from '@/services/GroqService';
import ModelSelector from '@/components/ModelSelector';
import ChatInterface from '@/components/ChatInterface';
import PreviewPanel from '@/components/PreviewPanel';
import CodeDisplay from '@/components/CodeDisplay';
import ChatFeature from '@/components/ChatFeature';
import ChatAccess from '@/components/ChatAccess';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { MessageCircle, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CHAT_HISTORY_KEY = 'element_designer_chat_history';
const DESIGN_HISTORY_KEY = 'element_designer_design_history';
const CONTEXT_HISTORY_LENGTH = 5;

const Index = () => {
  const [selectedModel, setSelectedModel] = useState<string>(GroqService.getDefaultModel());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [elementDesign, setElementDesign] = useState<ElementDesign>({
    html: '',
    css: '',
    javascript: ''
  });
  const [activeTab, setActiveTab] = useState<'designer' | 'chat'>('designer');

  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      const savedDesign = localStorage.getItem(DESIGN_HISTORY_KEY);
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } else {
        const welcomeMessage: ChatMessage = {
          id: uuidv4(),
          content: "Welcome to the AI Element Designer! Tell me what kind of element you'd like to create, and I'll help you design it. For example, you could ask for 'a glossy blue button with hover effects' or 'a responsive card with an image and description'.",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
      
      if (savedDesign) {
        setElementDesign(JSON.parse(savedDesign));
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      const welcomeMessage: ChatMessage = {
        id: uuidv4(),
        content: "Welcome to the AI Element Designer! Tell me what kind of element you'd like to create, and I'll help you design it. For example, you could ask for 'a glossy blue button with hover effects' or 'a responsive card with an image and description'.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (elementDesign.html || elementDesign.css || elementDesign.javascript) {
      localStorage.setItem(DESIGN_HISTORY_KEY, JSON.stringify(elementDesign));
    }
  }, [elementDesign]);

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

  const getConversationContext = (userMessage: string): string => {
    const recentMessages = messages
      .filter(msg => !msg.content.includes("Welcome to the AI Element Designer"))
      .slice(-CONTEXT_HISTORY_LENGTH);
    
    let contextString = "Recent conversation context:\n";
    
    recentMessages.forEach(msg => {
      contextString += `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });
    
    contextString += `User: ${userMessage}\n\nUse this context to understand the user's intent, especially if they use short phrases like "make it blue" or "add a shadow".`;
    
    return contextString;
  };

  const handleSendMessage = async (message: string) => {
    addMessage(message, 'user');
    setIsLoading(true);
    
    try {
      const messageWithContext = getConversationContext(message);
      
      if (elementDesign.html === '') {
        addMessage("Generating your element design...", 'assistant');
        const design = await GroqService.generateElementDesign(messageWithContext, selectedModel);
        setElementDesign(design);
        setMessages(prev => {
          const updated = [...prev];
          updated.pop();
          updated.push({
            id: uuidv4(),
            content: "I've created that element for you. You can see it in the preview panel. What would you like to change?",
            sender: 'assistant',
            timestamp: new Date()
          });
          return updated;
        });
      } else {
        const updatedDesign = await GroqService.modifyElementDesign(
          elementDesign,
          messageWithContext,
          selectedModel
        );
        setElementDesign(updatedDesign);
        
        addMessage("I've updated the element based on your request. How does it look? Let me know if you'd like any further changes.", 'assistant');
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

  const handleRebuild = async () => {
    if (isLoading || messages.length === 0) return;
    
    setIsLoading(true);
    toast.info("Rebuilding your element...");
    
    try {
      const userMessages = messages.filter(msg => msg.sender === 'user');
      if (userMessages.length === 0) return;
      
      const lastUserMessage = userMessages[userMessages.length - 1].content;
      
      const messageWithContext = getConversationContext(lastUserMessage);
      
      const design = await GroqService.generateElementDesign(messageWithContext, selectedModel);
      setElementDesign(design);
      
      addMessage("I've rebuilt your element from scratch. How does this version look?", 'assistant');
      toast.success("Element rebuilt successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast.error(`Rebuild failed: ${errorMessage}`);
      console.error("Error rebuilding element:", error);
      
      addMessage("I'm sorry, there was an error rebuilding your element. Please try again.", 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;
    
    if (isPositive) {
      toast.success("Thanks for your positive feedback!");
    } else {
      toast.info("Sorry about that. Try asking for specific changes to improve the design.");
    }
    
    console.log(`Feedback for message '${message.content}': ${isPositive ? 'positive' : 'negative'}`);
  };

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
              <div className="flex justify-between items-center mb-4">
                <ModelSelector selectedModel={selectedModel} onModelChange={handleModelChange} />
                
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <Button
                    variant={activeTab === 'designer' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('designer')}
                    className={`rounded-r-none ${activeTab === 'designer' ? 'bg-designer-blue text-white' : ''}`}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Designer
                  </Button>
                  <Button
                    variant={activeTab === 'chat' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('chat')}
                    className={`rounded-l-none ${activeTab === 'chat' ? 'bg-designer-blue text-white' : ''}`}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="h-[calc(100vh-20rem)]">
              {activeTab === 'designer' ? (
                <ChatInterface 
                  messages={messages} 
                  onSendMessage={handleSendMessage}
                  onRebuild={handleRebuild}
                  onFeedback={handleFeedback}
                  isLoading={isLoading} 
                  contextLength={CONTEXT_HISTORY_LENGTH}
                />
              ) : (
                <ChatFeature isVisible={true} />
              )}
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
        
        <ChatAccess />
      </div>
    </div>
  );
};

export default Index;
