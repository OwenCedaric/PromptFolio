import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
    RiDeleteBinLine,
    RiFileTextLine,
    RiInformationLine,
    RiCopyrightLine,
    RiShieldCheckLine,
    RiGitCommitLine,
    RiToggleLine,
    RiLockLine,
    RiEyeLine,
    RiLoginCircleLine
} from '@remixicon/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PromptData, PromptStatus, Category, Copyright } from '../types';

interface PromptDetailProps {
  prompt: PromptData;
  onBack: () => void;
  onEdit: (prompt: PromptData) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isAuthenticated: boolean;
  onLogin?: () => void;
  onTagClick?: (tag: string) => void;
  onAuthorClick?: (author: string) => void;
}

const PromptDetail: React.FC<PromptDetailProps> = ({ prompt, onBack, onEdit, onDelete, onToggleFavorite, isAuthenticated, onLogin, onTagClick, onAuthorClick }) => {
  // Sort versions newest first for the dropdown
  const sortedVersions = [...prompt.versions].sort((a, b) => b.createdAt - a.createdAt);
  
  // State to track which version is currently being viewed
  const [selectedVersionId, setSelectedVersionId] = useState<string>(prompt.currentVersionId);
  const [copied, setCopied] = useState(false);
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'info' | 'prompt'>('info');

  // Access Control State
  const isPrivate = prompt.status === PromptStatus.PRIVATE;
  const isLocked = isPrivate && !isAuthenticated;

  // Update local state if prompt prop changes externally
  useEffect(() => {
      setSelectedVersionId(prompt.currentVersionId);
  }, [prompt.currentVersionId]);

  // Update Page Title for SEO/UX
  useEffect(() => {
      if (prompt.title) {
          document.title = `${prompt.title} | PromptFolio`;
      }
  }, [prompt.title]);

  // --- Structured Data (Schema.org) Generation ---
  const jsonLd = useMemo(() => {
    if (isLocked) return null; // Don't generate structured data for locked private prompts

    const isCoding = prompt.category === Category.CODING;
    // Use SITE_URL if available, otherwise fallback to window
    const baseUrl = process.env.SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://promptfolio.pages.dev');
    const currentUrl = typeof window !== 'undefined' ? window.location.href : `${baseUrl}/?id=${prompt.id}`;

    // Safely get dates, defaulting to now if versions/updatedAt are invalid
    const datePublished = (sortedVersions.length > 0 && sortedVersions[sortedVersions.length - 1]?.createdAt) 
        ? new Date(sortedVersions[sortedVersions.length - 1].createdAt).toISOString()
        : new Date().toISOString();
        
    const dateModified = prompt.updatedAt ? new Date(prompt.updatedAt).toISOString() : new Date().toISOString();

    // 1. Breadcrumb Schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Library",
          "item": baseUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": prompt.category,
          "item": `${baseUrl}/?category=${encodeURIComponent(prompt.category)}` // Logical linking
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": prompt.title
        }
      ]
    };

    // 2. Article/CreativeWork Schema
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": isCoding ? "TechArticle" : "CreativeWork",
      "headline": prompt.title,
      "name": prompt.title,
      "description": prompt.description || `A comprehensive ${prompt.category} prompt for AI models.`,
      "image": prompt.imageUrl ? [prompt.imageUrl] : undefined,
      "datePublished": datePublished,
      "dateModified": dateModified,
      "license": prompt.copyright && prompt.copyright !== Copyright.NONE ? prompt.copyright : undefined,
      "author": prompt.author ? {
        "@type": "Person",
        "name": prompt.author
      } : {
        "@type": "Organization",
        "name": "PromptFolio",
        "url": baseUrl
      },
      "keywords": (prompt.tags || []).join(", "),
      "genre": prompt.category,
      "version": sortedVersions.length.toString(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": currentUrl
      }
    };

    return JSON.stringify([breadcrumbSchema, articleSchema]);
  }, [prompt, sortedVersions, isLocked]);

  // --- Canonical URL ---
  const canonicalUrl = useMemo(() => {
      if (typeof window === 'undefined') return '';
      const url = new URL(window.location.href);
      return `${url.origin}/?id=${prompt.id}`;
  }, [prompt.id]);


  const viewedVersion = prompt.versions.find(v => v.id === selectedVersionId) || prompt.versions[prompt.versions.length - 1];

  const handleCopy = () => {
      navigator.clipboard.writeText(viewedVersion?.content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleDeletePrompt = () => {
    onDelete(prompt.id);
  };

  // Helper to render status badge
  const renderStatusBadge = (status: PromptStatus) => {
      switch (status) {
          case PromptStatus.PRIVATE:
              return (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500 border border-red-200/50 dark:border-red-800/30 flex items-center gap-1">
                      <RiLockLine size={12} /> Private
                  </span>
              );
          case PromptStatus.DRAFT:
               return (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 border border-yellow-200/50 dark:border-yellow-800/30 flex items-center gap-1">
                      <RiPencilLine size={12} /> Draft
                  </span>
              );
          case PromptStatus.PUBLISHED:
          default:
               return (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-500 border border-green-200/50 dark:border-green-800/30 flex items-center gap-1">
                       <RiEyeLine size={12} /> Published
                  </span>
              );
      }
  };

  // Helper to highlight variables in prompt text
  // Matches {{variable}} or [variable]
  const HighlightedContent = ({ content }: { content: string }) => {
    if (!content) return null;
    
    // Split by regex: {{...}} OR [...]
    // Capturing groups are included in the result array
    const parts = content.split(/(\{\{[^}]+\}\}|\[[^\]]+\])/g);
    
    return (
        <span>
            {parts.map((part, index) => {
                const isVariable = (part.startsWith('{{') && part.endsWith('}}')) || (part.startsWith('[') && part.endsWith(']'));
                if (isVariable) {
                    return (
                        <span key={index} className="inline-block mx-0.5 px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold border border-zinc-300 dark:border-zinc-600 text-[0.9em]">
                            {part}
                        </span>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
  };

  // Component for Locked View
  const LockedPlaceholder = ({ title, message }: { title: string, message: string }) => (
      <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400 dark:text-zinc-500">
              <RiLockLine size={24} />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">{title}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[240px] mb-5 leading-relaxed">
              {message}
          </p>
          {onLogin && (
              <button 
                onClick={onLogin}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                  <RiLoginCircleLine size={14} />
                  Admin Login
              </button>
          )}
      </div>
  );

  return (
    <article className="h-full flex flex-col bg-zinc-50/50 dark:bg-zinc-950/50 relative overflow-hidden">
      
      {/* Inject Schema.org JSON-LD into HEAD using Portal */}
      {jsonLd && createPortal(
        <script 
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLd }}
        />,
        document.head
      )}
      {/* Inject Canonical URL for Detail View */}
      {canonicalUrl && createPortal(
          <link rel="canonical" href={canonicalUrl} />,
          document.head
      )}

      {/* Main Content Layout - Two independent columns on large screens */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        {/* Header fixed outside scrollable area for mobile access */}
        <div className="lg:hidden shrink-0 px-6 pt-6 pb-4 bg-zinc-50/95 dark:bg-zinc-950/95 border-b border-zinc-200/50 dark:border-zinc-800/50 z-20 backdrop-blur-sm sticky top-0">
             <div className="flex items-center justify-between">
                 <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full transition-colors">
                    <RiArrowLeftLine size={20} />
                 </button>
                 
                 <div className="flex items-center gap-2">
                    <button 
                        onClick={() => onToggleFavorite(prompt.id)} 
                        className={`p-2 rounded-full ${prompt.isFavorite ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-400'}`}
                    >
                        {prompt.isFavorite ? <RiStarFill size={20} /> : <RiStarLine size={20} />}
                    </button>
                    {isAuthenticated && (
                        <button 
                            onClick={() => onEdit(prompt)}
                            className="text-zinc-700 dark:text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-200/50 dark:bg-zinc-800"
                        >
                            Edit
                        </button>
                    )}
                 </div>
             </div>
             <h1 className="text-xl font-bold text-zinc-900 dark:text-white mt-2 line-clamp-2">{prompt.title}</h1>
             <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                 <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 uppercase text-xs font-bold tracking-wider">{prompt.category}</span>
                 <span>•</span>
                 {prompt.author && (
                     <>
                        <button 
                            onClick={() => onAuthorClick && onAuthorClick(prompt.author!)}
                            className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline decoration-blue-300 underline-offset-2 transition-colors"
                        >
                            by {prompt.author}
                        </button>
                        <span>•</span>
                     </>
                 )}
                 <span>v{sortedVersions.findIndex(v => v.id === viewedVersion?.id) + 1}</span>
             </div>
        </div>

        <div className="h-full max-w-[1920px] mx-auto lg:grid lg:grid-cols-12 lg:divide-x lg:divide-zinc-200 dark:lg:divide-zinc-800">
            
            {/* LEFT COLUMN (58% - Approx 60%): Info, Description, Tags */}
            <section className={`lg:col-span-7 h-full flex flex-col overflow-hidden ${mobileTab === 'prompt' ? 'hidden lg:flex' : 'flex'}`}>
                
                {/* Desktop Header Area */}
                <div className="hidden lg:block shrink-0 px-10 pt-10 pb-6 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/50 z-10">
                    <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-4">
                            <button onClick={onBack} aria-label="Go Back" className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <RiArrowLeftLine size={20} />
                            </button>
                            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Prompt Details</span>
                         </div>

                         <div className="flex items-center gap-3">
                            <button 
                                onClick={() => onToggleFavorite(prompt.id)} 
                                className={`p-2 rounded-full transition-colors ${prompt.isFavorite ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                                title={prompt.isFavorite ? "Remove from favorites" : "Add to favorites"}
                            >
                                {prompt.isFavorite ? <RiStarFill size={20} /> : <RiStarLine size={20} />}
                            </button>
                            
                            {isAuthenticated && (
                                <>
                                    <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                                    <button 
                                        type="button"
                                        onClick={handleDeletePrompt}
                                        className="px-3 py-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                                        title="Delete Entire Prompt"
                                    >
                                        <RiDeleteBinLine size={18} />
                                        <span className="text-sm font-medium">Delete</span>
                                    </button>

                                    <button 
                                        onClick={() => onEdit(prompt)}
                                        className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-all"
                                    >
                                        <RiPencilLine size={16} />
                                        <span>Edit Prompt</span>
                                    </button>
                                </>
                            )}
                         </div>
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                {prompt.category}
                            </span>
                            
                            {renderStatusBadge(prompt.status)}

                            <span className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1">
                                <RiTimeLine size={12} />
                                Updated {new Date(prompt.updatedAt).toLocaleDateString()}
                            </span>
                             {prompt.author && (
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 border-l border-zinc-300 dark:border-zinc-700 pl-3">
                                    by <button 
                                        onClick={() => onAuthorClick && onAuthorClick(prompt.author!)}
                                        className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline decoration-blue-300 underline-offset-2 transition-colors"
                                    >
                                        {prompt.author}
                                    </button>
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white leading-tight line-clamp-3">{prompt.title}</h1>
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-4 md:pt-8 pb-32 lg:pb-10 space-y-8 no-scrollbar">
                    
                    {/* Cover Image (If Present) */}
                    {prompt.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-100 dark:bg-zinc-900">
                            <img 
                                src={prompt.imageUrl} 
                                alt={`${prompt.title} Cover`} 
                                className="w-full h-auto max-h-[400px] object-cover" 
                                loading="lazy"
                            />
                        </div>
                    )}

                    {/* Info Card (Expanded to Full Width) */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                        <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <RiGlobalLine size={14} /> Metadata & Rights
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-[auto_auto_1fr] gap-y-6 gap-x-8 items-start">
                            {/* Status */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs text-zinc-500 dark:text-zinc-500 uppercase font-semibold flex items-center gap-1.5">
                                    <RiToggleLine size={12}/> Status
                                </span>
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                                    {prompt.status.toLowerCase()}
                                </span>
                            </div>

                             {/* Version Count */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs text-zinc-500 dark:text-zinc-500 uppercase font-semibold flex items-center gap-1.5">
                                    <RiGitCommitLine size={12}/> History
                                </span>
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                                    {prompt.versions.length} <span className="text-zinc-400 text-xs font-normal">versions</span>
                                </span>
                            </div>

                            {/* License & Copyright - Full Width on last row */}
                            <div className="col-span-2 flex flex-col gap-1.5">
                                 <span className="text-xs text-zinc-500 dark:text-zinc-500 uppercase font-semibold flex items-center gap-1.5">
                                    {prompt.copyright && prompt.copyright !== Copyright.NONE ? <RiShieldCheckLine size={12} /> : <RiCopyrightLine size={12} />}
                                    License
                                 </span>
                                 <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug whitespace-pre-wrap">
                                    {prompt.copyright || 'None / Unspecified'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description Content - LOCKED IF PRIVATE */}
                    {isLocked ? (
                        <LockedPlaceholder 
                            title="Private Description" 
                            message="The description and context of this prompt are restricted to administrators."
                        />
                    ) : prompt.description ? (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.02)] dark:shadow-none">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                    <RiInformationLine size={14} /> Description
                                </h3>
                            </div>
                            <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        img: ({node, ...props}) => (
                                            <div className="rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 my-4 shadow-sm">
                                                <img {...props} className="w-full h-auto m-0" alt={props.alt || 'content'} />
                                            </div>
                                        ),
                                        a: ({node, ...props}) => (
                                            <a {...props} className="text-zinc-900 dark:text-zinc-100 font-medium underline decoration-zinc-300 dark:decoration-zinc-600 underline-offset-2 hover:decoration-zinc-500 dark:hover:decoration-zinc-400 transition-colors" target="_blank" rel="noopener noreferrer" />
                                        )
                                    }}
                                >
                                    {prompt.description}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm italic border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl min-h-[200px]">
                            No description provided.
                        </div>
                    )}

                    {/* Tags Card (Moved from Right Column) */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                         <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <RiPriceTag3Line size={14} /> Tags
                        </h3>
                         <div className="flex flex-wrap gap-2">
                                {prompt.tags.length > 0 ? (
                                    prompt.tags.map(tag => (
                                        <button 
                                            key={tag} 
                                            onClick={() => onTagClick && onTagClick(tag)}
                                            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors group"
                                        >
                                            #{tag}
                                        </button>
                                    ))
                                ) : (
                                    <span className="text-xs text-zinc-400 dark:text-zinc-600 italic px-1">No tags added</span>
                                )}
                        </div>
                    </div>

                </div>
            </section>

            {/* RIGHT COLUMN (42% - Approx 40%): Prompt Content */}
            <section className={`lg:col-span-5 h-full bg-zinc-50 dark:bg-zinc-950/50 px-4 md:px-8 py-6 md:py-8 flex flex-col overflow-hidden ${mobileTab === 'info' ? 'hidden lg:flex' : 'flex'}`}>
                <div className="flex flex-col h-full">
                    
                    {/* Header for Prompt Column */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-3 shrink-0">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                            <div className="w-2 h-2 bg-zinc-900 dark:bg-white rounded-full"></div>
                            Prompt Content
                        </h3>
                        
                        {!isLocked && (
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
                                                <option key={v.id} value={v.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
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
                        )}
                    </div>
                    
                    {/* Content Viewer - LOCKED IF PRIVATE */}
                    {isLocked ? (
                        <div className="flex-1 flex flex-col">
                            <LockedPlaceholder 
                                title="Private Prompt" 
                                message="The prompt content is hidden. Please login to view the source code."
                            />
                        </div>
                    ) : (
                        <div className="flex-1 group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                            <div className="h-8 bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800 flex items-center px-4 justify-between select-none shrink-0">
                                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">SOURCE</span>
                                <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
                                    {viewedVersion?.content.length || 0} CHARS
                                </span>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-zinc-900 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
                                <pre className="font-mono text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words selection:bg-zinc-200 dark:selection:bg-zinc-700">
                                    <HighlightedContent content={viewedVersion?.content || ''} />
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </section>

        </div>
      </div>

      {/* Mobile Floating Navigation (Tabs) */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-[env(safe-area-inset-bottom)]">
        <div className="bg-zinc-900/90 dark:bg-zinc-800/90 backdrop-blur-md text-white p-1.5 rounded-full flex shadow-2xl border border-white/10 dark:border-black/10">
             <button 
                onClick={() => setMobileTab('info')}
                className={`px-6 py-2.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all ${
                    mobileTab === 'info' 
                    ? 'bg-white text-black shadow-sm scale-105' 
                    : 'text-zinc-400 hover:text-white'
                }`}
             >
                <RiInformationLine size={16} />
                Info
             </button>
             <button 
                onClick={() => setMobileTab('prompt')}
                className={`px-6 py-2.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all ${
                    mobileTab === 'prompt' 
                    ? 'bg-white text-black shadow-sm scale-105' 
                    : 'text-zinc-400 hover:text-white'
                }`}
             >
                <RiFileTextLine size={16} />
                Prompt
             </button>
        </div>
      </nav>

    </article>
  );
};

export default PromptDetail;