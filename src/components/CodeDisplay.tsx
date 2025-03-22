
import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ElementDesign } from '@/types';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Textarea } from "@/components/ui/textarea";

interface CodeDisplayProps {
  design: ElementDesign;
  onCodeChange?: (type: 'html' | 'css' | 'javascript', code: string) => void;
  readOnly?: boolean;
}

type CodeTab = 'html' | 'css' | 'javascript';

const CodeDisplay: React.FC<CodeDisplayProps> = ({ design, onCodeChange, readOnly = false }) => {
  const [activeTab, setActiveTab] = useState<CodeTab>('html');
  const [copied, setCopied] = useState(false);
  const [localDesign, setLocalDesign] = useState<ElementDesign>(design);

  // Update local state when props change
  useEffect(() => {
    setLocalDesign(design);
  }, [design]);

  const handleCodeChange = (code: string) => {
    if (readOnly) return;
    
    const updatedDesign = { ...localDesign };
    updatedDesign[activeTab] = code;
    setLocalDesign(updatedDesign);
    
    // Notify parent component of changes
    if (onCodeChange) {
      onCodeChange(activeTab, code);
    }
  };

  const handleCopyCode = () => {
    let codeToCopy = '';
    
    switch (activeTab) {
      case 'html':
        codeToCopy = localDesign.html;
        break;
      case 'css':
        codeToCopy = localDesign.css;
        break;
      case 'javascript':
        codeToCopy = localDesign.javascript;
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
        return localDesign.html;
      case 'css':
        return localDesign.css;
      case 'javascript':
        return localDesign.javascript;
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">Code {readOnly ? '(Read Only)' : '(Editable)'}</h2>
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
      
      <div className="flex-grow bg-gray-50 font-mono text-sm">
        {readOnly ? (
          <ScrollArea className="h-full p-4">
            <pre className="whitespace-pre-wrap break-words">
              {getActiveCode() || `No ${activeTab} code available`}
            </pre>
          </ScrollArea>
        ) : (
          <Textarea
            value={getActiveCode()}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm resize-none rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder={`Enter your ${activeTab} code here...`}
            spellCheck="false"
          />
        )}
      </div>
      
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
