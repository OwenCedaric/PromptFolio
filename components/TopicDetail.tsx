import React from 'react';
import { PromptData } from '../types';
import { RiArrowLeftLine } from '@remixicon/react';

interface TopicDetailProps {
  topic: string;
  prompts: PromptData[];
  onBack: () => void;
  onEdit: (prompt: PromptData) => void;
  isAuthenticated: boolean;
}

// Magazine Item Component
const MagazineItem = ({ prompt, index, onEdit, isAuthenticated }: { prompt: PromptData, index: number, onEdit: (p: PromptData) => void, isAuthenticated: boolean }) => {
    const currentVersion = prompt.versions.find(v => v.id === prompt.currentVersionId) || prompt.versions[prompt.versions.length - 1];
    const isEven = index % 2 === 0;

    return (
        <div className="w-full min-h-screen flex flex-col md:flex-row relative group">
            
            {/* Image Section */}
            <div className={`
                relative h-[50vh] md:h-screen w-full
                ${isEven ? 'md:w-[60%] md:order-1' : 'md:w-[65%] md:order-2'}
                bg-zinc-100 dark:bg-black overflow-hidden flex items-center justify-center
            `}>
                 {prompt.imageUrl ? (
                    <>
                        {/* Blurred Background for ambiance */}
                        <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110 pointer-events-none" style={{ backgroundImage: `url(${prompt.imageUrl})` }}></div>
                        <img 
                            src={prompt.imageUrl} 
                            alt={prompt.title} 
                            className="relative w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
                            loading="lazy"
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700">
                         <span className="text-8xl font-serif italic opacity-20">{index + 1}</span>
                    </div>
                )}

                {/* Index / Number Watermark */}
                <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 text-[10rem] md:text-[14rem] leading-none font-serif font-black text-white mix-blend-overlay opacity-50 select-none pointer-events-none">
                    {(index + 1).toString().padStart(2, '0')}
                </div>
            </div>

            {/* Content Section */}
            <div className={`
                relative w-full md:min-h-screen bg-white dark:bg-zinc-950 flex flex-col justify-center p-8 md:p-16 lg:p-24
                ${isEven ? 'md:w-[40%] md:order-2 border-l border-zinc-100 dark:border-zinc-900' : 'md:w-[35%] md:order-1 border-r border-zinc-100 dark:border-zinc-900'}
            `}>
                <div className="flex flex-col gap-8 max-w-xl mx-auto">
                    
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-tight text-zinc-900 dark:text-white">
                        {prompt.title}
                    </h2>

                    <div className="w-12 h-1 bg-zinc-900 dark:bg-zinc-100"></div>

                    <div className="font-sans text-sm md:text-base leading-loose text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                        {currentVersion?.content}
                    </div>

                    {isAuthenticated && (
                        <div className="mt-4 pt-6 border-t border-zinc-100 dark:border-zinc-900">
                             <button 
                                onClick={() => onEdit(prompt)}
                                className="text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                             >
                                Edit Prompt
                             </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

const TopicDetail: React.FC<TopicDetailProps> = ({ topic, prompts, onBack, onEdit, isAuthenticated }) => {
    
    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden font-sans">
            
            {/* Header / Navigation */}
            <div className="absolute top-0 left-0 right-0 z-50 p-6 md:p-8 flex justify-between items-start pointer-events-none">
                <button 
                    onClick={onBack}
                    className="pointer-events-auto p-3 bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/40 backdrop-blur-md rounded-full text-zinc-900 dark:text-white transition-all transform hover:scale-105 border border-white/20 shadow-sm"
                >
                    <RiArrowLeftLine size={24} />
                </button>
                
                <div className="pointer-events-auto bg-white/80 dark:bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-zinc-200 dark:border-zinc-800/50 shadow-sm">
                     <span className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                        Topic: {topic}
                     </span>
                </div>
            </div>

            {/* Scrollable Feed */}
            <div className="flex-1 overflow-y-auto scrollbar-hide snap-y snap-mandatory">
                
                {/* Intro / Title Card */}
                <div className="w-full h-[60vh] md:h-[80vh] flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 snap-start relative">
                     <div className="text-center px-4">
                        <span className="block text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-600 mb-6">
                            Collection
                        </span>
                        <h1 className="text-5xl md:text-7xl lg:text-9xl font-serif font-light text-zinc-900 dark:text-white tracking-tight mb-8">
                            {topic}
                        </h1>
                        <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                            A curated selection of {prompts.length} prompt{prompts.length !== 1 ? 's' : ''} tailored for {topic.toLowerCase()}.
                        </p>
                     </div>
                     
                     <div className="absolute bottom-10 animate-bounce text-zinc-400">
                        <span className="text-xs uppercase tracking-widest">Scroll</span>
                     </div>
                </div>

                {/* Prompts List */}
                {prompts.map((p, idx) => (
                    <div key={p.id} className="snap-start">
                        <MagazineItem 
                            prompt={p} 
                            index={idx} 
                            onEdit={onEdit} 
                            isAuthenticated={isAuthenticated}
                        />
                    </div>
                ))}
                
                {/* Footer Spacer */}
                <div className="h-32 bg-white dark:bg-zinc-950 snap-start flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                </div>

            </div>
        </div>
    );
};

export default TopicDetail;