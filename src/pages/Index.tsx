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

// Sample initial design
const initialDesign: ElementDesign = {
  html: `<div class="modern-card">
  <h2 class="card-title">Welcome</h2>
  <p class="card-text">This is a sample element. Edit the code or ask the AI to modify it!</p>
  <button class="card-button">Click Me</button>
</div>`,
  css: `.modern-card {
  padding: 2rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.modern-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(31, 38, 135, 0.15);
}

.card-title {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: #8B5CF6;
  font-weight: 600;
}

.card-text {
  color: #4B5563;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.card-button {
  background-color: #8B5CF6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.card-button:hover {
  background-color: #7C3AED;
}`,
  javascript: `document.querySelector('.card-button').addEventListener('click', function() {
  this.textContent = 'Clicked!';
  setTimeout(() => {
    this.textContent = 'Click Me';
  }, 1000);
});`
};

interface CheckpointState {
  messages: ChatMessage[];
  design: ElementDesign;
}

const Index = () => {
  const [selectedModel, setSelectedModel] = useState<string>(GroqService.getDefaultModel());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [elementDesign, setElementDesign] = useState<ElementDesign>(initialDesign);
  const [checkpoints, setCheckpoints] = useState<Record<string, CheckpointState>>({});

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
        
        // Initialize checkpoints from loaded messages
        const initialCheckpoints: Record<string, CheckpointState> = {};
        messagesWithDates.forEach((msg: ChatMessage, index: number) => {
          if (msg.sender === 'assistant') {
            initialCheckpoints[msg.id] = {
              messages: messagesWithDates.slice(0, index + 1),
              design: JSON.parse(savedDesign || JSON.stringify(initialDesign))
            };
          }
        });
        setCheckpoints(initialCheckpoints);
      } else {
        // Add welcome message if no history exists
        const welcomeMessage: ChatMessage = {
          id: uuidv4(),
          content: "Welcome to the AI Element Designer! I've added a sample card element to get you started. You can edit the code directly or ask me to modify it. Try changing colors, adding features, or creating something new!",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        
        // Initialize first checkpoint
        const initialCheckpointId = welcomeMessage.id;
        setCheckpoints({
          [initialCheckpointId]: {
            messages: [welcomeMessage],
            design: initialDesign
          }
        });
      }
      
      if (savedDesign) {
        setElementDesign(JSON.parse(savedDesign));
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      // If there's an error, just start with the welcome message
      const welcomeMessage: ChatMessage = {
        id: uuidv4(),
        content: "Welcome to the AI Element Designer! I've added a sample card element to get you started. You can edit the code directly or ask me to modify it. Try changing colors, adding features, or creating something new!",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      // Initialize first checkpoint
      const initialCheckpointId = welcomeMessage.id;
      setCheckpoints({
        [initialCheckpointId]: {
          messages: [welcomeMessage],
          design: initialDesign
        }
      });
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

  const handleCodeChange = (type: 'html' | 'css' | 'javascript', code: string) => {
    setElementDesign(prev => ({
      ...prev,
      [type]: code
    }));
  };

  const addMessage = (content: string, sender: 'user' | 'assistant') => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      content,
      sender,
      timestamp: new Date()
    };
    
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    
    // Create a checkpoint for assistant messages
    if (sender === 'assistant') {
      setCheckpoints(prev => ({
        ...prev,
        [newMessage.id]: {
          messages: newMessages,
          design: {...elementDesign}
        }
      }));
    }
    
    return newMessage;
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
    
    contextString += `User: ${userMessage}\n\nUse this context to understand the user's intent, especially if they use short phrases like "make it blue" or "add a shadow". If the user's request is unclear or ambiguous, ask clarifying questions instead of making assumptions.`;
    
    return contextString;
  };

  const handleSendMessage = async (message: string) => {
    addMessage(message, 'user');
    setIsLoading(true);
    
    try {
      // Include conversation context with the user's message
      const messageWithContext = getConversationContext(message);
      
      // If the message is very short or ambiguous, consider asking for clarification
      if (message.trim().length < 5 || message.split(' ').length < 2) {
        // Simple heuristic for potentially ambiguous messages
        const clarificationMessage = "Could you provide more details about what you'd like me to do? Your request seems brief, and I want to make sure I understand correctly.";
        addMessage(clarificationMessage, 'assistant');
        setIsLoading(false);
        return;
      }
      
      // Check if this is the first message or a modification request
      if (!elementDesign.html && !elementDesign.css && !elementDesign.javascript) {
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
          const successMessage = {
            id: uuidv4(),
            content: "I've created that element for you. You can see it in the preview panel and edit the code directly. What would you like to change?",
            sender: 'assistant' as const,
            timestamp: new Date()
          };
          updated.push(successMessage);
          
          // Create a checkpoint for this state
          setCheckpoints(prevCheckpoints => ({
            ...prevCheckpoints,
            [successMessage.id]: {
              messages: updated,
              design: design
            }
          }));
          
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
        
        const responseMessage = addMessage("I've updated the element based on your request. You can continue editing the code directly or ask for more changes.", 'assistant');
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
      
      const responseMessage = addMessage("I've rebuilt your element from scratch. How does this version look?", 'assistant');
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

  const handleRestoreCheckpoint = (messageId: string) => {
    const checkpoint = checkpoints[messageId];
    if (!checkpoint) {
      toast.error("Checkpoint not found");
      return;
    }
    
    // Restore the messages and design state from the checkpoint
    setMessages(checkpoint.messages);
    setElementDesign(checkpoint.design);
    toast.success("Restored to checkpoint");
  };

  const handleNewChat = () => {
    // Clear the chat history but keep the welcome message
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      content: "Welcome to the AI Element Designer! I've added a sample card element to get you started. You can edit the code directly or ask me to modify it. Try changing colors, adding features, or creating something new!",
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    
    // Reset to initial design
    setElementDesign(initialDesign);
    
    // Reset checkpoints
    setCheckpoints({
      [welcomeMessage.id]: {
        messages: [welcomeMessage],
        design: initialDesign
      }
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
                onRestoreCheckpoint={handleRestoreCheckpoint}
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
              <CodeDisplay 
                design={elementDesign} 
                onCodeChange={handleCodeChange}
                readOnly={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
