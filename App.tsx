import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PromptCard from './components/PromptCard';
import PromptEditor from './components/PromptEditor';
import PromptDetail from './components/PromptDetail';
import { PromptData, Category, PromptStatus } from './types';
import { RiMenuLine, RiSearchLine, RiCloseLine, RiErrorWarningLine, RiLoader4Line, RiWifiOffLine, RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react';

// --- Mock Data for Fallback ---
const MOCK_PROMPTS: PromptData[] = [
  {
    id: '1',
    title: 'Cyberpunk City Description',
    description: 'Generates a vivid description of a futuristic city. Useful for sci-fi novels or game environment concepts.',
    category: Category.CREATIVE_WRITING,
    tags: ['scifi', 'environment', 'detailed'],
    status: PromptStatus.PUBLISHED,
    versions: [
      { id: 'v1', content: 'Describe a cyberpunk city.', createdAt: Date.now() - 100000, note: 'Draft' },
      { id: 'v2', content: 'Describe a neon-lit cyberpunk city with flying cars and rain-slicked streets.', createdAt: Date.now(), note: 'Refined' }
    ],
    currentVersionId: 'v2',
    updatedAt: Date.now(),
    isFavorite: true
  },
  {
      id: '2',
      title: 'Python API Boilerplate',
      description: 'FastAPI starter code with JWT auth.',
      category: Category.CODING,
      tags: ['python', 'fastapi', 'backend'],
      status: PromptStatus.DRAFT,
      versions: [
          { id: 'v1', content: 'Write a python api.', createdAt: Date.now(), note: 'Initial' }
      ],
      currentVersionId: 'v1',
      updatedAt: Date.now() - 50000,
      isFavorite: false
  }
];

// Internal Confirmation Modal Component
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800 scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                        <RiErrorWarningLine size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                        {message}
                    </p>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  // --- Config ---
  const SITE_NAME = process.env.SITE_NAME || 'PromptFolio';
  const SITE_PASSWORD = process.env.SITE_PASSWORD;
  const ITEMS_PER_PAGE = 12;

  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // If no password is configured in env, default to authenticated (public mode or dev)
    if (!SITE_PASSWORD) return true;
    // Check local storage for persistence
    return localStorage.getItem('pf_auth_session') === '1';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // --- App State ---
  const [view, setView] = useState<string>('library');
  const [prompts, setPrompts] = useState<PromptData[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [activePrompt, setActivePrompt] = useState<PromptData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Theme State ---
  // Initialize based on local storage or system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('pf_theme');
        if (saved) {
            return saved === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // --- Confirmation State ---
  const [confirmState, setConfirmState] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      action: () => void;
  }>({
      isOpen: false,
      title: '',
      message: '',
      action: () => {}
  });

  // --- Helpers ---
  const loadLocalData = () => {
      try {
          const local = localStorage.getItem('promptfolio_data');
          if (local) {
              return JSON.parse(local);
          }
      } catch (e) {
          console.error("Failed to parse local data", e);
      }
      return MOCK_PROMPTS;
  };

  const saveLocalData = (data: PromptData[]) => {
      localStorage.setItem('promptfolio_data', JSON.stringify(data));
  };

  // --- Data Fetching ---
  const fetchPrompts = async () => {
      setIsLoading(true);
      try {
          // Attempt to fetch from API
          const res = await fetch('/api/prompts');
          
          // Check if we got a JSON response. 
          const contentType = res.headers.get("content-type");
          if (res.ok && contentType && contentType.includes("application/json")) {
              const data = await res.json();
              setPrompts(data);
              setIsDemoMode(false);
          } else {
              throw new Error(`API Error: ${res.status} ${res.statusText}`);
          }
      } catch (error) {
          console.warn("Backend unavailable. Switching to Offline/Demo Mode.", error);
          setIsDemoMode(true);
          setPrompts(loadLocalData());
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      fetchPrompts();
  }, []);

  // SEO: Reset title when on library view
  useEffect(() => {
      if (view === 'library') {
          document.title = `Library | ${SITE_NAME}`;
      }
  }, [view, SITE_NAME]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('pf_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('pf_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Reset pagination when filter changes
  useEffect(() => {
      setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // --- Computed ---
  const visiblePrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchesCategory = true;
      if (selectedCategory === 'Favorites') {
          matchesCategory = !!p.isFavorite;
      } else if (selectedCategory !== 'All') {
          matchesCategory = p.category === selectedCategory;
      }
      
      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchQuery, selectedCategory]);

  // Pagination Logic
  const totalPages = Math.ceil(visiblePrompts.length / ITEMS_PER_PAGE);
  const paginatedPrompts = visiblePrompts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  // --- Actions ---
  const savePrompt = async (data: PromptData) => {
    const originalPrompts = [...prompts];
    const updatedPrompts = originalPrompts.some(p => p.id === data.id) 
        ? originalPrompts.map(p => p.id === data.id ? data : p) 
        : [data, ...originalPrompts];
    
    setPrompts(updatedPrompts);

    if (activePrompt && activePrompt.id === data.id) {
        setActivePrompt(data);
        setView('detail');
    } else {
        setView('library');
        setActivePrompt(null);
    }

    if (isDemoMode) {
        saveLocalData(updatedPrompts);
        return;
    }

    try {
        const res = await fetch('/api/prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to save");
    } catch (e) {
        console.error("Save failed, falling back to local storage", e);
        setIsDemoMode(true);
        saveLocalData(updatedPrompts);
    }
  };

  const performDeletePrompt = async (id: string) => {
      const originalPrompts = [...prompts];
      const updatedPrompts = originalPrompts.filter(p => p.id !== id);
      
      setPrompts(updatedPrompts);
      if (activePrompt && activePrompt.id === id) {
          setActivePrompt(null);
      }
      setView('library');
      setConfirmState(prev => ({ ...prev, isOpen: false }));

      if (isDemoMode) {
          saveLocalData(updatedPrompts);
          return;
      }

      try {
        const res = await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete");
      } catch (e) {
          console.error("Delete failed, falling back to local", e);
          setIsDemoMode(true);
          saveLocalData(updatedPrompts);
      }
  };

  const requestDeletePrompt = (id: string) => {
      setConfirmState({
          isOpen: true,
          title: 'Delete Prompt?',
          message: 'Are you sure you want to delete this entire prompt and all its history? This action cannot be undone.',
          action: () => performDeletePrompt(id)
      });
  };

  const toggleFavorite = async (id: string) => {
      const prompt = prompts.find(p => p.id === id);
      if (!prompt) return;

      const updatedPrompt = { ...prompt, isFavorite: !prompt.isFavorite };
      
      // Optimistic UI
      const updatedList = prompts.map(p => p.id === id ? updatedPrompt : p);
      setPrompts(updatedList);
      if (activePrompt && activePrompt.id === id) {
          setActivePrompt(updatedPrompt);
      }

      if (isDemoMode) {
          saveLocalData(updatedList);
          return;
      }

      try {
          const res = await fetch('/api/prompts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedPrompt)
          });
          if (!res.ok) throw new Error("Failed to update favorite");
      } catch (e) {
           console.error("Fav sync failed", e);
           setIsDemoMode(true);
           saveLocalData(updatedList);
      }
  };

  const handleViewChange = (newView: string) => {
      setView(newView);
      if (newView === 'library') setActivePrompt(null);
      setSidebarOpen(false);
  };

  // --- Auth Logic ---
  const handleLoginRequest = () => {
    if (!SITE_PASSWORD) {
        setIsAuthenticated(true);
        return;
    }
    setIsLoginModalOpen(true);
  };

  const submitLogin = () => {
    if (passwordInput === SITE_PASSWORD) {
        setIsAuthenticated(true);
        localStorage.setItem('pf_auth_session', '1');
        setIsLoginModalOpen(false);
        setPasswordInput('');
        setLoginError(false);
    } else {
        setLoginError(true);
    }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('pf_auth_session');
  };

  const handleCreateNew = () => {
      if (!isAuthenticated) {
          handleLoginRequest();
          return;
      }
      setActivePrompt(null);
      setView('editor');
      setSidebarOpen(false);
  };

  // --- Main Layout Render ---
  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-zinc-900 dark:text-zinc-100 relative transition-colors duration-300">
      
      {/* Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800">
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Admin Access</h3>
                    <button 
                        onClick={() => { setIsLoginModalOpen(false); setLoginError(false); setPasswordInput(''); }} 
                        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                        <RiCloseLine size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Please enter the administration password to create or edit prompts.
                    </p>
                    <div className="space-y-2">
                        <input 
                            type="password" 
                            value={passwordInput}
                            onChange={(e) => { setPasswordInput(e.target.value); setLoginError(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && submitLogin()}
                            className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border ${loginError ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-400'} rounded-lg outline-none transition-colors text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600`}
                            placeholder="Password"
                            autoFocus
                        />
                        {loginError && <p className="text-[10px] text-red-500 font-medium">Incorrect password provided.</p>}
                    </div>
                    <button 
                        onClick={submitLogin}
                        className="w-full bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-medium py-2.5 rounded-lg transition-colors text-sm"
                    >
                        Verify Identity
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
      )}

      {/* Sidebar */}
      <Sidebar 
        siteName={SITE_NAME}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => { setSelectedCategory(cat); setView('library'); if(window.innerWidth < 768) setSidebarOpen(false); }}
        onCreateNew={handleCreateNew}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAuthenticated={isAuthenticated}
        onLogin={handleLoginRequest}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-zinc-50/50 dark:bg-zinc-950/50 relative overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden h-14 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-4 sticky top-0 z-30 flex-shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="text-zinc-900 dark:text-white">
                    <RiMenuLine size={20} />
                </button>
                <span className="font-medium text-sm text-zinc-900 dark:text-white">{SITE_NAME}</span>
            </div>
        </header>

        {/* Content Switcher */}
        <div className="flex-1 overflow-hidden relative flex flex-col h-full">
            
            {/* Demo Mode Banner */}
            {isDemoMode && !isLoading && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/30 px-4 py-1.5 flex items-center justify-center gap-2 text-[11px] font-medium text-amber-700 dark:text-amber-500 shrink-0">
                    <RiWifiOffLine size={12} />
                    <span>Offline / Demo Mode</span>
                </div>
            )}

            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-3">
                    <RiLoader4Line className="animate-spin" size={32} />
                    <span className="text-sm font-medium">Loading Library...</span>
                </div>
            ) : view === 'editor' ? (
                <PromptEditor 
                    initialData={activePrompt} 
                    onSave={savePrompt} 
                    onDelete={requestDeletePrompt}
                    onCancel={() => handleViewChange(activePrompt ? 'detail' : 'library')} 
                />
            ) : view === 'detail' && activePrompt ? (
                <PromptDetail 
                    prompt={activePrompt}
                    onBack={() => handleViewChange('library')}
                    onEdit={(p) => { 
                        if (!isAuthenticated) {
                             handleLoginRequest();
                             return;
                        }
                        setActivePrompt(p); 
                        setView('editor'); 
                    }}
                    onDelete={requestDeletePrompt}
                    onToggleFavorite={toggleFavorite}
                    isAuthenticated={isAuthenticated}
                />
            ) : (
                /* Library View - Grid Scroll */
                <div className="h-full w-full overflow-y-auto scrollbar-hide">
                    <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-full flex flex-col">
                        
                        {/* Library Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 shrink-0">
                            <div>
                                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">{selectedCategory === 'All' ? 'Library' : selectedCategory}</h1>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                    {visiblePrompts.length} {visiblePrompts.length === 1 ? 'result' : 'results'}
                                </p>
                            </div>
                            
                            {/* Search */}
                            <div className="relative w-full md:w-72">
                                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-500 outline-none transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                />
                            </div>
                        </div>

                        {/* Grid */}
                        {paginatedPrompts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 mb-auto">
                                {paginatedPrompts.map(prompt => (
                                    <PromptCard 
                                        key={prompt.id} 
                                        prompt={prompt} 
                                        onClick={(p) => { setActivePrompt(p); setView('detail'); }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 text-zinc-400 dark:text-zinc-600 flex-1">
                                <p className="text-sm">No prompts found.</p>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-12 py-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <RiArrowLeftSLine size={18} />
                                    Previous
                                </button>

                                <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                    Page <span className="text-zinc-900 dark:text-white">{currentPage}</span> of <span className="text-zinc-900 dark:text-white">{totalPages}</span>
                                </div>

                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                    <RiArrowRightSLine size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;