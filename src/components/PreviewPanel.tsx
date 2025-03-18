
import React, { useRef, useEffect } from 'react';
import { ElementDesign } from '@/types';

interface PreviewPanelProps {
  design: ElementDesign;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ design }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
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
            ${design.html}
            <script>
              ${design.javascript}
            </script>
          </body>
          </html>
        `);
        iframeDoc.close();
      }
    }
  }, [design]);

  return (
    <div className="flex flex-col h-full rounded-3xl shadow-sm border border-gray-100 overflow-hidden bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">Preview</h2>
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
