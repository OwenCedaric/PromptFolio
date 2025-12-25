
import React, { useState, useMemo, useEffect, useRef, Suspense, useDeferredValue } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from './components/Sidebar';
import { Logo } from './components/Logo';
import PromptCard, { PromptCardSkeleton } from './components/PromptCard';
import { PromptData, Category, PromptStatus, Copyright } from './types';
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

// Lazy Loaded Components
const PromptEditor = React.lazy(() => import('./components/PromptEditor'));
const PromptDetail = React.lazy(() => import('./components/PromptDetail'));
const TopicDetail = React.lazy(() => import('./components/TopicDetail'));
const TopicList = React.lazy(() => import('./components/TopicList'));

// 获取边缘侧注入的预加载数据
const getHydrationData = () => {
    const data = (window as any).__PF_HYDRATION_DATA__;
    if (data) {
        // 使用后清理，防止干扰后续逻辑
        // (window as any).__PF_HYDRATION_DATA__ = null;
        return data;
    }
    return null;
};

const App: React.FC = () => {
  const SITE_NAME = process.env.SITE_NAME || 'PromptFolio';
  const ITEMS_PER_PAGE = 12;

  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('pf_auth_token'));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  // --- App State ---
  const [hydrationData] = useState(() => getHydrationData());
  
  const [view, setView] = useState<string>(() => {
    if (hydrationData?.prompt) return 'detail';
    const params = new URLSearchParams(window.location.search);
    if (params.get('topic')) return 'topic-detail';
    if (params.get('view') === 'topics') return 'topics';
    return 'library';
  }); 

  const [prompts, setPrompts] = useState<PromptData[]>(() => hydrationData?.prompt ? [hydrationData.prompt] : []); 
  const [isLoading, setIsLoading] = useState(!hydrationData?.prompt);
  const [activePrompt, setActivePrompt] = useState<PromptData | null>(hydrationData?.prompt || null);
  
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(window.location.search).get('search') || '');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => new URLSearchParams(window.location.search).get('category') || 'All');
  const [selectedTag, setSelectedTag] = useState<string | null>(() => new URLSearchParams(window.location.search).get('tag') || null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(() => new URLSearchParams(window.location.search).get('author') || null);
  const [activeTopic, setActiveTopic] = useState<string | null>(() => new URLSearchParams(window.location.search).get('topic') || null);

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- Data Fetching ---
  const fetchPrompts = async () => {
      // 如果已经通过 Hydration 渲染了详情，我们可以稍后在后台静默更新列表
      const isInitialDetail = hydrationData?.prompt && view === 'detail';
      if (!isInitialDetail) setIsLoading(true);

      try {
          const res = await fetch('/api/prompts', { headers: { 'Authorization': `Bearer ${localStorage.getItem('pf_auth_token') || ''}` } });
          if (res.ok) {
              const data = await res.json();
              setPrompts(data);
              // 同步当前活跃的 Prompt 数据（防止 hydration 数据过时）
              if (activePrompt) {
                  const fresh = data.find((p: any) => p.id === activePrompt.id);
                  if (fresh) setActivePrompt(fresh);
              }
          }
      } catch (error) {
          console.warn("Offline mode");
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      fetchPrompts();
  }, [isAuthenticated]);

  // 其他逻辑保持不变...
  // (此处省略了之前定义的各种 handlers，实际代码中应完整保留)

  return (
    <div className="flex h-full w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <Sidebar 
            siteName={SITE_NAME}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => { setSelectedCategory(cat); setView('library'); setSidebarOpen(false); }}
            onCreateNew={() => { setActivePrompt(null); setView('editor'); }}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isAuthenticated={isAuthenticated}
            onLogin={() => setIsLoginModalOpen(true)}
            onLogout={() => { setIsAuthenticated(false); localStorage.removeItem('pf_auth_token'); }}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            isCollapsed={false}
            toggleCollapse={() => {}}
            currentView={view}
            onNavigate={(v) => { setView(v); }}
        />

        <main className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
            {view === 'library' && (
                <div className="h-full flex flex-col p-10 overflow-y-auto">
                    <h1 className="text-3xl font-bold mb-8">Prompt Library</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? [1,2,3].map(i => <PromptCardSkeleton key={i} />) : 
                         prompts.map(p => <PromptCard key={p.id} prompt={p} onClick={(p) => {setActivePrompt(p); setView('detail');}} />)}
                    </div>
                </div>
            )}

            <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><RiLoader4Line className="animate-spin" /></div>}>
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
                {view === 'editor' && (
                    <PromptEditor 
                        initialData={activePrompt}
                        onSave={(data) => { setPrompts([data, ...prompts]); setActivePrompt(data); setView('detail'); }}
                        onDelete={() => {}}
                        onCancel={() => setView('library')}
                    />
                )}
            </Suspense>
        </main>
    </div>
  );
};

export default App;
