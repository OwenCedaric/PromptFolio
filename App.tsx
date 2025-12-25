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
    RiLayoutGridLine,
    RiListCheck2,
    RiArrowUpDownLine,
    RiDownloadLine
} from '@remixicon/react';

const PromptEditor = React.lazy(() => import('./components/PromptEditor'));
const PromptDetail = React.lazy(() => import('./components/PromptDetail'));
const TopicDetail = React.lazy(() => import('./components/TopicDetail'));
const TopicList = React.lazy(() => import('./components/TopicList'));

const App: React.FC = () => {
  const SITE_NAME = "PromptFolio";
  const ITEMS_PER_PAGE = 12;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('pf_auth_token'));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  const [prompts, setPrompts] = useState<PromptData[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [activePrompt, setActivePrompt] = useState<PromptData | null>(null);
  const [view, setView] = useState('library');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('pf_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const fetchPrompts = async () => {
    setIsLoading(true);
    try {
      const headers = isAuthenticated ? { 'Authorization': `Bearer ${localStorage.getItem('pf_auth_token')}` } : {};
      const res = await fetch('/api/prompts', { headers });
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);

        // 初始化 ID 跳转
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) {
          const found = data.find((p: any) => p.id === id);
          if (found) {
            setActivePrompt(found);
            setView('detail');
          }
        }
      }
    } catch (e) {
      console.warn("API 离线");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPrompts(); }, [isAuthenticated]);

  const processedPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = !deferredSearchQuery || 
        p.title.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(deferredSearchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [prompts, selectedCategory, deferredSearchQuery]);

  const handleLogin = () => {
    localStorage.setItem('pf_auth_token', passwordInput);
    setIsAuthenticated(true);
    setIsLoginModalOpen(false);
    setPasswordInput('');
  };

  return (
    <div className="flex h-full w-full bg-zinc-50 dark:bg-zinc-950">
      {/* 登录弹窗 */}
      {isLoginModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-xs shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800">
            <h2 className="text-xl font-bold mb-4">管理员登录</h2>
            <input 
              type="password" 
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              placeholder="输入密码"
              className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-4 outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setIsLoginModalOpen(false)} className="flex-1 py-2 text-zinc-500">取消</button>
              <button onClick={handleLogin} className="flex-1 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg">登录</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <Sidebar 
        siteName={SITE_NAME}
        selectedCategory={selectedCategory}
        onSelectCategory={(c) => { setSelectedCategory(c); setView('library'); }}
        onCreateNew={() => { setActivePrompt(null); setView('editor'); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAuthenticated={isAuthenticated}
        onLogin={() => setIsLoginModalOpen(true)}
        onLogout={() => { setIsAuthenticated(false); localStorage.removeItem('pf_auth_token'); }}
        isDarkMode={isDarkMode}
        onToggleTheme={() => {
          const next = !isDarkMode;
          setIsDarkMode(next);
          document.documentElement.classList.toggle('dark', next);
          localStorage.setItem('pf_theme', next ? 'dark' : 'light');
        }}
        isCollapsed={false}
        toggleCollapse={() => {}}
        currentView={view}
        onNavigate={setView}
      />

      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {view === 'library' && (
          <div className="h-full flex flex-col">
            <header className="px-6 md:px-10 py-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-4 w-full max-w-md">
                <button className="md:hidden" onClick={() => setSidebarOpen(true)}><RiMenuLine /></button>
                <div className="relative flex-1">
                  <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="搜索提示词..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}><RiLayoutGridLine size={18} /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}><RiListCheck2 size={18} /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
                {isLoading ? [1,2,3,4].map(i => <PromptCardSkeleton key={i} />) : 
                  processedPrompts.map(p => (
                    <PromptCard 
                      key={p.id} 
                      prompt={p} 
                      onClick={(p) => { setActivePrompt(p); setView('detail'); window.history.pushState({}, '', `?id=${p.id}`); }}
                      isAuthenticated={isAuthenticated}
                      viewMode={viewMode}
                    />
                  ))
                }
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={<div className="h-full flex items-center justify-center"><RiLoader4Line className="animate-spin" /></div>}>
          {view === 'detail' && activePrompt && (
            <PromptDetail 
              prompt={activePrompt}
              onBack={() => { setView('library'); window.history.pushState({}, '', '/'); }}
              onEdit={() => setView('editor')}
              onDelete={async (id) => { /* 删除逻辑 */ }}
              onToggleFavorite={() => {}}
              isAuthenticated={isAuthenticated}
            />
          )}
          {view === 'editor' && (
            <PromptEditor 
              initialData={activePrompt}
              onSave={async (data) => {
                const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('pf_auth_token')}` };
                await fetch('/api/prompts', { method: 'POST', headers, body: JSON.stringify(data) });
                fetchPrompts();
                setView('library');
              }}
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