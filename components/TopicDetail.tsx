import React, { useRef, useLayoutEffect } from 'react';
import { PromptData } from '../types';
import { RiArrowLeftLine, RiArrowRightLine, RiEyeLine } from '@remixicon/react';

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

    return (
        <div className="w-full min-h-[90vh] flex flex-col md:flex-row relative group">
            
            {/* Image Section */}
            <div className={`
                relative h-[50vh] md:h-auto w-full
                ${isEven ? 'md:w-[55%] md:order-1' : 'md:w-[60%] md:order-2'}
                overflow-hidden flex items-center justify-center
            `}>
                 {/* Visual decoration: extended background line */}
                 <div className={`hidden md:block absolute top-10 bottom-10 w-px bg-zinc-200 dark:bg-zinc-800 ${isEven ? 'right-0' : 'left-0'}`}></div>

                 <div className="relative w-full h-full md:h-[90%] md:w-[90%] overflow-hidden rounded-none md:rounded-sm">
                    {prompt.imageUrl ? (
                        <>
                            <img 
                                src={prompt.imageUrl} 
                                alt={prompt.title} 
                                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                                loading="lazy"
                            />
                        </>
                    ) : (
                        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700">
                             <span className="text-8xl font-serif italic opacity-20">{index + 1}</span>
                        </div>
                    )}
                 </div>

                {/* Index / Number Watermark - Positioned creatively */}
                <div className={`
                    absolute text-[8rem] md:text-[12rem] leading-none font-serif font-black text-transparent stroke-text opacity-10 md:opacity-20 select-none pointer-events-none z-10
                    ${isEven ? '-left-4 md:-left-12 bottom-0' : '-right-4 md:-right-12 top-0'}
                `}>
                    {(index + 1).toString().padStart(2, '0')}
                </div>
            </div>

            {/* Content Section */}
            <div className={`
                relative w-full md:min-h-[90vh] flex flex-col justify-center p-8 md:p-16 lg:p-24
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

                    <div className="mt-2 pt-4">
                         <button 
                            onClick={() => onViewDetail(prompt)}
                            className="group/btn flex items-center gap-3 text-sm uppercase tracking-widest font-bold text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
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