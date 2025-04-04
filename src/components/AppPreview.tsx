import React, { useEffect, useRef, useState } from 'react';
import { AppProject, AppFileType } from '@/types';
import { RefreshCw, Expand } from 'lucide-react';
import { Button } from './ui/button';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

interface AppPreviewProps {
  project: AppProject;
}

const AppPreview: React.FC<AppPreviewProps> = ({ project }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to generate HTML with all project files
  const generateHtml = (): string => {
    // Find the HTML file for the main layout
    const htmlFile = project.files.find(file => file.type === 'html');
    
    // Find CSS files
    const cssFiles = project.files.filter(file => file.type === 'css');
    
    // Find the entry JS file and other JS files
    const entryFile = project.files.find(file => file.name === project.entryFile);
    const jsFiles = project.files.filter(file => 
      ['js', 'jsx', 'ts', 'tsx'].includes(file.type) && file.name !== project.entryFile
    );
    
    // Create a basic HTML template if no HTML file exists
    let htmlContent = '';
    if (htmlFile) {
      htmlContent = htmlFile.content;
    } else {
      htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${project.name}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            #app {
              max-width: 1200px;
              margin: 0 auto;
            }
          </style>
          ${cssFiles.map(file => `<style>${file.content}</style>`).join('\n')}
        </head>
        <body>
          <div id="app"></div>
          ${jsFiles.map(file => `<script type="module">${file.content}</script>`).join('\n')}
          ${entryFile ? `<script type="module">${entryFile.content}</script>` : ''}
        </body>
        </html>
      `;
    }
    
    return htmlContent;
  };

  // Function to update iframe with current project
  const updateIframeContent = (iframe: HTMLIFrameElement | null) => {
    if (!iframe) return;
    
    try {
      // Generate HTML content with all project files
      const htmlContent = generateHtml();
      
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
  }, [project]);

  // Update the fullscreen preview when it's open
  useEffect(() => {
    if (isFullscreen) {
      const cleanup = updateIframeContent(fullscreenIframeRef.current);
      return cleanup;
    }
  }, [isFullscreen, project]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    updateIframeContent(iframeRef.current);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="flex flex-col h-full rounded-3xl shadow-card overflow-hidden bg-white border border-gray-100 transition-all hover:shadow-card-hover">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-designer-light-purple/30 to-designer-light-blue/20">
        <h2 className="text-lg font-medium">App Preview</h2>
        
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
                <SheetTitle>App Preview (Fullscreen)</SheetTitle>
              </SheetHeader>
              <div className="w-full h-[calc(95vh-60px)] bg-designer-light-gray">
                <iframe
                  ref={fullscreenIframeRef}
                  title="Fullscreen App Preview"
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
          title="App Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts"
        ></iframe>
      </div>
    </div>
  );
};

export default AppPreview;
