import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AppFile, AppProject, AppFileType } from '@/types';
import { CopyIcon, CheckIcon, PlayIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface AppFileEditorProps {
  project: AppProject;
  onProjectChange?: (project: AppProject) => void;
  readOnly?: boolean;
}

const AppFileEditor: React.FC<AppFileEditorProps> = ({ project, onProjectChange, readOnly = false }) => {
  const [activeFile, setActiveFile] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [localProject, setLocalProject] = useState<AppProject>(project);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState<AppFileType>("js");

  useEffect(() => {
    if (project.files.length > 0 && !activeFile) {
      setActiveFile(project.entryFile);
    }
  }, [project.files, activeFile, project.entryFile]);

  useEffect(() => {
    setLocalProject(project);
  }, [project]);

  const handleFileContentChange = (content: string) => {
    if (readOnly) return;
    
    const updatedFiles = localProject.files.map(file => {
      if (file.name === activeFile) {
        return { ...file, content };
      }
      return file;
    });
    
    const updatedProject = { ...localProject, files: updatedFiles };
    setLocalProject(updatedProject);
    
    if (onProjectChange) {
      onProjectChange(updatedProject);
    }
  };

  const handleCopyCode = () => {
    const activeFileObj = localProject.files.find(file => file.name === activeFile);
    if (!activeFileObj) return;
    
    navigator.clipboard.writeText(activeFileObj.content).then(() => {
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAddFile = () => {
    if (!newFileName.trim()) {
      toast.error("Please enter a file name");
      return;
    }
    
    if (localProject.files.some(file => file.name === newFileName)) {
      toast.error("A file with this name already exists");
      return;
    }
    
    const newFile: AppFile = {
      name: newFileName,
      content: "",
      type: newFileType
    };
    
    const updatedProject = {
      ...localProject,
      files: [...localProject.files, newFile]
    };
    
    setLocalProject(updatedProject);
    setActiveFile(newFileName);
    setNewFileName("");
    
    if (onProjectChange) {
      onProjectChange(updatedProject);
    }
    
    toast.success("New file added");
  };

  const handleDeleteFile = (fileName: string) => {
    if (fileName === localProject.entryFile) {
      toast.error("Cannot delete the entry file");
      return;
    }
    
    const updatedFiles = localProject.files.filter(file => file.name !== fileName);
    
    if (activeFile === fileName) {
      setActiveFile(localProject.entryFile);
    }
    
    const updatedProject = { ...localProject, files: updatedFiles };
    setLocalProject(updatedProject);
    
    if (onProjectChange) {
      onProjectChange(updatedProject);
    }
    
    toast.success("File deleted");
  };

  const getActiveFileContent = () => {
    const activeFileObj = localProject.files.find(file => file.name === activeFile);
    return activeFileObj?.content || "";
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return '📄';
      case 'css':
        return '🎨';
      case 'html':
        return '🌐';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      default:
        return '📄';
    }
  };

  const isEntryFile = (fileName: string) => {
    return fileName === localProject.entryFile;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">
          {project.name} {readOnly ? '(Read Only)' : '(Editable)'}
        </h2>
        <p className="text-sm text-muted-foreground">{project.description}</p>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium mb-2">Files</h3>
            {!readOnly && (
              <div className="flex flex-col space-y-2">
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="filename.js"
                  className="text-sm h-8"
                />
                <div className="flex space-x-2">
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value as AppFileType)}
                    className="flex-1 text-sm h-8 rounded-md border border-input bg-background px-3"
                  >
                    <option value="js">JavaScript</option>
                    <option value="jsx">JSX</option>
                    <option value="ts">TypeScript</option>
                    <option value="tsx">TSX</option>
                    <option value="css">CSS</option>
                    <option value="html">HTML</option>
                    <option value="json">JSON</option>
                    <option value="md">Markdown</option>
                  </select>
                  <Button
                    onClick={handleAddFile}
                    size="sm"
                    className="h-8 px-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <ScrollArea className="h-full p-3">
            <ul className="space-y-1">
              {localProject.files.map((file) => (
                <li key={file.name}>
                  <div className={cn(
                    "flex items-center justify-between p-2 rounded-md text-sm cursor-pointer",
                    activeFile === file.name 
                      ? "bg-designer-light-purple text-designer-dark-gray" 
                      : "hover:bg-gray-100"
                  )}>
                    <button
                      className="flex items-center flex-1 text-left"
                      onClick={() => setActiveFile(file.name)}
                    >
                      <span className="mr-2">{getFileTypeIcon(file.type)}</span>
                      <span className={cn(
                        "truncate", 
                        isEntryFile(file.name) && "font-medium"
                      )}>
                        {file.name}
                      </span>
                    </button>
                    
                    {!readOnly && !isEntryFile(file.name) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.name);
                        }}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeFile ? (
            <>
              <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium">{activeFile}</span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCopyCode}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-3 w-3 mr-1" /> Copied
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-3 w-3 mr-1" /> Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex-grow font-mono text-sm overflow-hidden">
                {readOnly ? (
                  <ScrollArea className="h-full p-4">
                    <pre className="whitespace-pre-wrap break-words">
                      {getActiveFileContent()}
                    </pre>
                  </ScrollArea>
                ) : (
                  <Textarea
                    value={getActiveFileContent()}
                    onChange={(e) => handleFileContentChange(e.target.value)}
                    className="w-full h-full p-4 font-mono text-sm resize-none rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Enter your code here..."
                    spellCheck="false"
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a file to view or edit
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppFileEditor;
