import React, { useState } from 'react';
import { PromptData } from '../types';
import { RiArrowLeftLine, RiFileCopyLine, RiCheckLine, RiPencilLine, RiEyeLine } from '@remixicon/react';

interface TopicDetailProps {
  prompt: PromptData;
  onBack: () => void;
  onEdit: (prompt: PromptData) => void;
  isAuthenticated: boolean;
}

const TopicDetail: React.FC<TopicDetailProps> = ({ prompt, onBack, onEdit, isAuthenticated }) => {
    const [copied, setCopied] = useState(false);
    const currentVersion = prompt.versions.find(v => v.id === prompt.currentVersionId) || prompt.versions[prompt.versions.length - 1];
    
    const handleCopy = () => {
        navigator.clipboard.writeText(currentVersion?.content || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col lg:flex-row overflow-hidden font-sans">
            
            {/* Left: Image / Visual Area (Asymmetric Large Side) */}
            <div className="relative h-[40vh] lg:h-full lg:flex-[1.8] xl:flex-[2.2] bg-zinc-100 dark:bg-black overflow-hidden flex items-center justify-center group">
                {/* Back Button Overlay */}
                <button 
                    onClick={onBack}
                    className="absolute top-6 left-6 z-20 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-105"
                >
                    <RiArrowLeftLine size={24} />
                </button>

                {prompt.imageUrl ? (
                    <>
                        <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110 pointer-events-none" style={{ backgroundImage: `url(${prompt.imageUrl})` }}></div>
                        <img 
                            src={prompt.imageUrl} 
                            alt={prompt.title} 
                            className="relative max-w-[90%] max-h-[90%] w-auto h-auto object-contain shadow-2xl dark:shadow-black/80 lg:group-hover:scale-[1.01] transition-transform duration-700 ease-out"
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700">
                        <span className="text-6xl font-serif italic font-light opacity-50">Visuals</span>
                    </div>
                )}
            </div>

            {/* Right: Content / Editorial Area */}
            <div className="h-auto flex-1 bg-white dark:bg-zinc-950 flex flex-col border-l border-zinc-100 dark:border-zinc-900 relative">
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 md:px-12 py-12 md:py-20 scrollbar-hide">
                    
                    {/* Topic Label */}
                    <div className="mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-100">
                        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                            {prompt.topic || 'Featured Topic'}
                        </span>
                    </div>

                    {/* Editorial Title */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium leading-[1.1] text-zinc-900 dark:text-white mb-10 animate-in slide-in-from-bottom-6 duration-700 delay-200">
                        {prompt.title}
                    </h1>

                    {/* Divider with Controls */}
                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-6 mb-8 animate-in fade-in duration-700 delay-300">
                         <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
                            PROMPT SOURCE
                         </div>
                         <div className="flex gap-2">
                             {isAuthenticated && (
                                <button onClick={() => onEdit(prompt)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors" title="Edit">
                                    <RiPencilLine size={16} />
                                </button>
                             )}
                             <button onClick={handleCopy} className={`p-2 transition-colors ${copied ? 'text-green-500' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`} title="Copy">
                                 {copied ? <RiCheckLine size={16} /> : <RiFileCopyLine size={16} />}
                             </button>
                         </div>
                    </div>

                    {/* Prompt Content */}
                    <div className="font-sans text-sm md:text-base leading-loose text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap animate-in slide-in-from-bottom-4 duration-700 delay-300">
                        {currentVersion?.content}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TopicDetail;