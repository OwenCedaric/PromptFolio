
import React, { useState } from 'react';
import { RiStarFill, RiDraftLine, RiLockLine, RiFileCopyLine, RiCheckLine } from '@remixicon/react';
import { PromptData, PromptStatus } from '../types';
import { getOptimizedImageUrl } from '../utils/image';

interface PromptCardProps {
  prompt: PromptData;
  onClick: (prompt: PromptData) => void;
  onTagClick?: (tag: string) => void;
  isAuthenticated?: boolean;
  viewMode?: 'grid' | 'list';
  priority?: boolean;
}

// Skeleton Component for Loading State (Preserves Layout Stability)
export const PromptCardSkeleton: React.FC<{ viewMode?: 'grid' | 'list' }> = ({ viewMode = 'grid' }) => {
    if (viewMode === 'list') {
        return (
            <div className="flex flex-col md:flex-row bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden h-auto md:h-[200px] animate-pulse">
                <div className="w-full h-40 md:w-48 md:h-full bg-zinc-200 dark:bg-zinc-800 shrink-0"></div>
                <div className="p-5 flex flex-col flex-1 gap-3">
                    <div className="flex justify-between">
                        <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                        <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                    </div>
                    <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded mb-2"></div>
                    <div className="space-y-2 flex-1">
                        <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                        <div className="h-3 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                        <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                        <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[280px] p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
             <div className="flex justify-between items-center mb-4">
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
             </div>
             <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded mb-3"></div>
             <div className="flex-1 space-y-2 mb-3">
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
             </div>
             <div className="flex gap-2 mt-auto">
                <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
             </div>
        </div>
    );
};

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onClick, onTagClick, isAuthenticated = false, viewMode = 'grid', priority = false }) => {
  const [copied, setCopied] = useState(false);
  const currentVersion = prompt.versions.find(v => v.id === prompt.currentVersionId) || prompt.versions[prompt.versions.length - 1];
  
  // Calculate version number based on creation time
  const sortedVersions = [...prompt.versions].sort((a, b) => a.createdAt - b.createdAt);
  const versionNumber = sortedVersions.findIndex(v => v.id === currentVersion?.id) + 1;

  const isDraft = prompt.status === PromptStatus.DRAFT;
  const isPrivate = prompt.status === PromptStatus.PRIVATE;
  const isLocked = isPrivate && !isAuthenticated;

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (onTagClick) onTagClick(tag);
  };

  const handleQuickCopy = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isLocked) return;
      
      if (currentVersion?.content) {
          navigator.clipboard.writeText(currentVersion.content);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.currentTarget;
      // Fallback: If wsrv.nl fails, try original URL. If that fails, hide image.
      if (img.src.includes('wsrv.nl') && prompt.imageUrl) {
          img.src = prompt.imageUrl;
      } else {
          img.style.display = 'none';
      }
  };

  // --- Grid View Layout ---
  if (viewMode === 'grid') {
    return (
        <a 
        href={`/?id=${prompt.id}`}
        onClick={(e) => { e.preventDefault(); onClick(prompt); }}
        className="block group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-500 cursor-pointer flex flex-col h-[280px] p-5 relative hover:shadow-xl dark:hover:shadow-zinc-900/50 rounded-2xl overflow-hidden"
        aria-label={`View prompt: ${prompt.title}`}
        >
        {/* Watermarks */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
            {isDraft ? (
                <div className="absolute -bottom-8 -right-6 text-zinc-100 dark:text-zinc-800 group-hover:text-zinc-200 dark:group-hover:text-zinc-700 transition-colors duration-500 transform -rotate-12">
                    <RiDraftLine size={140} />
                </div>
            ) : isPrivate ? (
                <div className="absolute -bottom-6 -right-4 text-zinc-100 dark:text-zinc-800 group-hover:text-zinc-200 dark:group-hover:text-zinc-700 transition-colors duration-500 transform -rotate-12">
                    <RiLockLine size={120} />
                </div>
            ) : (
                <div className="absolute -bottom-6 -right-2 text-[80px] font-bold text-zinc-100 dark:text-zinc-800 group-hover:text-zinc-200 dark:group-hover:text-zinc-700 transition-colors duration-500 leading-none tracking-tighter">
                    v{versionNumber}
                </div>
            )}
        </div>

        <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-3 shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 backdrop-blur-md px-2 py-0.5 rounded-md bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50">{prompt.category}</span>
                <div className="flex gap-2">
                    {prompt.isFavorite && <RiStarFill size={14} className="text-zinc-900 dark:text-zinc-100" />}
                </div>
            </div>

            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1 group-hover:opacity-70 transition-opacity shrink-0">
                {prompt.title}
            </h3>
            
            {prompt.imageUrl && !isLocked && (
                // Added aspect-ratio to container to prevent CLS
                <div className="w-full h-32 mb-3 shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 relative isolate">
                    <img 
                        src={getOptimizedImageUrl(prompt.imageUrl, 400)} 
                        alt={prompt.title || 'Prompt Preview'} 
                        className="w-full h-full object-cover transition-all duration-700 ease-out filter saturate-[0.6] opacity-90 group-hover:saturate-100 group-hover:opacity-100 group-hover:scale-105" 
                        loading={priority ? "eager" : "lazy"}
                        fetchPriority={priority ? "high" : "auto"}
                        decoding="async"
                        width="400"
                        height="128"
                        style={{ aspectRatio: '400/128' }}
                        onError={handleImageError} 
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/10 rounded-lg pointer-events-none"></div>
                </div>
            )}

            <div className="flex-1 overflow-hidden relative mb-3 rounded-lg min-h-0">
                {isLocked ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-2 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                        <RiLockLine size={24} className="opacity-50" />
                        <span className="text-xs uppercase tracking-widest font-bold opacity-50">Private Content</span>
                    </div>
                ) : (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed opacity-90 break-words whitespace-pre-wrap">
                        {currentVersion?.content || 'No content'}
                    </p>
                )}
                
                {!isLocked && (
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-zinc-900 dark:via-zinc-900/90 pointer-events-none"></div>
                )}

                {!isLocked && (
                    <div className="absolute bottom-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-y-2 group-hover:translate-y-0">
                        <button 
                            onClick={handleQuickCopy}
                            className={`p-2 rounded-lg shadow-sm border backdrop-blur-md transition-all transform active:scale-95 ${
                                copied 
                                ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400' 
                                : 'bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                            }`}
                            title="Copy Content"
                            aria-label="Copy prompt content"
                        >
                            {copied ? <RiCheckLine size={16} /> : <RiFileCopyLine size={16} />}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mt-auto h-7 overflow-hidden w-full content-start shrink-0">
                {prompt.tags.map(tag => (
                    <span 
                        key={tag} 
                        onClick={(e) => handleTagClick(e, tag)}
                        className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/80 px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors backdrop-blur-sm shrink-0"
                    >
                        #{tag}
                    </span>
                ))}
            </div>
        </div>
        </a>
    );
  }

  // --- List View Layout ---
  const showImage = prompt.imageUrl && !isLocked;

  return (
    <a 
      href={`/?id=${prompt.id}`}
      onClick={(e) => { e.preventDefault(); onClick(prompt); }}
      className="block group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-300 cursor-pointer flex flex-col md:flex-row relative hover:shadow-lg dark:hover:shadow-zinc-900/50 rounded-2xl overflow-hidden min-h-[160px]"
      aria-label={`View prompt: ${prompt.title}`}
    >
      {/* Side Cover Image */}
      {showImage && (
           <div className="w-full h-40 md:w-48 md:h-auto shrink-0 relative bg-zinc-100 dark:bg-zinc-800 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 z-0">
                {/* 
                   Increased width from 200 to 600 for mobile list view.
                   On mobile, the card is usually full width, so image spans ~350-450px.
                   200px was causing blurriness on mobile.
                */}
                <img 
                    src={getOptimizedImageUrl(prompt.imageUrl, 600)} 
                    alt={prompt.title || 'Prompt Preview'} 
                    className="w-full h-full object-cover transition-all duration-700 ease-out filter saturate-[0.6] opacity-90 group-hover:saturate-100 group-hover:opacity-100 group-hover:scale-105 absolute inset-0" 
                    loading={priority ? "eager" : "lazy"}
                    fetchPriority={priority ? "high" : "auto"}
                    decoding="async"
                    width="600"
                    height="600"
                    onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent pointer-events-none md:bg-gradient-to-r md:from-transparent md:to-black/5"></div>
           </div>
      )}

      {/* Content Container */}
      <div className="p-5 flex flex-col flex-1 min-w-0 relative z-10">
         
         <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{prompt.category}</span>
                {prompt.isFavorite && <RiStarFill size={14} className="text-zinc-900 dark:text-zinc-100" />}
             </div>
             
             <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden md:block">
                {new Date(prompt.updatedAt).toLocaleDateString()}
             </span>
         </div>

         <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors pr-12">
            {prompt.title}
         </h3>

         <div className="flex-1 relative mb-3 min-h-0">
             <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 md:line-clamp-3 leading-relaxed opacity-90 break-words whitespace-pre-wrap">
                {isLocked ? "Content is private." : (currentVersion?.content || 'No content')}
             </p>
         </div>

         <div className="flex items-center justify-between mt-auto">
             <div className="flex flex-wrap gap-2 h-6 overflow-hidden">
                {prompt.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">#{tag}</span>
                ))}
                {prompt.tags.length > 4 && <span className="text-xs text-zinc-400 self-center">+{prompt.tags.length - 4}</span>}
             </div>

             {!isLocked && (
                <button 
                    onClick={handleQuickCopy}
                    className={`p-1.5 rounded-md transition-colors border ${
                        copied 
                        ? 'bg-green-50 border-green-200 text-green-600' 
                        : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 hover:border-zinc-200'
                    }`}
                    title="Copy"
                    aria-label="Copy prompt content"
                >
                    {copied ? <RiCheckLine size={16} /> : <RiFileCopyLine size={16} />}
                </button>
             )}
         </div>
         
         {!showImage && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-[0.03] group-hover:opacity-[0.06] transition-all duration-500 scale-75 group-hover:scale-90 origin-right">
                {isDraft ? <RiDraftLine size={120} /> : isPrivate ? <RiLockLine size={120} /> : <span className="text-8xl font-bold tracking-tighter select-none">v{versionNumber}</span>}
            </div>
         )}
      </div>
    </a>
  );
};

export default PromptCard;
