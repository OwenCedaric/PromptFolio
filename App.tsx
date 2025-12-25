
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
    RiLoader4Line, 
    RiWifiOffLine, 
    RiArrowLeftSLine, 
    RiArrowRightSLine, 
    RiCloseCircleLine,
    RiLayoutGridLine,
    RiListCheck2,
    RiArrowUpDownLine
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
  const [prompts, setPrompts] = useState<PromptData[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [activePrompt, setActivePrompt] = useState<PromptData | null>(null);
  const [view, setView] = useState<string>('library');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  
  // 核心路由解析逻辑
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const topic = params.get('topic');
    const viewParam = params.get('view');
    
    if (id) setView('detail');
    else if (topic) setView('topic-detail');
    else if (viewParam === 'topics') setView('topics');
    else setView('library');
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchPrompts = async () => {
      setIsLoading(true);
      try {
          const res = await fetch('/api/prompts');
          if (res.ok) {
              const data = await res.json();
              setPrompts(data);
              
              // 初始加载时的深层链接解析
              const params = new URLSearchParams(window.location.search);
              const id = params.get('id');
              if (id) {
                  const found = data.find((p: any) => p.id === id);
                  if (found) {
                      setActivePrompt(found);
                      setView('detail');
                  }
              }
          }
      } catch (e) {
          console.error("Offline mode", e);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => { fetchPrompts(); }, []);

  // SEO 标题与 URL 同步
  useEffect(() => {
      const url = new URL(window.location.href);
      if (view === 'detail' && activePrompt) {
          document.title = `${activePrompt.title} - ${SITE_NAME}`;
          url.searchParams.set('id', activePrompt.id);
      } else if (view === 'topic-detail' && activeTopic) {
          document.title = `${activeTopic} 专题 - ${SITE_NAME}`;
          url.searchParams.set('topic', activeTopic);
      } else {
          document.title = SITE_NAME;
          url.search = '';
      }
      window.history.replaceState({}, '', url.toString());
  }, [view, activePrompt, activeTopic]);

  const processedPrompts = useMemo(() => {
      return prompts.filter(p => {
          const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
          const matchesSearch = deferredSearchQuery === '' || p.title.toLowerCase().includes(deferredSearchQuery.toLowerCase());
          return matchesCategory && matchesSearch;
      });
  }, [prompts, selectedCategory, deferredSearchQuery]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-zinc-950">
        <Sidebar 
            siteName={SITE_NAME}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => { setSelectedCategory(cat); setView('library'); }}
            onCreateNew={() => setView('editor')}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isAuthenticated={isAuthenticated}
            onLogin={() => {}} 
            onLogout={() => {}}
            isDarkMode={false} 
            onToggleTheme={() => {}}
            isCollapsed={false}
            toggleCollapse={() => {}}
            currentView={view}
            onNavigate={(v) => setView(v)}
        />

        <main className="flex-1 flex flex-col h-full min-w-0 relative">
            {view === 'library' && (
                <div className="h-full flex flex-col p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold">Prompt 库</h1>
                        <div className="flex gap-2">
                             <div className="relative">
                                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                <input 
                                    className="pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl outline-none w-64"
                                    placeholder="搜索 Prompt..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {processedPrompts.map(p => (
                            <PromptCard 
                                key={p.id} 
                                prompt={p} 
                                onClick={(p) => { setActivePrompt(p); setView('detail'); }} 
                            />
                        ))}
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
                {view === 'topics' && (
                    <TopicList 
                        topics={[]} 
                        currentPage={1} 
                        onPageChange={() => {}} 
                        onSelectTopic={(t) => { setActiveTopic(t); setView('topic-detail'); }} 
                    />
                )}
            </Suspense>
        </main>
    </div>
  );
};

export default App;
