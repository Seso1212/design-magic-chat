
import React, { useEffect, useRef, useState } from 'react';
import { ElementDesign } from '@/types';
import { Maximize } from 'lucide-react';
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

  // Function to update iframe with current design
  const updateIframeContent = (iframe: HTMLIFrameElement | null) => {
    if (!iframe) return;
    
    try {
      // Create a blob URL from our HTML content
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
            
            ${design.css}
          </style>
        </head>
        <body>
          ${design.html || '<div>Your element will appear here. Try asking for something like "a glossy blue button with hover effects".</div>'}
          <script>
            ${design.javascript}
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

  return (
    <div className="flex flex-col h-full rounded-3xl shadow-sm border border-gray-100 overflow-hidden bg-white">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium">Preview</h2>
        
        <Sheet onOpenChange={setIsFullscreen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto" title="View fullscreen">
              <Maximize className="h-4 w-4" />
              <span className="sr-only">Fullscreen</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[95vh] sm:h-[95vh] p-0 max-w-full">
            <SheetHeader className="p-4 border-b border-gray-200 flex-row items-center justify-between">
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
