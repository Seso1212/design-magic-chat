import React, { useState, useEffect } from 'react';
import { ChatMessage, ElementDesign } from '@/types';
import { GroqService } from '@/services/GroqService';
import ModelSelector from '@/components/ModelSelector';
import ChatInterface from '@/components/ChatInterface';
import PreviewPanel from '@/components/PreviewPanel';
import CodeDisplay from '@/components/CodeDisplay';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

// Key for storing chat history in localStorage
const CHAT_HISTORY_KEY = 'element_designer_chat_history';
const DESIGN_HISTORY_KEY = 'element_designer_design_history';
// Maximum number of recent messages to use for context
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

  // Load chat history from localStorage on component mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      const savedDesign = localStorage.getItem(DESIGN_HISTORY_KEY);
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert string dates back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } else {
        // Add welcome message if no history exists
        const welcomeMessage: ChatMessage = {
          id: uuidv4(),
          content: "Welcome to the AI Element Designer! I've added a sample card element to get you started. You can ask me to modify it or create something entirely new, like 'a glossy blue button with hover effects' or 'a responsive card with an image and description'.",
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
      // If there's an error, just start with the welcome message
      const welcomeMessage: ChatMessage = {
        id: uuidv4(),
        content: "Welcome to the AI Element Designer! I've added a sample card element to get you started. You can ask me to modify it or create something entirely new, like 'a glossy blue button with hover effects' or 'a responsive card with an image and description'.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Save design history to localStorage whenever design changes
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

  // Get recent conversation context
  const getConversationContext = (userMessage: string): string => {
    // Get recent messages, filtering out the welcome message
    const recentMessages = messages
      .filter(msg => !msg.content.includes("Welcome to the AI Element Designer"))
      .slice(-CONTEXT_HISTORY_LENGTH);
    
    // Format the context as a conversation
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
      // Include conversation context with the user's message
      const messageWithContext = getConversationContext(message);
      
      // Check if this is the first message or a modification request
      if (elementDesign.html === '') {
        // Display a temporary message while we're generating
        addMessage("Generating your element design...", 'assistant');
        
        // Generate new element design with context
        const design = await GroqService.generateElementDesign(messageWithContext, selectedModel);
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
        // Modify existing design with context
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
      // Extract the most relevant user messages to build context
      const userMessages = messages.filter(msg => msg.sender === 'user');
      if (userMessages.length === 0) return;
      
      // Use the last user message as the primary instruction
      const lastUserMessage = userMessages[userMessages.length - 1].content;
      
      // Include conversation context for rebuilding
      const messageWithContext = getConversationContext(lastUserMessage);
      
      // Generate a new design from scratch with context
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
    // Find the message that received feedback
    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;
    
    if (isPositive) {
      toast.success("Thanks for your positive feedback!");
    } else {
      toast.info("Sorry about that. Try asking for specific changes to improve the design.");
    }
    
    // In a real application, you might want to send this feedback to your backend
    console.log(`Feedback for message '${message.content}': ${isPositive ? 'positive' : 'negative'}`);
  };

  const handleNewChat = () => {
    // Clear the chat history but keep the welcome message
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      content: "Welcome to the AI Element Designer! I've added a sample card element to get you started. You can ask me to modify it or create something entirely new, like 'a glossy blue button with hover effects' or 'a responsive card with an image and description'.",
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    
    // Clear the element design
    setElementDesign({
      html: '',
      css: '',
      javascript: ''
    });
    
    toast.success("Started a new design session");
  };

  return (
    <div className="min-h-screen bg-gradient-soft px-6 py-8 animate-fade-in">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8 text-center animate-slide-up">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-designer-purple animate-pulse-subtle" />
            <h1 className="text-3xl font-bold gradient-text bg-gradient-purple">AI Element Design Builder</h1>
          </div>
          <p className="text-muted-foreground">Create beautiful web elements with AI assistance</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="p-5 glass-panel backdrop-blur-md bg-white/80 rounded-3xl shadow-glass border border-white/50">
              <ModelSelector selectedModel={selectedModel} onModelChange={handleModelChange} />
            </div>
            
            <div className="h-[calc(100vh-20rem)]">
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage}
                onRebuild={handleRebuild}
                onNewChat={handleNewChat}
                onFeedback={handleFeedback}
                isLoading={isLoading} 
                contextLength={CONTEXT_HISTORY_LENGTH}
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
