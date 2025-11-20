import React, { useState, useEffect } from 'react';
import { 
    RiArrowLeftLine, 
    RiFileCopyLine, 
    RiPencilLine, 
    RiCheckLine, 
    RiStarLine, 
    RiStarFill, 
    RiTimeLine,
    RiGlobalLine,
    RiPriceTag3Line,
    RiHistoryLine,
    RiDeleteBinLine
} from '@remixicon/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PromptData, PromptStatus } from '../types';

interface PromptDetailProps {
  prompt: PromptData;
  onBack: () => void;
  onEdit: (prompt: PromptData) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isAuthenticated: boolean;
}

const PromptDetail: React.FC<PromptDetailProps> = ({ prompt, onBack, onEdit, onDelete, onToggleFavorite, isAuthenticated }) => {
  // Sort versions newest first for the dropdown
  const sortedVersions = [...prompt.versions].sort((a, b) => b.createdAt - a.createdAt);
  
  // State to track which version is currently being viewed
  const [selectedVersionId, setSelectedVersionId] = useState<string>(prompt.currentVersionId);
  const [copied, setCopied] = useState(false);

  // Update local state if prompt prop changes externally
  useEffect(() => {
      setSelectedVersionId(prompt.currentVersionId);
  }, [prompt.currentVersionId]);

  const viewedVersion = prompt.versions.find(v => v.id === selectedVersionId) || prompt.versions[prompt.versions.length - 1];

  const handleCopy = () => {
      navigator.clipboard.writeText(viewedVersion?.content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // Delegate to parent - parent now handles confirmation modal
  const handleDeletePrompt = () => {
    onDelete(prompt.id);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50/50 dark:bg-zinc-950/50 relative">
      
      {/* Global Header (Sticky) */}
      <div className="h-16 px-4 md:px-10 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-4 shrink-0">
            <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <RiArrowLeftLine size={20} />
            </button>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block"></div>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hidden md:block">Prompt Details</span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
             {isAuthenticated && (
                 <>
                    <button 
                        onClick={() => onToggleFavorite(prompt.id)} 
                        className={`p-2 rounded-full transition-colors ${prompt.isFavorite ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                        title={prompt.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        {prompt.isFavorite ? <RiStarFill size={20} /> : <RiStarLine size={20} />}
                    </button>
                    
                    <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden md:block"></div>

                    <button 
                        type="button"
                        onClick={handleDeletePrompt}
                        className="p-2 md:px-3 md:py-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                        title="Delete Entire Prompt"
                    >
                        <RiDeleteBinLine size={18} />
                        <span className="hidden md:inline text-sm font-medium">Delete</span>
                    </button>

                    <button 
                        onClick={() => onEdit(prompt)}
                        className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-all"
                    >
                        <RiPencilLine size={16} />
                        <span className="hidden md:inline">Edit Prompt</span>
                        <span className="md:hidden">Edit</span>
                    </button>
                 </>
             )}
          </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* LEFT COLUMN: Main Content (Title, Description, Prompt) */}
            <div className="lg:col-span-8 space-y-8">
                
                {/* Header Section */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            {prompt.category}
                        </span>
                        {prompt.status === PromptStatus.DRAFT && (
                             <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 border border-yellow-200/50 dark:border-yellow-800/30">
                                Draft
                            </span>
                        )}
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                            <RiTimeLine size={12} />
                            Updated {new Date(prompt.updatedAt).toLocaleDateString()}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white leading-tight">{prompt.title}</h1>
                </div>

                {/* Description (Rich Text) */}
                {prompt.description && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.02)] dark:shadow-none">
                        <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    img: ({node, ...props}) => (
                                        <div className="rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 my-4">
                                            <img {...props} className="w-full h-auto m-0" alt={props.alt || 'content'} />
                                        </div>
                                    )
                                }}
                            >
                                {prompt.description}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}

                {/* The Prompt Artifact */}
                <div className="relative">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-3">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                            <div className="w-2 h-2 bg-zinc-900 dark:bg-white rounded-full"></div>
                            Prompt Content
                        </h3>
                        
                        <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            {/* Version Selector */}
                            <div className="relative flex items-center">
                                <select 
                                    value={selectedVersionId}
                                    onChange={(e) => setSelectedVersionId(e.target.value)}
                                    className="bg-transparent text-xs font-medium text-zinc-600 dark:text-zinc-300 py-1 pl-2 pr-6 outline-none cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 appearance-none"
                                >
                                    {sortedVersions.map((v, idx) => {
                                        const originalIndex = prompt.versions.findIndex(ver => ver.id === v.id);
                                        return (
                                            <option key={v.id} value={v.id} className="dark:bg-zinc-900">
                                                v{originalIndex + 1} — {new Date(v.createdAt).toLocaleDateString()}
                                            </option>
                                        );
                                    })}
                                </select>
                                <RiHistoryLine size={12} className="text-zinc-400 dark:text-zinc-500 absolute right-2 pointer-events-none" />
                            </div>

                            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

                            <button 
                                onClick={handleCopy}
                                className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                                    copied 
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                                title="Copy content"
                            >
                                {copied ? <RiCheckLine size={14} /> : <RiFileCopyLine size={14} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>
                    
                    {/* Monospace Content Viewer - Minimalist Design */}
                    <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                        {/* Clean Metadata Header */}
                        <div className="h-8 bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800 flex items-center px-4 justify-between select-none">
                            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">PLAIN TEXT</span>
                            <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                                {viewedVersion?.content.length || 0} CHARS
                            </span>
                        </div>
                        <div className="p-6 overflow-x-auto bg-white dark:bg-zinc-900">
                            <pre className="font-mono text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words selection:bg-zinc-100 dark:selection:bg-zinc-800">
                                {viewedVersion?.content || ''}
                            </pre>
                        </div>
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN: Metadata Sidebar */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Tags Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <RiPriceTag3Line size={14} /> Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {prompt.tags.map(tag => (
                            <span key={tag} className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs px-3 py-1 rounded-full font-medium">
                                #{tag}
                            </span>
                        ))}
                        {prompt.tags.length === 0 && <span className="text-xs text-zinc-400 dark:text-zinc-600 italic">No tags added</span>}
                    </div>
                </div>

                {/* Info / Stats Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <RiGlobalLine size={14} /> Information
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase block mb-1">Category</span>
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{prompt.category}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase block mb-1">Status</span>
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">{prompt.status.toLowerCase()}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase block mb-1">Created</span>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">{new Date(prompt.versions[0].createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase block mb-1">Current Ver</span>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">v{prompt.versions.findIndex(v => v.id === prompt.currentVersionId) + 1}</span>
                        </div>
                    </div>
                </div>

            </div>

        </div>
      </div>
    </div>
  );
};

export default PromptDetail;