import React, { useState, useEffect } from 'react';
import { ChatMessage, AppProject } from '@/types';
import { GroqService } from '@/services/GroqService';
import ModelSelector from '@/components/ModelSelector';
import ChatInterface from '@/components/ChatInterface';
import AppPreview from '@/components/AppPreview';
import AppFileEditor from '@/components/AppFileEditor';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

// Key for storing chat history in localStorage
const CHAT_HISTORY_KEY = 'app_generator_chat_history';
const PROJECT_HISTORY_KEY = 'app_generator_project_history';
// Maximum number of recent messages to use for context
const CONTEXT_HISTORY_LENGTH = 5;

// Sample initial project
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
      type: "js"
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
      type: "css"
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
      type: "html"
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

  // Load chat history from localStorage on component mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      const savedProject = localStorage.getItem(PROJECT_HISTORY_KEY);
      
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
              project: JSON.parse(savedProject || JSON.stringify(initialProject))
            };
          }
        });
        setCheckpoints(initialCheckpoints);
      } else {
        // Add welcome message if no history exists
        const welcomeMessage: ChatMessage = {
          id: uuidv4(),
          content: "Welcome to the AI App Generator! I've added a sample app to get you started. You can edit the code directly or ask me to modify it. Try asking for a specific type of app or request changes to the current one!",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        
        // Initialize first checkpoint
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
      // If there's an error, just start with the welcome message
      const welcomeMessage: ChatMessage = {
        id: uuidv4(),
        content: "Welcome to the AI App Generator! I've added a sample app to get you started. You can edit the code directly or ask me to modify it. Try asking for a specific type of app or request changes to the current one!",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      // Initialize first checkpoint
      const initialCheckpointId = welcomeMessage.id;
      setCheckpoints({
        [initialCheckpointId]: {
          messages: [welcomeMessage],
          project: initialProject
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

  // Save project to localStorage whenever it changes
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
    
    // Create a checkpoint for assistant messages
    if (sender === 'assistant') {
      setCheckpoints(prev => ({
        ...prev,
        [newMessage.id]: {
          messages: newMessages,
          project: {...project}
        }
      }));
    }
    
    return newMessage;
  };

  // Get recent conversation context
  const getConversationContext = (userMessage: string): string => {
    // Get recent messages, filtering out the welcome message
    const recentMessages = messages
      .filter(msg => !msg.content.includes("Welcome to the AI App Generator"))
      .slice(-CONTEXT_HISTORY_LENGTH);
    
    // Format the context as a conversation
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
      if (project.files.length === 0 || message.toLowerCase().includes("create new") || message.toLowerCase().includes("generate new")) {
        // Display a temporary message while we're generating
        addMessage("Generating your app...", 'assistant');
        
        // Generate new app with context
        const generatedProject = await GroqService.generateAppFiles(messageWithContext, selectedModel);
        setProject(generatedProject);
        
        // Replace the temporary message with the success message
        setMessages(prev => {
          const updated = [...prev];
          // Remove the last message (which is the temporary one)
          updated.pop();
          // Add the success message
          const successMessage = {
            id: uuidv4(),
            content: `I've created a ${generatedProject.name} app for you. You can see it in the preview panel and edit the code directly. What would you like to change?`,
            sender: 'assistant' as const,
            timestamp: new Date()
          };
          updated.push(successMessage);
          
          // Create a checkpoint for this state
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
        // Modify existing project with context
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
      // Extract the most relevant user messages to build context
      const userMessages = messages.filter(msg => msg.sender === 'user');
      if (userMessages.length === 0) return;
      
      // Use the last user message as the primary instruction
      const lastUserMessage = userMessages[userMessages.length - 1].content;
      
      // Include conversation context for rebuilding
      const messageWithContext = getConversationContext(lastUserMessage);
      
      // Generate a new app from scratch with context
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
    
    // Restore the messages and project state from the checkpoint
    setMessages(checkpoint.messages);
    setProject(checkpoint.project);
    toast.success("Restored to checkpoint");
  };

  const handleNewChat = () => {
    // Clear the chat history but keep the welcome message
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      content: "Welcome to the AI App Generator! I've added a sample app to get you started. You can edit the code directly or ask me to modify it. Try asking for a specific type of app or request changes to the current one!",
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    
    // Reset to initial project
    setProject(initialProject);
    
    // Reset checkpoints
    setCheckpoints({
      [welcomeMessage.id]: {
        messages: [welcomeMessage],
        project: initialProject
      }
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
