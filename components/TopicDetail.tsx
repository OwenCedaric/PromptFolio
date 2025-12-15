
import React, { useRef, useLayoutEffect, useState, useMemo } from 'react';
import { PromptData } from '../types';
import { RiArrowLeftLine, RiArrowRightLine, RiEyeLine, RiFileCopyLine, RiCheckLine } from '@remixicon/react';
import { getOptimizedImageUrl } from '../utils/image';

interface TopicDetailProps {
  topic: string;
  prompts: PromptData[];
  onBack: () => void;
  onViewDetail: (prompt: PromptData, scrollPos: number) => void;
  isAuthenticated: boolean;
  initialScrollPos?: number;
}

interface MagazineItemProps {
  prompt: PromptData;
  index: number;
  onViewDetail: (p: PromptData) => void;
}

// Magazine Item Component
const MagazineItem: React.FC<MagazineItemProps> = ({ prompt, index, onViewDetail }) => {
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

    // Advanced Asymmetric Border Radius Logic (4-step cycle)
    const getShapeClass = (idx: number) => {
        const mod = idx % 4;
        switch (mod) {
            case 0: return 'rounded-tl-[4rem] rounded-br-[4rem] rounded-tr-none rounded-bl-none';
            case 1: return 'rounded-tr-[4rem] rounded-bl-[4rem] rounded-tl-none rounded-br-none';
            case 2: return 'rounded-l-[4rem] rounded-r-none';
            case 3: return 'rounded-r-[4rem] rounded-l-none';
            default: return 'rounded-none';
        }
    };

    const shapeClass = getShapeClass(index);

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const img = e.currentTarget;
        if (img.src.includes('wsrv.nl') && prompt.imageUrl) {
            img.src = prompt.imageUrl;
        } else {
            img.style.display = 'none';
        }
    };

    return (
        <div className="w-full min-h-[80vh] flex flex-col md:flex-row relative group overflow-hidden">
            
            {/* Image Section */}
            <div className={`
                relative w-full md:min-h-full flex items-center justify-center p-6 md:p-12
                ${isEven ? 'md:w-[55%] md:order-1' : 'md:w-[60%] md:order-2'}
            `}>
                 {/* Visual decoration: background line */}
                 <div className={`hidden md:block absolute top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800 ${isEven ? 'right-0' : 'left-0'}`}></div>

                 {/* Image Container - Adaptive Size with Asymmetric Shape */}
                 <div className="relative z-10 w-full flex justify-center">
                    {prompt.imageUrl ? (
                        <div className={`relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/10 group-hover:scale-[1.01] transition-transform duration-700 shadow-[8px_8px_0px_0px_rgba(24,24,27,0.1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.15)] ${shapeClass}`}>
                            <img 
                                src={getOptimizedImageUrl(prompt.imageUrl, 800)} 
                                alt={prompt.title} 
                                // Mobile: Width full, Height auto. Desktop: Max height constrained, Width auto (preserve aspect ratio)
                                className="w-full h-auto md:w-auto md:max-w-full md:max-h-[85vh] object-contain block"
                                loading="lazy"
                                decoding="async"
                                width="800"
                                height="600" // Approximate aspect ratio placeholder
                                onError={handleImageError}
                            />
                        </div>
                    ) : (
                        <div className={`w-full aspect-[3/4] md:max-w-md bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700 shadow-inner ${shapeClass}`}>
                             <span className="text-8xl font-serif italic opacity-20">{index + 1}</span>
                        </div>
                    )}
                 </div>

                {/* Index / Number Watermark */}
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

                    {/* Action Bar */}
                    <div className="mt-4 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between gap-4">
                         <button 
                            onClick={handleCopy}
                            aria-label="Copy prompt content"
                            className={`flex items-center gap-2 px-4 py-3 md:py-2 rounded-full border text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
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
                            aria-label="View details"
                            className="group/btn flex items-center gap-3 text-sm uppercase tracking-widest font-bold text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-right p-2"
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

    // Determine Cover Image
    const coverImage = useMemo(() => {
        return [...prompts].reverse().find(p => p.imageUrl)?.imageUrl;
    }, [prompts]);

    // Restore scroll position on mount
    useLayoutEffect(() => {
        if (containerRef.current && initialScrollPos > 0) {
            containerRef.current.scrollTop = initialScrollPos;
        }
    }, [initialScrollPos]);

    const handleViewDetail = (prompt: PromptData) => {
        const currentPos = containerRef.current?.scrollTop || 0;
        onViewDetail(prompt, currentPos);
    };

    const handleCoverError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const img = e.currentTarget;
        if (img.src.includes('wsrv.nl') && coverImage) {
            img.src = coverImage;
        } else {
            img.style.display = 'none';
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden font-sans">
            
            {/* Header / Navigation - Minimal */}
            <div className="absolute top-0 left-0 right-0 z-50 p-6 md:p-10 flex justify-between items-start pointer-events-none mix-blend-difference text-white dark:text-zinc-200">
                <button 
                    onClick={onBack}
                    aria-label="Go Back"
                    className="pointer-events-auto flex items-center gap-2 group hover:opacity-70 transition-opacity p-2"
                >
                    <div className="p-2 border border-current rounded-full transition-transform group-hover:-translate-x-1">
                        <RiArrowLeftLine size={20} />
                    </div>
                    <span className="hidden md:block font-bold tracking-wider text-sm uppercase">Back</span>
                </button>
            </div>

            {/* Scrollable Feed */}
            <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                
                {/* Intro / Title Card - Cinematic Cover Design */}
                <div className={`
                    w-full flex flex-col items-center justify-center relative pb-10 md:pb-20 overflow-hidden transition-all duration-700
                    ${coverImage ? 'min-h-[70vh] md:min-h-[85vh] bg-zinc-900' : 'min-h-[50vh] md:min-h-[60vh] bg-zinc-50 dark:bg-zinc-950'}
                `}>
                     {/* Dynamic Background Cover */}
                     {coverImage && (
                        <div className="absolute inset-0 z-0 select-none pointer-events-none">
                            <img 
                                src={getOptimizedImageUrl(coverImage, 1200)} 
                                alt={`${topic} Collection Cover`} 
                                className="w-full h-full object-cover opacity-60 scale-105 animate-in fade-in duration-[1.5s]"
                                loading="eager"
                                fetchPriority="high"
                                decoding="async"
                                onError={handleCoverError}
                            />
                            {/* Cinematic Overlays */}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/50 to-transparent"></div>
                            <div className="absolute inset-0 bg-black/10 mix-blend-multiply"></div>
                        </div>
                     )}

                     <div className="relative z-10 text-center px-4 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <span className={`
                            inline-block py-1 px-3 border rounded-full text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6 md:mb-8 backdrop-blur-none bg-white/10 transition-colors
                            ${coverImage 
                                ? 'border-white/30 text-white/90' 
                                : 'border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}
                        `}>
                            Curated Collection
                        </span>
                        
                        <h1 className={`
                            text-6xl md:text-8xl lg:text-[9rem] font-serif font-medium tracking-tight mb-6 md:mb-8 leading-[0.9] transition-colors
                            ${coverImage ? 'text-white drop-shadow-2xl' : 'text-zinc-900 dark:text-white'}
                        `}>
                            {topic}
                        </h1>
                        
                        <p className={`
                            text-base md:text-xl max-w-lg mx-auto leading-relaxed font-light transition-colors
                            ${coverImage ? 'text-zinc-200 drop-shadow-md' : 'text-zinc-500 dark:text-zinc-400'}
                        `}>
                            A curated collection of {prompts.length} high-quality prompt{prompts.length !== 1 ? 's' : ''}.
                        </p>
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
                <div className="min-h-[30vh] flex flex-col justify-center px-8 md:px-24 pb-20 pt-20 relative overflow-hidden">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800 mb-12"></div>
                    
                    <div className="flex flex-col md:flex-row items-end md:items-start justify-between gap-10">
                        
                        <div className="hidden md:block">
                            <span className="font-serif text-9xl text-zinc-100 dark:text-zinc-900 leading-none select-none">
                                Fin.
                            </span>
                        </div>

                        <div className="flex flex-col items-end text-right">
                             <div className="flex items-center gap-4 mb-4">
                                 <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Collection Complete</span>
                                 <div className="w-12 h-px bg-zinc-400"></div>
                             </div>
                             
                             <p className="text-lg md:text-xl font-serif text-zinc-900 dark:text-zinc-100 max-w-md mb-8 leading-snug">
                                You have viewed all {prompts.length} prompts in <span className="italic">{topic}</span>.
                             </p>

                             <button 
                                onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                                aria-label="Back to top"
                                className="group flex items-center gap-3 px-6 py-3 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                            >
                                Back to Top
                                <RiArrowRightLine size={14} className="-rotate-90 group-hover:-translate-y-1 transition-transform" />
                            </button>
                        </div>
                    </div>
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
