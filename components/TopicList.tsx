import React, { useRef, useEffect } from 'react';
import { RiArrowRightLine, RiPriceTag3Line, RiMenuLine, RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react';
import { getOptimizedImageUrl } from '../utils/image';

interface TopicListProps {
  topics: { name: string; count: number; previewImage?: string }[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelectTopic: (topic: string) => void;
  onOpenSidebar?: () => void;
}

// Helper for stable pagination range generation (Fixed 7 slots logic)
const getPaginationRange = (currentPage: number, totalPages: number) => {
    const siblingCount = 1;
    const totalNumbers = 2 * siblingCount + 3; // 5
    const totalBlocks = totalNumbers + 2; // 7

    if (totalPages <= totalBlocks) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
        let leftItemCount = 3 + 2 * siblingCount;
        let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
        let rightItemCount = 3 + 2 * siblingCount;
        let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
        return [firstPageIndex, '...', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
        let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
        return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
    }
    
    return [];
};

const TopicList: React.FC<TopicListProps> = ({ topics, currentPage, onPageChange, onSelectTopic, onOpenSidebar }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const ITEMS_PER_PAGE = 12;

    const totalPages = Math.ceil(topics.length / ITEMS_PER_PAGE);
    const paginatedTopics = topics.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Reset pagination if topics count changes significantly (optional safety)
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            onPageChange(1);
        }
    }, [topics.length, totalPages]);

    // Scroll to top on page change
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden shrink-0 px-6 pt-6 pb-2 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 z-10">
                 <button 
                    onClick={onOpenSidebar}
                    className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full transition-colors"
                    aria-label="Open Sidebar"
                >
                    <RiMenuLine size={24} />
                </button>
            </div>

            <div ref={contentRef} className="flex-1 p-6 md:p-10 pt-2 md:pt-10 overflow-y-auto scrollbar-hide">
                <div className="max-w-7xl mx-auto flex flex-col min-h-full">
                    <div className="mb-10 shrink-0">
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
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {paginatedTopics.map((topic) => (
                                    <button 
                                        key={topic.name}
                                        onClick={() => onSelectTopic(topic.name)}
                                        className="group relative aspect-[4/3] md:aspect-[16/9] lg:aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 text-left transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl transform-gpu"
                                        style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
                                    >
                                        {topic.previewImage ? (
                                            <img 
                                                src={getOptimizedImageUrl(topic.previewImage, 600)} 
                                                alt={topic.name} 
                                                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out filter saturate-[0.6] opacity-90 group-hover:saturate-100 group-hover:opacity-100 group-hover:scale-105"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 opacity-50"></div>
                                        )}
                                        
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                                            <span className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Collection</span>
                                            <h3 className="text-2xl md:text-3xl font-serif font-medium text-white mb-2">
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

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex flex-wrap justify-center items-center gap-1 md:gap-2 py-6 mt-auto select-none w-full shrink-0">
                                    <button 
                                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Previous Page"
                                    >
                                        <RiArrowLeftSLine size={20} />
                                    </button>
                                    
                                    <div className="flex flex-wrap justify-center items-center gap-1">
                                        {getPaginationRange(currentPage, totalPages).map((page, idx) => (
                                            page === '...' ? (
                                                <span key={`dots-${idx}`} className="w-8 text-center text-xs text-zinc-400">...</span>
                                            ) : (
                                                <button
                                                    key={`page-${page}`}
                                                    onClick={() => onPageChange(Number(page))}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                                                        currentPage === page 
                                                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm' 
                                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        ))}
                                    </div>

                                    <button 
                                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Next Page"
                                    >
                                        <RiArrowRightSLine size={20} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopicList;