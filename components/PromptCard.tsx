import React, { useState } from 'react';
import { RiStarFill, RiDraftLine, RiLockLine, RiFileCopyLine, RiCheckLine } from '@remixicon/react';
import { PromptData, PromptStatus } from '../types';

interface PromptCardProps {
  prompt: PromptData;
  onClick: (prompt: PromptData) => void;
  onTagClick?: (tag: string) => void;
  isAuthenticated?: boolean;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onClick, onTagClick, isAuthenticated = false }) => {
  const [copied, setCopied] = useState(false);
  const currentVersion = prompt.versions.find(v => v.id === prompt.currentVersionId) || prompt.versions[prompt.versions.length - 1];
  
  // Calculate version number based on creation time
  const sortedVersions = [...prompt.versions].sort((a, b) => a.createdAt - b.createdAt);
  const versionNumber = sortedVersions.findIndex(v => v.id === currentVersion?.id) + 1;

  const isDraft = prompt.status === PromptStatus.DRAFT;
  const isPrivate = prompt.status === PromptStatus.PRIVATE;
  
  // CRITICAL SECURITY: Content is strictly locked if it's private AND user is NOT authenticated.
  const isLocked = isPrivate && !isAuthenticated;

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (onTagClick) onTagClick(tag);
  };

  const handleQuickCopy = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Do not allow copy if locked
      if (isLocked) return;
      
      if (currentVersion?.content) {
          navigator.clipboard.writeText(currentVersion.content);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  return (
    <a 
      href={`/?id=${prompt.id}`}
      onClick={(e) => { e.preventDefault(); onClick(prompt); }}
      className="block group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-300 cursor-pointer flex flex-col h-[280px] p-5 relative hover:shadow-lg dark:hover:shadow-zinc-900/50 rounded-2xl overflow-hidden"
    >
      {/* Watermarks (Background Layer) */}
      {/* Updated to use specific zinc colors for clearer visibility without transparency issues */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
         {isDraft ? (
            /* Draft Watermark */
            <div className="absolute -bottom-8 -right-6 text-zinc-100 dark:text-zinc-800 group-hover:text-zinc-200 dark:group-hover:text-zinc-700 transition-colors duration-500 transform -rotate-12">
                <RiDraftLine size={140} />
            </div>
         ) : isPrivate ? (
            /* Private/Lock Watermark */
            <div className="absolute -bottom-6 -right-4 text-zinc-100 dark:text-zinc-800 group-hover:text-zinc-200 dark:group-hover:text-zinc-700 transition-colors duration-500 transform -rotate-12">
                <RiLockLine size={120} />
            </div>
         ) : (
            /* Version Watermark */
            <div className="absolute -bottom-6 -right-2 text-[80px] font-bold text-zinc-100 dark:text-zinc-800 group-hover:text-zinc-200 dark:group-hover:text-zinc-700 transition-colors duration-500 leading-none tracking-tighter">
                v{versionNumber}
            </div>
         )}
      </div>

      {/* Content Layer (Foreground) */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 backdrop-blur-md px-2 py-0.5 rounded-md bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50">{prompt.category}</span>
            <div className="flex gap-2">
                {prompt.isFavorite && <RiStarFill size={14} className="text-zinc-900 dark:text-zinc-100" />}
            </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1 group-hover:opacity-70 transition-opacity shrink-0">
            {prompt.title}
        </h3>
        
        {/* Cover Image (Optional) - Minimalist Grayscale to Color Transition */}
        {prompt.imageUrl && !isLocked && (
            <div className="w-full h-32 mb-3 shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 relative">
                <img 
                    src={prompt.imageUrl} 
                    alt={prompt.title} 
                    className="w-full h-full object-cover transition-all duration-500 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105" 
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                />
            </div>
        )}

        {/* Content Bubble - Natural Flow with Optimized Gradient Mask */}
        <div className="flex-1 overflow-hidden relative mb-3 rounded-lg min-h-0">
            {isLocked ? (
                /* SECURITY: Render a placeholder instead of the content. The content is NOT in the DOM. */
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-2 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                     <RiLockLine size={24} className="opacity-50" />
                     <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Private Content</span>
                </div>
            ) : (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed opacity-90 break-words whitespace-pre-wrap">
                    {currentVersion?.content || 'No content'}
                </p>
            )}
            
            {/* Gradient Fade (Only if not locked and has content) */}
            {!isLocked && (
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-zinc-900 dark:via-zinc-900/90 pointer-events-none"></div>
            )}

            {/* Quick Copy Button (Appears on Hover) - Only if not locked */}
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
                    >
                        {copied ? <RiCheckLine size={16} /> : <RiFileCopyLine size={16} />}
                    </button>
                </div>
            )}
        </div>

        {/* Tags - Flex Wrap with Height Limit */}
        <div className="flex flex-wrap gap-2 mt-auto h-7 overflow-hidden w-full content-start shrink-0">
            {prompt.tags.map(tag => (
                <span 
                    key={tag} 
                    onClick={(e) => handleTagClick(e, tag)}
                    className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/80 px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors backdrop-blur-sm shrink-0"
                >
                    #{tag}
                </span>
            ))}
            {prompt.tags.length === 0 && (
                 <span className="text-[10px] text-zinc-300 dark:text-zinc-700 italic px-1">No tags</span>
            )}
        </div>
      </div>
    </a>
  );
};

export default PromptCard;