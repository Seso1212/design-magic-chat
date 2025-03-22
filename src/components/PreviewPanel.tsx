
import React, { useEffect, useRef, useState } from 'react';
import { ElementDesign } from '@/types';
import { Expand, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

interface PreviewPanelProps {
  design: ElementDesign;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ design }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Default code samples for new users
  const defaultHTML = `<div class="modern-card">
  <h2 class="card-title">Welcome</h2>
  <p class="card-text">This is a sample element. Ask the AI to modify it or create something new!</p>
  <button class="card-button">Click Me</button>
</div>`;

  const defaultCSS = `.modern-card {
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
}`;

  const defaultJS = `document.querySelector('.card-button').addEventListener('click', function() {
  this.textContent = 'Clicked!';
  setTimeout(() => {
    this.textContent = 'Click Me';
  }, 1000);
});`;

  // Function to update iframe with current design
  const updateIframeContent = (iframe: HTMLIFrameElement | null) => {
    if (!iframe) return;
    
    try {
      // Determine if we should use default samples or user design
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Element Preview</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: calc(100vh - 40px);
              background-color: #fbfbfd;
            }
            
            ${design.css || defaultCSS}
          </style>
        </head>
        <body>
          ${design.html || defaultHTML}
          <script>
            ${design.javascript || defaultJS}
          </script>
        </body>
        </html>
      `;
      
      // Create a blob and URL
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const blobURL = URL.createObjectURL(blob);
      
      // Set the iframe src to the blob URL
      iframe.src = blobURL;
      
      return () => {
        URL.revokeObjectURL(blobURL);
      };
    } catch (error) {
      console.error("Error updating iframe content:", error);
    }
  };

  // Update the main preview
  useEffect(() => {
    const cleanup = updateIframeContent(iframeRef.current);
    return cleanup;
  }, [design]);

  // Update the fullscreen preview when it's open
  useEffect(() => {
    if (isFullscreen) {
      const cleanup = updateIframeContent(fullscreenIframeRef.current);
      return cleanup;
    }
  }, [isFullscreen, design]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    updateIframeContent(iframeRef.current);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="flex flex-col h-full rounded-3xl shadow-card overflow-hidden bg-white border border-gray-100 transition-all hover:shadow-card-hover">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-designer-light-purple/30 to-designer-light-blue/20">
        <h2 className="text-lg font-medium">Preview</h2>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-600 hover:text-designer-purple transition-colors" 
            title="Refresh preview"
            onClick={handleRefresh}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
          
          <Sheet onOpenChange={setIsFullscreen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-600 hover:text-designer-purple transition-colors" 
                title="View fullscreen"
              >
                <Expand className="h-4 w-4" />
                <span className="sr-only">Fullscreen</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[95vh] sm:h-[95vh] p-0 max-w-full">
              <SheetHeader className="p-4 border-b border-gray-200 flex-row items-center justify-between bg-gradient-to-r from-designer-light-purple/30 to-designer-light-blue/20">
                <SheetTitle>Element Preview (Fullscreen)</SheetTitle>
              </SheetHeader>
              <div className="w-full h-[calc(95vh-60px)] bg-designer-light-gray">
                <iframe
                  ref={fullscreenIframeRef}
                  title="Fullscreen Element Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts"
                ></iframe>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="flex-grow overflow-hidden bg-designer-light-gray">
        <iframe
          ref={iframeRef}
          title="Element Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts"
        ></iframe>
      </div>
    </div>
  );
};

export default PreviewPanel;
