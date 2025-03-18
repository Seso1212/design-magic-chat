
import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ElementDesign } from '@/types';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CodeDisplayProps {
  design: ElementDesign;
}

type CodeTab = 'html' | 'css' | 'javascript';

const CodeDisplay: React.FC<CodeDisplayProps> = ({ design }) => {
  const [activeTab, setActiveTab] = useState<CodeTab>('html');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    let codeToCopy = '';
    
    switch (activeTab) {
      case 'html':
        codeToCopy = design.html;
        break;
      case 'css':
        codeToCopy = design.css;
        break;
      case 'javascript':
        codeToCopy = design.javascript;
        break;
    }
    
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getActiveCode = () => {
    switch (activeTab) {
      case 'html':
        return design.html;
      case 'css':
        return design.css;
      case 'javascript':
        return design.javascript;
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">Code</h2>
      </div>
      
      <div className="flex border-b border-gray-200">
        <button
          className={cn("code-tab", activeTab === 'html' && "active")}
          onClick={() => setActiveTab('html')}
        >
          HTML
        </button>
        <button
          className={cn("code-tab", activeTab === 'css' && "active")}
          onClick={() => setActiveTab('css')}
        >
          CSS
        </button>
        <button
          className={cn("code-tab", activeTab === 'javascript' && "active")}
          onClick={() => setActiveTab('javascript')}
        >
          JavaScript
        </button>
      </div>
      
      <ScrollArea className="flex-grow p-4 bg-gray-50 font-mono text-sm">
        <pre className="whitespace-pre-wrap break-words">
          {getActiveCode() || `No ${activeTab} code available`}
        </pre>
      </ScrollArea>
      
      <div className="p-3 border-t border-gray-200 flex justify-end">
        <Button
          onClick={handleCopyCode}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-sm"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4" /> Copied
            </>
          ) : (
            <>
              <CopyIcon className="h-4 w-4" /> Copy Code
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CodeDisplay;
