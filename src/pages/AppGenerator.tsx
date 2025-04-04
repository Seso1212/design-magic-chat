import React, { useState, useEffect } from 'react';
import { ChatMessage, AppProject, AppFile, AppFileType } from '@/types';
import { GroqService } from '@/services/GroqService';
import ModelSelector from '@/components/ModelSelector';
import ChatInterface from '@/components/ChatInterface';
import AppPreview from '@/components/AppPreview';
import AppFileEditor from '@/components/AppFileEditor';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

const CHAT_HISTORY_KEY = 'app_generator_chat_history';
const PROJECT_HISTORY_KEY = 'app_generator_project_history';
const CONTEXT_HISTORY_LENGTH = 5;

const initialProject: AppProject = {
  name: "Hello World App",
  description: "A simple starter app to demonstrate the app generator",
  entryFile: "app.js",
  files: [
    {
      name: "app.js",
      content: `// Main application entry point
document.addEventListener('DOMContentLoaded', function() {
  const app = document.getElementById('app');
  
  // Create app elements
  const header = document.createElement('header');
  header.innerHTML = '<h1>Hello World App</h1>';
  
  const content = document.createElement('div');
  content.className = 'content';
  content.innerHTML = '<p>Welcome to your generated app! Ask the AI to modify this app or create something new.</p>';
  
  const button = document.createElement('button');
  button.textContent = 'Click Me';
  button.className = 'main-button';
  button.addEventListener('click', function() {
    this.textContent = 'Clicked!';
    setTimeout(() => {
      this.textContent = 'Click Me';
    }, 1000);
  });
  
  // Append elements to the app
  app.appendChild(header);
  app.appendChild(content);
  app.appendChild(button);
});`,
      type: "js" as AppFileType
    },
    {
      name: "styles.css",
      content: `/* App styles */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

#app {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 80%;
  max-width: 600px;
  text-align: center;
}

h1 {
  color: #8B5CF6;
  margin-top: 0;
}

.content {
  margin: 2rem 0;
  line-height: 1.6;
  color: #4B5563;
}

.main-button {
  background-color: #8B5CF6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.main-button:hover {
  background-color: #7C3AED;
}`,
      type: "css" as AppFileType
    },
    {
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World App</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app"></div>
  <script src="app.js"></script>
</body>
</html>`,
      type: "html" as AppFileType
    }
  ]
};

interface CheckpointState {
  messages: ChatMessage[];
  project: AppProject;
}

const AppGenerator: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>(GroqService.getDefaultModel());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [project, setProject] = useState<AppProject>(initialProject);
  const [checkpoints, setCheckpoints] = useState<Record<string, CheckpointState>>({});

  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      const savedProject = localStorage.getItem(PROJECT_HISTORY_KEY);
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
        
        const initialCheckpoints: Record<string, CheckpointState> = {};
        messagesWithDates.forEach((msg: ChatMessage, index: number) => {
          if (msg.sender === 'assistant') {
            initialCheckpoints[msg.id] = {
              messages: messagesWithDates.slice(0, index + 1),
              project: JSON.parse(savedProject || JSON.stringify(initialProject))
            };
          }
        });
        setCheckpoints(initialCheckpoints);
      } else {
        const welcomeMessage: ChatMessage = {
          id: uuidv4(),
          content: "Welcome to the AI App Generator! I've added a sample app to get you started. You can edit the code directly or ask me to modify it. Try asking for a specific type of app or request changes to the current one!",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        
        const initialCheckpointId = welcomeMessage.id;
        setCheckpoints({
          [initialCheckpointId]: {
            messages: [welcomeMessage],
            project: initialProject
          }
        });
      }
      
      if (savedProject) {
        setProject(JSON.parse(savedProject));
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      const welcomeMessage: ChatMessage = {
        id: uuidv4(),
        content: "Welcome to the AI App Generator! I've added a sample app to get you started. You can edit the code directly or ask me to modify it. Try asking for a specific type of app or request changes to the current one!",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      const initialCheckpointId = welcomeMessage.id;
      setCheckpoints({
        [initialCheckpointId]: {
          messages: [welcomeMessage],
          project: initialProject
        }
      });
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (project.files.length > 0) {
      localStorage.setItem(PROJECT_HISTORY_KEY, JSON.stringify(project));
    }
  }, [project]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const handleProjectChange = (updatedProject: AppProject) => {
    setProject(updatedProject);
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
    
    if (sender === 'assistant') {
      const checkpoint: CheckpointState = {
        messages: newMessages,
        project: {...project}
      };
      
      setCheckpoints(prev => ({
        ...prev,
        [newMessage.id]: checkpoint
      }));
    }
    
    return newMessage;
  };

  const getConversationContext = (userMessage: string): string => {
    const recentMessages = messages
      .filter(msg => !msg.content.includes("Welcome to the AI App Generator"))
      .slice(-CONTEXT_HISTORY_LENGTH);
    
    let contextString = "Recent conversation context:\n";
    
    recentMessages.forEach(msg => {
      contextString += `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });
    
    contextString += `User: ${userMessage}\n\nUse this context to understand the user's intent, especially if they use short phrases or refer to previous messages. If the user's request is unclear or ambiguous, ask clarifying questions instead of making assumptions.`;
    
    return contextString;
  };

  const handleSendMessage = async (message: string) => {
    addMessage(message, 'user');
    setIsLoading(true);
    
    try {
      const messageWithContext = getConversationContext(message);
      
      if (message.trim().length < 5 || message.split(' ').length < 2) {
        const clarificationMessage = "Could you provide more details about what you'd like me to do? Your request seems brief, and I want to make sure I understand correctly.";
        addMessage(clarificationMessage, 'assistant');
        setIsLoading(false);
        return;
      }
      
      if (project.files.length === 0 || message.toLowerCase().includes("create new") || message.toLowerCase().includes("generate new")) {
        addMessage("Generating your app...", 'assistant');
        
        const generatedProject = await GroqService.generateAppFiles(messageWithContext, selectedModel);
        setProject(generatedProject);
        
        setMessages(prev => {
          const updated = [...prev];
          updated.pop();
          const successMessage = {
            id: uuidv4(),
            content: `I've created a ${generatedProject.name} app for you. You can see it in the preview panel and edit the code directly. What would you like to change?`,
            sender: 'assistant' as const,
            timestamp: new Date()
          };
          updated.push(successMessage);
          
          setCheckpoints(prevCheckpoints => ({
            ...prevCheckpoints,
            [successMessage.id]: {
              messages: updated,
              project: generatedProject
            }
          }));
          
          return updated;
        });
      } else {
        const updatedProject = await GroqService.modifyAppFiles(
          project,
          messageWithContext,
          selectedModel
        );
        setProject(updatedProject);
        
        const responseMessage = addMessage("I've updated the app based on your request. You can test it in the preview panel or continue editing the code directly.", 'assistant');
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
    toast.info("Rebuilding your app...");
    
    try {
      const userMessages = messages.filter(msg => msg.sender === 'user');
      if (userMessages.length === 0) return;
      
      const lastUserMessage = userMessages[userMessages.length - 1].content;
      
      const messageWithContext = getConversationContext(lastUserMessage);
      
      const generatedProject = await GroqService.generateAppFiles(messageWithContext, selectedModel);
      
      setProject(generatedProject);
      
      const responseMessage = addMessage("I've rebuilt your app from scratch. How does this version look?", 'assistant');
      toast.success("App rebuilt successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast.error(`Rebuild failed: ${errorMessage}`);
      console.error("Error rebuilding app:", error);
      
      addMessage("I'm sorry, there was an error rebuilding your app. Please try again.", 'assistant');
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
    
    setMessages(checkpoint.messages);
    setProject(checkpoint.project);
    toast.success("Restored to checkpoint");
  };

  const handleNewChat = () => {
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      content: "Welcome to the AI App Generator! I've added a sample app to get you started. You can edit the code directly or ask me to modify it. Try asking for a specific type of app or request changes to the current one!",
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setProject(initialProject);
    
    const initialCheckpoint: CheckpointState = {
      messages: [welcomeMessage],
      project: initialProject
    };
    
    setCheckpoints({
      [welcomeMessage.id]: initialCheckpoint
    });
    
    toast.success("Started a new app session");
  };

  return (
    <div className="min-h-screen bg-gradient-soft px-6 py-8 animate-fade-in">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8 text-center animate-slide-up">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-designer-purple animate-pulse-subtle" />
            <h1 className="text-3xl font-bold gradient-text bg-gradient-purple">AI App Generator</h1>
          </div>
          <p className="text-muted-foreground">Create complete web applications with AI assistance</p>
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
              <AppPreview project={project} />
            </div>
            
            <div className="h-[calc(50vh-6rem)]">
              <AppFileEditor 
                project={project} 
                onProjectChange={handleProjectChange}
                readOnly={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppGenerator;
