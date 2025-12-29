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
    RiUser3Line
} from '@remixicon/react';

// Lazy Components
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

  // --- Auth & Mode ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('pf_auth_token'));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  // --- Navigation ---
  const [view, setView] = useState<string>('library'); 
  const [activePrompt, setActivePrompt] = useState<PromptData | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  
  const [prompts, setPrompts] = useState<PromptData[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  
  // View/UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('pf_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // --- Actions ---
  const handleLogin = () => {
      localStorage.setItem('pf_auth_token', passwordInput);
      setIsAuthenticated(true);
      setIsLoginModalOpen(false);
      setPasswordInput('');
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('pf_auth_token');
      setView('library');
  };

  const fetchPrompts = async () => {
      setIsLoading(true);
      try {
          const headers = isAuthenticated ? { 'Authorization': `Bearer ${localStorage.getItem('pf_auth_token')}` } : {};
          const res = await fetch('/api/prompts', { headers });
          if (res.ok) {
              const data = await res.json();
              setPrompts(data);
              
              // Deep link check
              const params = new URLSearchParams(window.location.search);
              const id = params.get('id');
              const topic = params.get('topic');
              if (id) {
                  const found = data.find((p: PromptData) => p.id === id);
                  if (found) { setActivePrompt(found); setView('detail'); }
              } else if (topic) {
                  setActiveTopic(topic); setView('topic-detail');
              }
          }
      } catch (error) {
          console.error("Fetch error", error);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => { fetchPrompts(); }, [isAuthenticated]);

  const processedPrompts = useMemo(() => {
      return prompts.filter(p => {
          const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory || (selectedCategory === 'Favorites' && p.isFavorite);
          const q = deferredSearchQuery.toLowerCase();
          const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q));
          const matchesTag = !selectedTag || p.tags.includes(selectedTag);
          return matchesCategory && matchesSearch && matchesTag;
      }).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [prompts, selectedCategory, deferredSearchQuery, selectedTag]);

  const paginatedPrompts = processedPrompts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex h-full w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        
        {isLoginModalOpen && createPortal(
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-xs ring-1 ring-zinc-200 dark:ring-zinc-800">
                    <h2 className="text-xl font-bold mb-4">Management Access</h2>
                    <input 
                        type="password" autoFocus value={passwordInput} 
                        onChange={(e) => setPasswordInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        placeholder="Admin Password"
                        className="w-full p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg outline-none mb-4"
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setIsLoginModalOpen(false)} className="flex-1 py-2 text-zinc-500">Cancel</button>
                        <button onClick={handleLogin} className="flex-1 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg">Login</button>
                    </div>
                </div>
             </div>, document.body
        )}

        <Sidebar 
            siteName={SITE_NAME}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => { setSelectedCategory(cat); setView('library'); setCurrentPage(1); setSidebarOpen(false); }}
            onCreateNew={() => { setView('editor'); setSidebarOpen(false); }}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isAuthenticated={isAuthenticated}
            onLogin={() => setIsLoginModalOpen(true)}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            currentView={view}
            onNavigate={(v) => { setView(v); setSidebarOpen(false); }}
        />

        <main className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
            {view === 'library' && (
                <div className="h-full flex flex-col">
                    <div className="sticky top-0 z-20 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-200/50 dark:border-zinc-800/50 px-6 py-4">
                        <div className="flex items-center justify-between gap-4">
                             <div className="flex items-center gap-3 flex-1 max-w-md">
                                <button className="md:hidden p-2" onClick={() => setSidebarOpen(true)}><RiMenuLine /></button>
                                <div className="relative flex-1">
                                    <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <input 
                                        type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Browse prompts..."
                                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none"
                                    />
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-zinc-200 dark:bg-zinc-800' : 'text-zinc-400'}`}><RiLayoutGridLine size={18}/></button>
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-zinc-200 dark:bg-zinc-800' : 'text-zinc-400'}`}><RiListCheck2 size={18}/></button>
                             </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => <PromptCardSkeleton key={i} viewMode={viewMode} />)}
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6" : "space-y-4 max-w-4xl mx-auto"}>
                                {paginatedPrompts.map(p => (
                                    <PromptCard key={p.id} prompt={p} onClick={(p) => { setActivePrompt(p); setView('detail'); }} viewMode={viewMode} isAuthenticated={isAuthenticated} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Suspense fallback={<LoadingOverlay />}>
                {view === 'detail' && activePrompt && (
                    <PromptDetail 
                        prompt={activePrompt} onBack={() => setView('library')} 
                        onEdit={() => setView('editor')} isAuthenticated={isAuthenticated}
                        onToggleFavorite={() => {}} onDelete={() => {}}
                    />
                )}
                {view === 'topics' && <TopicList topics={[]} currentPage={1} onPageChange={() => {}} onSelectTopic={(t) => { setActiveTopic(t); setView('topic-detail'); }} />}
                {view === 'topic-detail' && activeTopic && <TopicDetail topic={activeTopic} prompts={prompts.filter(p => p.topic === activeTopic)} onBack={() => setView('topics')} onViewDetail={(p) => { setActivePrompt(p); setView('detail'); }} isAuthenticated={isAuthenticated} />}
                {view === 'editor' && isAuthenticated && <PromptEditor initialData={activePrompt} onSave={() => { fetchPrompts(); setView('library'); }} onDelete={() => {}} onCancel={() => setView('library')} />}
            </Suspense>
        </main>
    </div>
  );
};

export default App;