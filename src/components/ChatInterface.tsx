
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from '@/types';
import { SendIcon, BotIcon, UserIcon, ThumbsUpIcon, ThumbsDownIcon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onRebuild: () => void;
  onFeedback: (messageId: string, isPositive: boolean) => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  onRebuild,
  onFeedback,
  isLoading 
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <BotIcon className="w-5 h-5 mr-2 text-designer-blue" />
          <h2 className="text-lg font-medium">Element Designer</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRebuild}
          disabled={isLoading || messages.length === 0}
          className="flex items-center gap-1 text-xs"
        >
          <RefreshCwIcon className="h-3 w-3" /> Rebuild
        </Button>
      </div>

      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground text-center px-4">
              <div>
                <p className="mb-2">Describe the element you want to design</p>
                <p className="text-sm">For example: "Create a glossy blue button with hover effects"</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
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
                        {msg.sender === 'user' ? 'You' : 'AI Assistant'}
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
                      onClick={() => onFeedback(msg.id, true)}
                      className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <ThumbsUpIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onFeedback(msg.id, false)}
                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <ThumbsDownIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
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
            placeholder="Describe an element or ask for changes..."
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

export default ChatInterface;
