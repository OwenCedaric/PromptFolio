import React from 'react';
import { RiStarFill, RiDraftLine, RiLockLine } from '@remixicon/react';
import { PromptData, PromptStatus } from '../types';

interface PromptCardProps {
  prompt: PromptData;
  onClick: (prompt: PromptData) => void;
  onTagClick?: (tag: string) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onClick, onTagClick }) => {
  const currentVersion = prompt.versions.find(v => v.id === prompt.currentVersionId) || prompt.versions[prompt.versions.length - 1];
  
  // Calculate version number based on creation time
  const sortedVersions = [...prompt.versions].sort((a, b) => a.createdAt - b.createdAt);
  const versionNumber = sortedVersions.findIndex(v => v.id === currentVersion?.id) + 1;

  const isDraft = prompt.status === PromptStatus.DRAFT;
  const isPrivate = prompt.status === PromptStatus.PRIVATE;

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (onTagClick) onTagClick(tag);
  };

  return (
    <a 
      href={`/?id=${prompt.id}`}
      onClick={(e) => { e.preventDefault(); onClick(prompt); }}
      className="block group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 cursor-pointer flex flex-col h-[260px] p-5 relative hover:shadow-sm rounded-2xl overflow-hidden"
    >
      {/* Watermarks (Background Layer) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
         {isDraft ? (
            /* Draft Watermark */
            <div className="absolute -bottom-8 -right-6 text-zinc-100 dark:text-zinc-800 transform -rotate-12 transition-colors group-hover:text-zinc-200 dark:group-hover:text-zinc-700">
                <RiDraftLine size={140} />
            </div>
         ) : isPrivate ? (
            /* Private/Lock Watermark */
            <div className="absolute -bottom-6 -right-4 text-zinc-100 dark:text-zinc-800 transform -rotate-12 transition-colors group-hover:text-zinc-200 dark:group-hover:text-zinc-700">
                <RiLockLine size={120} />
            </div>
         ) : (
            /* Version Watermark */
            <div className="absolute -bottom-6 -right-2 text-[80px] font-bold text-zinc-100 dark:text-zinc-800 leading-none tracking-tighter transition-colors group-hover:text-zinc-200 dark:group-hover:text-zinc-700">
                v{versionNumber}
            </div>
         )}
      </div>

      {/* Content Layer (Foreground) */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 backdrop-blur-sm">{prompt.category}</span>
            <div className="flex gap-2">
                {prompt.isFavorite && <RiStarFill size={14} className="text-zinc-900 dark:text-zinc-100" />}
            </div>
        </div>

        <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-3 line-clamp-1 group-hover:underline decoration-zinc-300 dark:decoration-zinc-600 underline-offset-4">
            {prompt.title}
        </h3>
        
        {/* Content Bubble - Rounded Rectangle Mask (No BG/Border) */}
        <div className="flex-1 overflow-hidden relative mb-3 rounded-xl">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono leading-relaxed line-clamp-4 opacity-90">
                {currentVersion?.content || 'No content'}
            </p>
            
            {/* Gradient Fade - Fades to Card Background Color */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-zinc-900 dark:via-zinc-900/80"></div>
        </div>

        <div className="flex gap-2 overflow-hidden mt-auto">
            {prompt.tags.slice(0, 3).map(tag => (
                <span 
                    key={tag} 
                    onClick={(e) => handleTagClick(e, tag)}
                    className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-white/50 dark:bg-zinc-900/50 px-1.5 py-0.5 rounded backdrop-blur-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                    #{tag}
                </span>
            ))}
        </div>
      </div>
    </a>
  );
};

export default PromptCard;