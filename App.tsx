
import React, { useState, useMemo, useEffect, useRef, Suspense, useDeferredValue } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from './components/Sidebar';
import { Logo } from './components/Logo';
import PromptCard, { PromptCardSkeleton } from './components/PromptCard';
import { PromptData, Category, PromptStatus } from './types';
import { 
    RiMenuLine, 
    RiSearchLine, 
    RiCloseLine, 
    RiErrorWarningLine, 
    RiLoader4Line, 
    RiWifiOffLine, 
    RiArrowLeftSLine, 
    RiArrowRightSLine, 
    RiCloseCircleLine,
    RiLayoutGridLine,
    RiListCheck2,
    RiArrowUpDownLine,
    RiUser3Line,
    RiDownloadLine,
    RiFileTextLine
} from '@remixicon/react';

const PromptEditor = React.lazy(() => import('./components/PromptEditor'));
const PromptDetail = React.lazy(() => import('./components/PromptDetail'));
const TopicDetail = React.lazy(() => import('./components/TopicDetail'));
const TopicList = React.lazy(() => import('./components/TopicList'));

const LoadingOverlay = () => (
    <div className="h-full w-full flex items-center justify-center text-zinc-400">
        <RiLoader4Line className="animate-spin" size={32} />
    </div>
);

const App: React.FC = () => {
  const SITE_NAME = process.env.SITE_NAME || 'PromptFolio';
  const ITEMS_PER_PAGE = 12;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('pf_auth_token'));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [view, setView] = useState<string>('library'); 
  const [prompts, setPrompts] = useState<PromptData[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [activePrompt, setActivePrompt] = useState<PromptData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- Initial Data Load & Routing ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const topic = params.get('topic');
    const category = params.get('category');
    const page = params.get('page');
    
    if (page) setCurrentPage(parseInt(page));
    if (category) setSelectedCategory(category);

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/prompts');
            if (res.ok) {
                const data = await res.json();
                setPrompts(data);
                if (id) {
                    const found = data.find((p: any) => p.id === id);
                    if (found) { setActivePrompt(found); setView('detail'); }
                } else if (topic) {
                    setActiveTopic(topic); setView('topic-detail');
                }
            }
        } catch (e) { setIsDemoMode(true); }
        finally { setIsLoading(false); }
    };
    load();
  }, []);

  // --- SEO & URL Sync ---
  useEffect(() => {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    params.delete('id'); params.delete('topic'); params.delete('category'); params.delete('page');

    if (view === 'detail' && activePrompt) params.set('id', activePrompt.id);
    else if (view === 'topic-detail' && activeTopic) params.set('topic', activeTopic);
    else if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (currentPage > 1) params.set('page', currentPage.toString());

    const newSearch = params.toString() ? `?${params.toString()}` : '';
    if (window.location.search !== newSearch) {
        window.history.pushState({}, '', newSearch || window.location.pathname);
    }

    // Canonical link handling for current view
    let canonical = window.location.origin + window.location.pathname;
    if (view === 'detail' && activePrompt) canonical += `?id=${activePrompt.id}`;
    else if (selectedCategory !== 'All') canonical += `?category=${encodeURIComponent(selectedCategory)}`;
    
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
    }
    link.setAttribute('href', canonical);
  }, [view, activePrompt, activeTopic, selectedCategory, currentPage]);

  const processedPrompts = useMemo(() => {
    let result = prompts.filter(p => {
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory || (selectedCategory === 'Favorites' && p.isFavorite);
        const matchesSearch = deferredSearchQuery === '' || p.title.toLowerCase().includes(deferredSearchQuery.toLowerCase());
        const matchesTag = !selectedTag || p.tags.includes(selectedTag);
        const matchesAuthor = !selectedAuthor || p.author === selectedAuthor;
        return matchesCategory && matchesSearch && matchesTag && matchesAuthor;
    });
    return result.sort((a, b) => sortOrder === 'newest' ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt);
  }, [prompts, selectedCategory, deferredSearchQuery, selectedTag, selectedAuthor, sortOrder]);

  const paginatedPrompts = processedPrompts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleResetHome = () => {
    setSelectedCategory('All'); setSelectedTag(null); setSelectedAuthor(null);
    setSearchQuery(''); setCurrentPage(1); setView('library'); setActivePrompt(null);
  };

  return (
    <div className={`flex h-full w-full overflow-hidden ${isDarkMode ? 'dark bg-zinc-950' : 'bg-zinc-50'}`}>
        <Sidebar 
            siteName={SITE_NAME}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => { setSelectedCategory(cat); setView('library'); setCurrentPage(1); }}
            onCreateNew={() => { setActivePrompt(null); setView('editor'); }}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isAuthenticated={isAuthenticated}
            onLogin={() => setIsLoginModalOpen(true)}
            onLogout={() => { setIsAuthenticated(false); localStorage.removeItem('pf_auth_token'); }}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onLogoClick={handleResetHome}
            currentView={view}
            onNavigate={setView}
        />

        <main className="flex-1 flex flex-col h-full min-w-0 relative">
            {view === 'library' && (
                <div className="h-full flex flex-col">
                    <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button className="md:hidden" onClick={() => setSidebarOpen(true)}><RiMenuLine size={24}/></button>
                            <div className="relative">
                                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/>
                                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm outline-none"/>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}><RiLayoutGridLine size={20}/></button>
                            <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}><RiListCheck2 size={20}/></button>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                            {paginatedPrompts.map(p => (
                                <PromptCard key={p.id} prompt={p} onClick={p => { setActivePrompt(p); setView('detail'); }} isAuthenticated={isAuthenticated} viewMode={viewMode}/>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <Suspense fallback={<LoadingOverlay />}>
                {view === 'detail' && activePrompt && (
                    <PromptDetail 
                        prompt={activePrompt}
                        onBack={() => setView('library')}
                        onEdit={() => setView('editor')}
                        onDelete={() => {}} 
                        onToggleFavorite={() => {}}
                        isAuthenticated={isAuthenticated}
                    />
                )}
            </Suspense>
        </main>
    </div>
  );
};

export default App;
