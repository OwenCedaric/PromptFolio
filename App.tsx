import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from './components/Sidebar';
import PromptCard from './components/PromptCard';
import PromptEditor from './components/PromptEditor';
import PromptDetail from './components/PromptDetail';
import { PromptData, Category, PromptStatus, Copyright } from './types';
import { RiMenuLine, RiSearchLine, RiCloseLine, RiErrorWarningLine, RiLoader4Line, RiWifiOffLine, RiArrowLeftSLine, RiArrowRightSLine, RiPriceTag3Line, RiCloseCircleLine } from '@remixicon/react';

// --- Mock Data for Fallback ---
const MOCK_PROMPTS: PromptData[] = [
  {
    id: '1',
    title: 'Cyberpunk City Description',
    description: 'Generates a vivid description of a futuristic city. Useful for sci-fi novels or game environment concepts.',
    category: Category.CREATIVE_WRITING,
    tags: ['scifi', 'environment', 'detailed'],
    status: PromptStatus.PUBLISHED,
    copyright: Copyright.CC_BY,
    author: 'PromptFolio Team',
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
      copyright: Copyright.MIT,
      author: 'DevUser_01',
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
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
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
              const parsed = JSON.parse(local);
              // Ensure parsed data is an array and has content
              if (Array.isArray(parsed) && parsed.length > 0) {
                  // Sanitize data to ensure required arrays exist
                  return parsed.map(p => ({
                      ...p,
                      tags: Array.isArray(p.tags) ? p.tags : [],
                      versions: Array.isArray(p.versions) ? p.versions : []
                  }));
              }
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

  // --- SEO & Title Management ---
  useEffect(() => {
      let title = SITE_NAME;
      if (view === 'detail' && activePrompt) {
          // Mask title for private prompts if unauthenticated
          if (activePrompt.status === PromptStatus.PRIVATE && !isAuthenticated) {
             title = `Protected Content | ${SITE_NAME}`;
          } else {
             title = `${activePrompt.title} | ${SITE_NAME}`;
          }
      } else if (selectedTag) {
          title = `#${selectedTag} Prompts | ${SITE_NAME}`;
      } else if (selectedCategory !== 'All') {
          title = `${selectedCategory} Prompts | ${SITE_NAME}`;
      } else if (view === 'editor') {
          title = `Editor | ${SITE_NAME}`;
      }
      document.title = title;

      // Update meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
          if (view === 'detail' && activePrompt) {
              // CRITICAL: Mask description for private prompts if not authenticated to prevent SEO leakage
              if (activePrompt.status === PromptStatus.PRIVATE && !isAuthenticated) {
                  metaDesc.setAttribute('content', 'This content is private and requires authentication to view.');
              } else {
                  metaDesc.setAttribute('content', activePrompt.description || 'A professional AI prompt managed in PromptFolio.');
              }
          } else {
              metaDesc.setAttribute('content', 'Organize, version, and optimize your AI prompts with Google Gemini integration.');
          }
      }
  }, [view, activePrompt, selectedCategory, selectedTag, isAuthenticated, SITE_NAME]);

  // --- Theme Toggle ---
  const toggleTheme = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      localStorage.setItem('pf_theme', newMode ? 'dark' : 'light');
      if (newMode) {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
      } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
      }
  };

  // --- URL Routing (Simple) ---
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      const cat = params.get('category');
      const tag = params.get('tag');

      if (id) {
          const found = prompts.find(p => p.id === id);
          if (found) {
              setActivePrompt(found);
              setView('detail');
          }
      } else if (cat) {
          setSelectedCategory(cat);
          setView('library');
      } else if (tag) {
          setSelectedTag(tag);
          setView('library');
      }
  }, [prompts]); // Run when prompts are loaded

  // --- Auth Handlers ---
  const handleLogin = () => {
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
      // Redirect to library if on a private detail page? 
      // Just keeping basic logic for now.
  };

  // --- Handlers ---
  const handleCreateNew = () => {
      setActivePrompt(null);
      setView('editor');
      setSidebarOpen(false); // Close mobile sidebar
  };

  const handleSavePrompt = async (data: PromptData) => {
      let updatedPrompts = [...prompts];
      const existingIndex = updatedPrompts.findIndex(p => p.id === data.id);
      
      if (existingIndex >= 0) {
          updatedPrompts[existingIndex] = data;
      } else {
          updatedPrompts.unshift(data);
      }
      
      setPrompts(updatedPrompts);
      saveLocalData(updatedPrompts);
      
      if (!isDemoMode) {
          try {
              await fetch('/api/prompts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
              });
          } catch (e) {
              console.error("Sync failed", e);
          }
      }
      
      setActivePrompt(data);
      setView('detail');
  };

  const handleDeletePrompt = async (id: string) => {
      setConfirmState({
          isOpen: true,
          title: 'Delete Prompt?',
          message: 'This action cannot be undone. All versions of this prompt will be permanently removed.',
          action: async () => {
              const updatedPrompts = prompts.filter(p => p.id !== id);
              setPrompts(updatedPrompts);
              saveLocalData(updatedPrompts);
              
              if (!isDemoMode) {
                  try {
                      await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
                  } catch (e) { console.error(e); }
              }

              setView('library');
              setActivePrompt(null);
              setConfirmState(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  const handleToggleFavorite = async (id: string) => {
      const p = prompts.find(x => x.id === id);
      if (!p) return;
      
      const updated = { ...p, isFavorite: !p.isFavorite, updatedAt: Date.now() };
      handleSavePrompt(updated);
  };

  const handleExport = () => {
      const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptfolio_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  // --- Filtering ---
  const filteredPrompts = useMemo(() => {
      return prompts.filter(p => {
          // Filter out private prompts if user is NOT authenticated
          // Although we hide content in cards, showing the card itself is fine unless you want total invisibility.
          // The prompt requested "partially exposed content", so showing the card with locked content is the solution.
          
          const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory || (selectedCategory === 'Favorites' && p.isFavorite);
          
          const matchesSearch = searchQuery === '' || 
              p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
              
          const matchesTag = selectedTag === null || p.tags.includes(selectedTag);

          return matchesCategory && matchesSearch && matchesTag;
      });
  }, [prompts, selectedCategory, searchQuery, selectedTag]); // Removed isAuthenticated dependency to keep list stable, but PromptCard handles internal hiding

  // Pagination Logic
  const totalPages = Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE);
  const paginatedPrompts = filteredPrompts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset pagination on filter change
  useEffect(() => {
      setCurrentPage(1);
  }, [selectedCategory, searchQuery, selectedTag]);

  // --- Render ---
  return (
    <div className="flex h-full w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        
        {/* Modals */}
        <ConfirmModal 
            {...confirmState} 
            onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))} 
            onConfirm={confirmState.action}
        />

        {/* Login Modal */}
        {isLoginModalOpen && createPortal(
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-xs p-6 ring-1 ring-zinc-200 dark:ring-zinc-800 animate-in zoom-in-95">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Admin Access</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Enter password to manage prompts.</p>
                    <input 
                        type="password"
                        autoFocus
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        placeholder="Password"
                        className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 mb-2"
                    />
                    {loginError && <p className="text-xs text-red-500 mb-2">Incorrect password</p>}
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => setIsLoginModalOpen(false)} className="flex-1 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">Cancel</button>
                        <button onClick={handleLogin} className="flex-1 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium">Login</button>
                    </div>
                </div>
             </div>,
             document.body
        )}

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )}

        <Sidebar 
            siteName={SITE_NAME}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => { setSelectedCategory(cat); setSelectedTag(null); setView('library'); setSidebarOpen(false); }}
            onCreateNew={handleCreateNew}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isAuthenticated={isAuthenticated}
            onLogin={() => setIsLoginModalOpen(true)}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onExport={handleExport}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden transition-all">
            
            {view === 'library' && (
                <div className="h-full flex flex-col">
                    {/* Top Bar */}
                    <div className="px-6 md:px-10 py-6 shrink-0 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center z-10 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-sm">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button 
                                className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <RiMenuLine size={24} />
                            </button>
                            <div className="relative flex-1 md:w-96 group">
                                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors" size={18} />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search prompts..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all shadow-sm"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900">
                                        <RiCloseCircleLine size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {selectedTag && (
                             <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Tag: #{selectedTag}</span>
                                <button onClick={() => setSelectedTag(null)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                                    <RiCloseLine size={14} />
                                </button>
                             </div>
                        )}
                    </div>
                    
                    {/* Grid Content */}
                    <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-20 scrollbar-hide">
                        {isLoading ? (
                            <div className="h-64 flex flex-col items-center justify-center text-zinc-400 animate-pulse gap-4">
                                <RiLoader4Line className="animate-spin" size={32} />
                                <span className="text-sm font-medium">Loading Library...</span>
                            </div>
                        ) : filteredPrompts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8">
                                    {paginatedPrompts.map(prompt => (
                                        <PromptCard 
                                            key={prompt.id} 
                                            prompt={prompt} 
                                            onClick={(p) => { setActivePrompt(p); setView('detail'); }}
                                            onTagClick={(t) => setSelectedTag(t)}
                                            isAuthenticated={isAuthenticated}
                                        />
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-4 mb-10">
                                        <button 
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            <RiArrowLeftSLine size={20} />
                                        </button>
                                        <span className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button 
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            <RiArrowRightSLine size={20} />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 text-zinc-400 dark:text-zinc-600">
                                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                    <RiSearchLine size={24} className="opacity-50"/>
                                </div>
                                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No prompts found</p>
                                <p className="text-sm max-w-xs text-center mt-2">Try adjusting your search terms or category filters.</p>
                                {isAuthenticated && (
                                    <button onClick={handleCreateNew} className="mt-6 text-sm font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
                                        Create a new prompt
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {isDemoMode && !isLoading && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full flex items-center gap-2 shadow-sm z-20">
                            <RiWifiOffLine size={14} />
                            <span>Demo Mode (Offline)</span>
                        </div>
                    )}
                </div>
            )}

            {view === 'detail' && activePrompt && (
                <PromptDetail 
                    prompt={activePrompt}
                    onBack={() => { setView('library'); setActivePrompt(null); }}
                    onEdit={(p) => { setView('editor'); }}
                    onDelete={handleDeletePrompt}
                    onToggleFavorite={handleToggleFavorite}
                    isAuthenticated={isAuthenticated}
                    onLogin={() => setIsLoginModalOpen(true)}
                    onTagClick={(t) => { setSelectedTag(t); setView('library'); }}
                />
            )}

            {view === 'editor' && (
                <PromptEditor 
                    initialData={activePrompt}
                    onSave={handleSavePrompt}
                    onDelete={handleDeletePrompt}
                    onCancel={() => {
                        if (activePrompt) {
                            setView('detail');
                        } else {
                            setView('library');
                        }
                    }}
                />
            )}

        </main>
    </div>
  );
};

export default App;