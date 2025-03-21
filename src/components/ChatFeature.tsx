
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  SendIcon, 
  UserIcon, 
  BotIcon,
  ThumbsUpIcon, 
  ThumbsDownIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '@/types';

// Key for storing chat history in localStorage
const CHAT_HISTORY_KEY = 'direct_chat_history';

interface ChatFeatureProps {
  isVisible: boolean;
}

const ChatFeature: React.FC<ChatFeatureProps> = ({ isVisible }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      
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
          content: "Welcome to the chat! How can I help you today?",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      // If there's an error, just start with the welcome message
      const welcomeMessage: ChatMessage = {
        id: uuidv4(),
        content: "Welcome to the chat! How can I help you today?",
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component becomes visible
  useEffect(() => {
    if (isVisible) {
      inputRef.current?.focus();
    }
  }, [isVisible]);

  const handleSendMessage = async () => {
    if (input.trim() && !isLoading) {
      // Add user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        content: input.trim(),
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);
      
      try {
        // Simulate AI response (in a real app, you'd call an API here)
        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: uuidv4(),
            content: `I received your message: "${input.trim()}". How can I help you further?`,
            sender: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred";
        toast.error(`Error: ${errorMessage}`);
        console.error("Error sending message:", error);
        
        // Add error message
        const errorMsg: ChatMessage = {
          id: uuidv4(),
          content: "I'm sorry, there was an error processing your request. Please try again.",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    // Find the message that received feedback
    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;
    
    if (isPositive) {
      toast.success("Thanks for your positive feedback!");
    } else {
      toast.info("Sorry about that. I'll try to do better.");
    }
    
    // In a real application, you might want to send this feedback to your backend
    console.log(`Feedback for message '${message.content}': ${isPositive ? 'positive' : 'negative'}`);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-gray-200 flex items-center">
        <MessageCircle className="w-5 h-5 mr-2 text-designer-blue" />
        <h2 className="text-lg font-medium">Chat</h2>
      </div>

      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex flex-col gap-2"
            >
              <div
                className={`flex ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.sender === 'user'
                      ? 'bg-designer-blue text-white rounded-tr-none'
                      : 'bg-designer-light-gray text-designer-dark-gray rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {msg.sender === 'assistant' ? (
                      <BotIcon className="w-4 h-4 mr-2" />
                    ) : (
                      <UserIcon className="w-4 h-4 mr-2" />
                    )}
                    <span className="text-xs">
                      {msg.sender === 'user' ? 'You' : 'Assistant'}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                </div>
              </div>
              
              {msg.sender === 'assistant' && (
                <div className="flex justify-start gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(msg.id, true)}
                    className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <ThumbsUpIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(msg.id, false)}
                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <ThumbsDownIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-grow h-10 rounded-xl border-gray-200 focus:border-designer-blue focus:ring-designer-blue"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="h-10 px-4 bg-designer-blue text-white rounded-xl hover:bg-opacity-90 transition-colors duration-200"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <SendIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatFeature;
