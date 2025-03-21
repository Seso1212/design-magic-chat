
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle } from 'lucide-react';
import ChatFeature from './ChatFeature';

const ChatAccess: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        variant="default" 
        size="icon" 
        className="rounded-full w-12 h-12 shadow-lg hover:scale-110 transition-transform"
        onClick={toggleChat}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
      
      {isChatOpen && (
        <div className="absolute bottom-16 right-0 w-80">
          <ChatFeature isVisible={true} />
        </div>
      )}
    </div>
  );
};

export default ChatAccess;
