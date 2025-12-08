import React, { useRef, useLayoutEffect, useState, useMemo } from 'react';
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

    // Advanced Asymmetric Border Radius Logic
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

    return (
        <div className="w-full min-h-[80vh] flex flex-col md:flex-row relative group overflow-hidden">
            
            {/* Image Section */}
            <div className={`
                relative w-full md:min-h-full flex items-center justify-center p-6 md:p-12
                ${isEven ? 'md:w-[55%] md:order-1' : 'md:w-[60%] md:order-2'}
            `}>
                 <div className={`hidden md:block absolute top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800 ${isEven ? 'right-0' : 'left-0'}`}></div>

                 <div className="relative z-10 w-full flex justify-center">
                    {prompt.imageUrl ? (
                        <div className={`relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-900/5 dark:ring-white/10 group-hover:scale-[1.01] transition-transform duration-700 shadow-[8px_8px_0px_0px_rgba(24,24,27,0.1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.15)] ${shapeClass}`}>
                            <img 
                                src={prompt.imageUrl} 
                                alt={prompt.title} 
                                className="w-full h-auto md:w-auto md:max-w-full md:max-h-[85vh] object-contain block"
                                loading="lazy"
                                decoding="async"
                            />
                        </div>
                    ) : (
                        <div className={`w-full aspect-[3/4] md:max-w-md bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700 shadow-inner ${shapeClass}`}>
                             <span className="text-8xl font-serif italic opacity-20">{index + 1}</span>
                        </div>
                    )}
                 </div>

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

    // Get Cover Image (Last available)
    const coverImage = useMemo(() => {
        return [...prompts].reverse().find(p => p.imageUrl)?.imageUrl;
    }, [prompts]);

    useLayoutEffect(() => {
        if (containerRef.current && initialScrollPos > 0) {
            containerRef.current.scrollTop = initialScrollPos;
        }
    }, [initialScrollPos]);

    const handleViewDetail = (prompt: PromptData) => {
        const currentPos = containerRef.current?.scrollTop || 0;
        onViewDetail(prompt, currentPos);
    };

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden font-sans">
            
            {/* Sticky Navigation Area (Transparent) */}
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

            <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                
                {/* 
                    HERO: Swiss Design / Editorial Split Cover
                    Design:
                    - Full viewport height
                    - Right side: A large architectural container (Arch/Panel) that crops the image consistently
                    - Left side: Heavy typography that layers slightly over the image
                    - Texture: Noise overlay for print quality
                */}
                <div className="relative w-full min-h-[90vh] lg:h-dvh flex flex-col lg:flex-row bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
                    
                    {/* Texture Overlay (Grain) */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-20 mix-blend-overlay" 
                         style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                    </div>

                    {/* 1. Typography Column (Left) */}
                    <div className="w-full lg:w-1/2 flex flex-col justify-end p-6 md:p-12 lg:p-20 relative z-10 order-2 lg:order-1 pb-20 lg:pb-24">
                        <div className="animate-in slide-in-from-left-4 duration-700 fade-in">
                            <span className="inline-block py-1 px-3 border border-zinc-900 dark:border-zinc-100 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6 text-zinc-900 dark:text-zinc-100">
                                Issue No. {prompts.length}
                            </span>
                            
                            {/* Title with mix-blend-difference to ensure visibility if it overlaps */}
                            <h1 className="text-6xl md:text-8xl lg:text-[7rem] xl:text-[9rem] font-serif font-medium leading-[0.85] tracking-tighter text-zinc-900 dark:text-zinc-100 mb-6 break-words lg:-mr-32 relative z-20">
                                {topic}
                            </h1>
                            
                            <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                                A curated collection of {prompts.length} high-quality prompt{prompts.length !== 1 ? 's' : ''}.
                                Explore the nuances of prompt engineering.
                            </p>
                        </div>
                    </div>

                    {/* 2. Visual Column (Right) - Architectural Crop */}
                    <div className="w-full lg:w-1/2 h-[50vh] lg:h-full relative order-1 lg:order-2 p-4 lg:p-6 flex items-end justify-center lg:justify-end">
                        
                        {/* The Container - Arch Shape or Rounded Panel */}
                        {/* This forces any image ratio into a consistent vertical design element */}
                        <div className="relative w-full lg:w-[90%] h-full lg:h-[95%] bg-zinc-200 dark:bg-zinc-800 rounded-t-[4rem] lg:rounded-t-full rounded-b-[2rem] lg:rounded-b-none overflow-hidden shadow-2xl shadow-zinc-900/10 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/5">
                            
                            {coverImage ? (
                                <>
                                    <img 
                                        src={coverImage} 
                                        alt="Cover"
                                        // object-cover ensures it fills the arch. object-center focuses on the middle.
                                        className="w-full h-full object-cover object-center scale-105 hover:scale-100 transition-transform duration-[2s] ease-out"
                                    />
                                    {/* Cinematic Gradient Overlay inside the arch */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 via-transparent to-transparent mix-blend-multiply"></div>
                                </>
                            ) : (
                                /* Fallback Geometric Pattern if no image */
                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-zinc-950"></div>
                                    <span className="font-serif text-[20rem] text-zinc-800 leading-none select-none opacity-50 italic">
                                        {topic.charAt(0)}
                                    </span>
                                </div>
                            )}

                            {/* Floating Metadata Tag inside the image */}
                            <div className="absolute bottom-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hidden lg:block">
                                Visual Collection
                            </div>
                        </div>

                    </div>
                </div>

                {/* Prompts List */}
                <div className="flex flex-col gap-24 md:gap-40 pb-32 pt-24 bg-white dark:bg-zinc-950 relative z-10">
                    {prompts.map((p, idx) => (
                        <MagazineItem 
                            key={p.id}
                            prompt={p} 
                            index={idx} 
                            onViewDetail={handleViewDetail}
                        />
                    ))}
                </div>
                
                {/* Footer */}
                <div className="min-h-[30vh] flex flex-col justify-center px-8 md:px-24 pb-20 pt-20 relative overflow-hidden bg-white dark:bg-zinc-950 z-10">
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