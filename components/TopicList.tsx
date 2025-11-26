import React from 'react';
import { PromptData } from '../types';
import { RiArrowRightLine, RiPriceTag3Line } from '@remixicon/react';

interface TopicListProps {
  topics: { name: string; count: number; previewImage?: string }[];
  onSelectTopic: (topic: string) => void;
}

const TopicList: React.FC<TopicListProps> = ({ topics, onSelectTopic }) => {
    return (
        <div className="w-full h-full p-6 md:p-10 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Topics</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Curated collections of prompts grouped by theme.</p>
                </div>

                {topics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50">
                        <RiPriceTag3Line size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" />
                        <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400">No Topics Found</h3>
                        <p className="text-sm text-zinc-400 dark:text-zinc-600 mt-1">Edit a prompt and add a Topic to see it here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topics.map((topic) => (
                            <button 
                                key={topic.name}
                                onClick={() => onSelectTopic(topic.name)}
                                className="group relative aspect-[4/3] md:aspect-[16/9] lg:aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 text-left transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
                            >
                                {topic.previewImage ? (
                                    <img 
                                        src={topic.previewImage} 
                                        alt={topic.name} 
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-60"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 opacity-50"></div>
                                )}
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                                    <span className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Collection</span>
                                    <h3 className="text-2xl md:text-3xl font-serif font-medium text-white mb-2 group-hover:underline decoration-1 underline-offset-4 decoration-white/50">
                                        {topic.name}
                                    </h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm font-medium text-white/80 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                            {topic.count} Prompts
                                        </span>
                                        <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                            <RiArrowRightLine size={16} />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopicList;