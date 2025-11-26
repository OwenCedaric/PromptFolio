import React, { useRef, useLayoutEffect, useState } from 'react';
import { PromptData } from '../types';
import { RiArrowLeftLine, RiArrowRightLine, RiEyeLine, RiFileCopyLine, RiCheckLine } from '@remixicon/react';

interface TopicDetailProps {
  topic: string;
  prompts: PromptData[];
  onBack: () => void;
  onViewDetail: (prompt: PromptData, scrollPos: number) => void;
  isAuthenticated: boolean;
  initialScrollPos?: number;
}

// Magazine Item Component
const MagazineItem = ({ prompt, index, onViewDetail }: { prompt: PromptData, index: number, onViewDetail: (p: PromptData) => void }) => {
    const currentVersion = prompt.versions.find(v => v.id === prompt.currentVersionId) || prompt.versions[prompt.versions.length - 1];
    const isEven = index % 2 === 0;
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentVersion?.content) {
            navigator.clipboard.writeText(currentVersion.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="w-full min-h-[80vh] flex flex-col md:flex-row relative group">
            
            {/* Image Section */}
            <div className={`
                relative w-full md:min-h-full flex items-center justify-center p-6 md:p-12
                ${isEven ? 'md:w-[55%] md:order-1' : 'md:w-[60%] md:order-2'}
            `}>
                 {/* Visual decoration: background line */}
                 <div className={`hidden md:block absolute top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800 ${isEven ? 'right-0' : 'left-0'}`}></div>

                 {/* Image Container - Adaptive Size */}
                 <div className="relative z-10 w-full flex justify-center">
                    {prompt.imageUrl ? (
                        <div className="relative rounded-lg overflow-hidden shadow-2xl bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/10 group-hover:scale-[1.01] transition-transform duration-700">
                            <img 
                                src={prompt.imageUrl} 
                                alt={prompt.title} 
                                // Mobile: Width full, Height auto. Desktop: Max height constrained, Width auto (preserve aspect ratio)
                                className="w-full h-auto md:w-auto md:max-w-full md:max-h-[85vh] object-contain block"
                                loading="lazy"
                            />
                        </div>
                    ) : (
                        <div className="w-full aspect-[3/4] md:max-w-md bg-zinc-100 dark:bg-zinc-900 rounded-lg flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700 shadow-inner">
                             <span className="text-8xl font-serif italic opacity-20">{index + 1}</span>
                        </div>
                    )}
                 </div>

                {/* Index / Number Watermark - Positioned creatively */}
                <div className={`
                    absolute text-[6rem] md:text-[12rem] leading-none font-serif font-black text-transparent stroke-text opacity-10 md:opacity-10 select-none pointer-events-none z-0
                    ${isEven ? '-left-2 md:-left-4 bottom-0' : '-right-2 md:-right-4 top-0'}
                `}>
                    {(index + 1).toString().padStart(2, '0')}
                </div>
            </div>

            {/* Content Section */}
            <div className={`
                relative w-full flex flex-col justify-center p-8 md:p-16 lg:p-24
                ${isEven ? 'md:w-[45%] md:order-2' : 'md:w-[40%] md:order-1'}
            `}>
                <div className="flex flex-col gap-6 md:gap-10 max-w-lg mx-auto md:mx-0">
                    
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2 block">
                            {prompt.category}
                        </span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-[1.1] text-zinc-900 dark:text-white">
                            {prompt.title}
                        </h2>
                    </div>

                    <div className="w-16 h-px bg-zinc-900 dark:bg-zinc-100 opacity-20"></div>

                    <div className="font-sans text-sm md:text-base leading-loose text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap line-clamp-[10] md:line-clamp-[15]">
                        {currentVersion?.content}
                    </div>

                    {/* Action Bar: Copy (Utility) Left, Explore (Nav) Right -> */}
                    <div className="mt-4 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between gap-4">
                         <button 
                            onClick={handleCopy}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                                copied 
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' 
                                : 'bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100'
                            }`}
                         >
                            {copied ? <RiCheckLine size={14} /> : <RiFileCopyLine size={14} />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                         </button>

                         <button 
                            onClick={() => onViewDetail(prompt)}
                            className="group/btn flex items-center gap-3 text-sm uppercase tracking-widest font-bold text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-right"
                         >
                            Explore Detail
                            <span className="bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full p-1 transition-transform duration-300 group-hover/btn:translate-x-2">
                                <RiArrowRightLine size={14} />
                            </span>
                         </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

const TopicDetail: React.FC<TopicDetailProps> = ({ topic, prompts, onBack, onViewDetail, isAuthenticated, initialScrollPos = 0 }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Restore scroll position on mount
    useLayoutEffect(() => {
        if (containerRef.current && initialScrollPos > 0) {
            containerRef.current.scrollTop = initialScrollPos;
        }
    }, [initialScrollPos]);

    const handleViewDetail = (prompt: PromptData) => {
        // Capture current scroll position before navigating away
        const currentPos = containerRef.current?.scrollTop || 0;
        onViewDetail(prompt, currentPos);
    };

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden font-sans">
            
            {/* Header / Navigation - Minimal */}
            <div className="absolute top-0 left-0 right-0 z-50 p-6 md:p-10 flex justify-between items-start pointer-events-none mix-blend-difference text-white dark:text-zinc-200">
                <button 
                    onClick={onBack}
                    className="pointer-events-auto flex items-center gap-2 group hover:opacity-70 transition-opacity"
                >
                    <div className="p-2 border border-current rounded-full transition-transform group-hover:-translate-x-1">
                        <RiArrowLeftLine size={20} />
                    </div>
                    <span className="hidden md:block font-bold tracking-wider text-sm uppercase">Back</span>
                </button>
            </div>

            {/* Scrollable Feed - No Snapping for better flow */}
            <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-hide">
                
                {/* Intro / Title Card */}
                <div className="w-full min-h-[70vh] flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 relative pb-20">
                     <div className="text-center px-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <span className="inline-block py-1 px-3 border border-zinc-300 dark:border-zinc-700 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-8">
                            Curated Collection
                        </span>
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-medium text-zinc-900 dark:text-white tracking-tight mb-8 leading-none">
                            {topic}
                        </h1>
                        <p className="text-base md:text-lg text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
                            A curated collection of {prompts.length} high-quality prompt{prompts.length !== 1 ? 's' : ''}.
                        </p>
                     </div>
                     
                     <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-40 animate-pulse">
                        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
                        <div className="w-px h-12 bg-zinc-900 dark:bg-white"></div>
                     </div>
                </div>

                {/* Prompts List with Breathing Room */}
                <div className="flex flex-col gap-24 md:gap-40 pb-32">
                    {prompts.map((p, idx) => (
                        <MagazineItem 
                            key={p.id}
                            prompt={p} 
                            index={idx} 
                            onViewDetail={handleViewDetail}
                        />
                    ))}
                </div>
                
                {/* Footer / End Mark */}
                <div className="h-40 flex items-center justify-center text-zinc-300 dark:text-zinc-800">
                    <div className="w-2 h-2 rounded-full bg-current mx-1"></div>
                    <div className="w-2 h-2 rounded-full bg-current mx-1"></div>
                    <div className="w-2 h-2 rounded-full bg-current mx-1"></div>
                </div>

            </div>
            
            <style>{`
                .stroke-text {
                    -webkit-text-stroke: 1px currentColor;
                    color: transparent;
                }
            `}</style>
        </div>
    );
};

export default TopicDetail;