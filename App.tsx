import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Sidebar, { Logo } from './components/Sidebar';
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

// Lazy Loaded Components to split bundle size
const PromptEditor = React.lazy(() => import('./components/PromptEditor'));
const PromptDetail = React.lazy(() => import('./components/PromptDetail'));
const TopicDetail = React.lazy(() => import('./components/TopicDetail'));
const TopicList = React.lazy(() => import('./components/TopicList'));

// Loading Fallback Overlay
const LoadingOverlay = () => (
    <div className="h-full w-full flex items-center justify-center text-zinc-400">
        <RiLoader4Line className="animate-spin" size={32} />
    </div>
);

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

// Internal Export Modal Component
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (scope: 'all' | 'author' | 'category' | 'topic' | 'tag', value: string) => void;
  authors: string[];
  topics: string[];
  tags: string[];
  categories: string[];
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, authors, topics, tags, categories }) => {
    const [scope, setScope] = useState<'all' | 'author' | 'category' | 'topic' | 'tag'>('all');
    const [selection, setSelection] = useState('');
    
    // Reset selection when scope changes
    useEffect(() => { setSelection(''); }, [scope]);

    if (!isOpen) return null;

    const renderSelect = (options: string[], placeholder: string) => (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <select 
                value={selection}
                onChange={(e) => setSelection(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow appearance-none text-zinc-900 dark:text-zinc-100"
            >
                <option value="">{placeholder}</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );

    const scopeOptions = [
        { id: 'all', label: 'All Prompts' },
        { id: 'category', label: 'By Category' },
        { id: 'topic', label: 'By Topic' },
        { id: 'tag', label: 'By Tag' },
        { id: 'author', label: 'By Author' },
    ] as const;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                 <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <RiDownloadLine size={20} /> Export Backup
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <RiCloseLine size={20}/>
                    </button>
                 </div>
                 
                 <div className="p-6 overflow-y-auto">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 block">Export Scope</label>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        {scopeOptions.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setScope(opt.id)}
                                className={`px-3 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                                    scope === opt.id
                                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm'
                                    : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {scope !== 'all' && (
                        <div className="mb-6 min-h-[70px]">
                             <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">
                                Select {scope.charAt(0).toUpperCase() + scope.slice(1)}
                             </label>
                             {scope === 'author' && renderSelect(authors, "Select an Author...")}
                             {scope === 'category' && renderSelect(categories, "Select a Category...")}
                             {scope === 'topic' && renderSelect(topics, "Select a Topic...")}
                             {scope === 'tag' && renderSelect(tags, "Select a Tag...")}
                        </div>
                    )}

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 flex gap-3">
                        <div className="p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md h-fit">
                            <RiFileTextLine size={18} className="text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-1">Markdown Format (.md)</h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                Generates a portable document containing Titles and the latest Version content of your selected prompts.
                            </p>
                        </div>
                    </div>
                 </div>

                 <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                     <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
                     <button 
                        onClick={() => onExport(scope, selection)}
                        disabled={scope !== 'all' && !selection}
                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                     >
                        <RiDownloadLine size={16} />
                        Download
                     </button>
                 </div>
            </div>
        </div>
    );
};

// Helper for stable pagination range generation (Fixed 7 slots logic)
const getPaginationRange = (currentPage: number, totalPages: number) => {
    const siblingCount = 1;
    const totalNumbers = 2 * siblingCount + 3; // 5
    const totalBlocks = totalNumbers + 2; // 7 (1 + ... + current-1 + current + current+1 + ... + total)

    if (totalPages <= totalBlocks) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    // We show dots if there are more than 1 page number to be hidden
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Case 1: Show right dots only (Start of list)
    if (!shouldShowLeftDots && shouldShowRightDots) {
        let leftItemCount = 3 + 2 * siblingCount;
        let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, '...', totalPages];
    }

    // Case 2: Show left dots only (End of list)
    if (shouldShowLeftDots && !shouldShowRightDots) {
        let rightItemCount = 3 + 2 * siblingCount;
        let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
        return [firstPageIndex, '...', ...rightRange];
    }

    // Case 3: Show both dots (Middle of list)
    if (shouldShowLeftDots && shouldShowRightDots) {
        let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
        return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
    }
    
    return [];
};

const App: React.FC = () => {
  // --- Config ---
  const SITE_NAME = process.env.SITE_NAME || 'PromptFolio';
  const ENV_SITE_PASSWORD = process.env.SITE_PASSWORD; // Used for client-side fallback check
  const ITEMS_PER_PAGE = 12;

  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check for token presence
    return !!localStorage.getItem('pf_auth_token');
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // --- App State ---
  // Initialize Active Topic from URL if present
  const [activeTopic, setActiveTopic] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
        return new URLSearchParams(window.location.search).get('topic') || null;
    }
    return null;
  });

  // Track scroll position of the Topic Detail view to restore it when returning from Prompt Detail
  const [topicScrollPos, setTopicScrollPos] = useState(0);

  // Initialize View based on URL params
  const [view, setView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        // Note: 'id' (Prompt Detail) is handled via fetchPrompts for data availability, 
        // but Topics can be initialized immediately.
        if (params.get('topic')) return 'topic-detail';
        if (params.get('view') === 'topics') return 'topics';
    }
    return 'library';
  }); 

  // Navigation History tracking
  const [lastView, setLastView] = useState<string | null>(null);
  const [lastActiveTopic, setLastActiveTopic] = useState<string | null>(null);

  const [prompts, setPrompts] = useState<PromptData[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [activePrompt, setActivePrompt] = useState<PromptData | null>(null);
  
  // Filter & Search State
  // Initialize Search Query from URL
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
        return new URLSearchParams(window.location.search).get('search') || '';
    }
    return '';
  });
  
  // Lazy initialize filters from URL to prevent race conditions causing redirects
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
        return new URLSearchParams(window.location.search).get('category') || 'All';
    }
    return 'All';
  });

  const [selectedTag, setSelectedTag] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
        return new URLSearchParams(window.location.search).get('tag') || null;
    }
    return null;
  });

  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
        return new URLSearchParams(window.location.search).get('author') || null;
    }
    return null;
  });

  // Capture initial deep link ID to survive initial URL syncs
  const initialIdRef = useRef<string | null>(
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null
  );
  
  // Layout & Sort State
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('pf_view_mode');
          return (saved === 'list' || saved === 'grid') ? saved : 'grid';
      }
      return 'grid';
  });

  // Persist viewMode changes
  useEffect(() => {
      localStorage.setItem('pf_view_mode', viewMode);
  }, [viewMode]);
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Pagination State - Initialized from URL for SEO
  // Shared by both Library and TopicList views
  const [currentPage, setCurrentPage] = useState(() => {
      if (typeof window !== 'undefined') {
          const p = new URLSearchParams(window.location.search).get('page');
          return p ? parseInt(p) : 1;
      }
      return 1;
  });

  // Ref to track first render to prevent overwriting URL pagination on mount
  const isFirstRender = useRef(true);

  const contentRef = useRef<HTMLDivElement>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // --- Theme State ---
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
              if (Array.isArray(parsed) && parsed.length > 0) {
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
      return [];
  };

  const saveLocalData = (data: PromptData[]) => {
      localStorage.setItem('promptfolio_data', JSON.stringify(data));
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('pf_auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // --- Navigation & Reset Handlers ---
  const handleResetHome = () => {
      setSelectedCategory('All');
      setSelectedTag(null);
      setSelectedAuthor(null);
      setSearchQuery('');
      setCurrentPage(1);
      setView('library');
      setActivePrompt(null);
      setActiveTopic(null);
      setTopicScrollPos(0);
      setSidebarOpen(false);
      setLastView(null);
      setLastActiveTopic(null);
  };

  // --- Data Fetching ---
  const fetchPrompts = async () => {
      setIsLoading(true);
      try {
          // Send auth header if we have a token, to potentially see private items
          const headers: Record<string, string> = { ...getAuthHeaders() };
          
          const res = await fetch('/api/prompts', { headers });
          const contentType = res.headers.get("content-type");
          if (res.ok && contentType && contentType.includes("application/json")) {
              const data = await res.json();
              
              // Handle Deep Linking (ID) via Ref to ensure it works even if URL was cleared
              const id = initialIdRef.current;
              if (id) {
                  const found = data.find((p: PromptData) => p.id === id);
                  if (found) {
                      setActivePrompt(found);
                      setView('detail');
                  }
                  // Consume the ID so subsequent fetches don't force-navigate back
                  initialIdRef.current = null;
              }

              setPrompts(data);
              setIsDemoMode(false);
          } else {
              throw new Error(`API Error: ${res.status} ${res.statusText}`);
          }
      } catch (error) {
          console.warn("Backend unavailable. Switching to Offline/Demo Mode.", error);
          setIsDemoMode(true);
          const localData = loadLocalData();

          // Handle Deep Linking (ID) for local data too
          const id = initialIdRef.current;
          if (id) {
              const found = localData.find((p: PromptData) => p.id === id);
              if (found) {
                  setActivePrompt(found);
                  setView('detail');
              }
              initialIdRef.current = null;
          }

          setPrompts(localData);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      fetchPrompts();
  }, []);

  // Refetch when auth state changes to see private items
  useEffect(() => {
      if (!isLoading) {
          fetchPrompts();
      }
  }, [isAuthenticated]);

  // --- Calculated Lists for Autocomplete ---
  const allAuthors = useMemo(() => {
      const authors = prompts.map(p => p.author).filter(Boolean) as string[];
      return Array.from(new Set(authors)).sort();
  }, [prompts]);

  const allTags = useMemo(() => {
      const tags = prompts.flatMap(p => p.tags);
      return Array.from(new Set(tags)).sort();
  }, [prompts]);

  const allTopics = useMemo(() => {
    const topicMap = new Map<string, { count: number; previewImage?: string }>();
    
    prompts.forEach(p => {
        if (p.topic) {
            const entry = topicMap.get(p.topic) || { count: 0, previewImage: undefined };
            entry.count++;
            if (!entry.previewImage && p.imageUrl) {
                entry.previewImage = p.imageUrl;
            }
            topicMap.set(p.topic, entry);
        }
    });

    return Array.from(topicMap.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        previewImage: data.previewImage
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [prompts]);

  const activeTopicPrompts = useMemo(() => {
      if (!activeTopic) return [];
      return prompts.filter(p => p.topic === activeTopic);
  }, [prompts, activeTopic]);

  // --- SEO, Title & URL Management ---
  useEffect(() => {
      // 0. Safety Guard: Do not rewrite URL while loading
      if (isLoading && view === 'library') return;

      // 1. Update Title
      let title = SITE_NAME;
      if (view === 'detail' && activePrompt) {
          if (activePrompt.status === PromptStatus.PRIVATE && !isAuthenticated) {
             title = `Protected Content | ${SITE_NAME}`;
          } else {
             title = `${activePrompt.title} | ${SITE_NAME}`;
          }
      } else if (view === 'topic-detail' && activeTopic) {
          title = `${activeTopic} | ${SITE_NAME}`;
      } else if (view === 'topics') {
          title = currentPage > 1 ? `Topics (Page ${currentPage}) | ${SITE_NAME}` : `Topics | ${SITE_NAME}`;
      } else if (selectedAuthor) {
          title = `Prompts by ${selectedAuthor} | ${SITE_NAME}`;
      } else if (selectedTag) {
          title = `#${selectedTag} Prompts | ${SITE_NAME}`;
      } else if (selectedCategory !== 'All') {
          title = `${selectedCategory} Prompts | ${SITE_NAME}`;
      } else if (view === 'editor') {
          title = `Editor | ${SITE_NAME}`;
      } else if (searchQuery) {
          title = `Search: ${searchQuery} | ${SITE_NAME}`;
      } else if (currentPage > 1) {
          title = `${SITE_NAME} (Page ${currentPage})`;
      }
      document.title = title;

      // 2. Update Meta Description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
          if (view === 'detail' && activePrompt) {
              if (activePrompt.status === PromptStatus.PRIVATE && !isAuthenticated) {
                  metaDesc.setAttribute('content', 'This content is private and requires authentication to view.');
              } else {
                  metaDesc.setAttribute('content', activePrompt.description || 'A professional AI prompt managed in PromptFolio.');
              }
          } else if (selectedAuthor) {
              metaDesc.setAttribute('content', `Browse AI prompts created by ${selectedAuthor}.`);
          } else {
              metaDesc.setAttribute('content', 'Organize, version, and optimize your AI prompts with Google Gemini integration.');
          }
      }

      // 3. Update URL (pushState)
      const url = new URL(window.location.href);
      const params = url.searchParams;
      
      // Clear existing relevant params
      params.delete('id');
      params.delete('category');
      params.delete('tag');
      params.delete('author');
      params.delete('topic');
      params.delete('view');
      params.delete('page');
      params.delete('search');

      if (view === 'detail' && activePrompt) {
          params.set('id', activePrompt.id);
      } else if (view === 'topic-detail' && activeTopic) {
          params.set('topic', activeTopic);
      } else if (view === 'topics') {
          params.set('view', 'topics');
          if (currentPage > 1) {
              params.set('page', currentPage.toString());
          }
      } else if (view === 'library') {
          if (selectedCategory && selectedCategory !== 'All') {
              params.set('category', selectedCategory);
          }
          if (selectedTag) {
              params.set('tag', selectedTag);
          }
          if (selectedAuthor) {
              params.set('author', selectedAuthor);
          }
          if (searchQuery) {
              params.set('search', searchQuery);
          }
          if (currentPage > 1) {
              params.set('page', currentPage.toString());
          }
      }
      
      const currentSearch = window.location.search;
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      
      // Only push if changed to avoid loops
      if (currentSearch !== newSearch) {
           window.history.pushState({}, '', newSearch || window.location.pathname);
      }

  }, [view, activePrompt, activeTopic, selectedCategory, selectedTag, selectedAuthor, searchQuery, isAuthenticated, SITE_NAME, isLoading, currentPage]);

  // --- Handle Browser Back/Forward Buttons ---
  useEffect(() => {
      const handlePopState = () => {
          const params = new URLSearchParams(window.location.search);
          const id = params.get('id');
          const topic = params.get('topic');
          const viewParam = params.get('view');
          const category = params.get('category');
          const tag = params.get('tag');
          const author = params.get('author');
          const page = params.get('page');
          const search = params.get('search');
          
          // Restore Page Number
          if (page) setCurrentPage(parseInt(page));
          else setCurrentPage(1);

          if (id) {
              const p = prompts.find(x => x.id === id);
              if (p) {
                  setActivePrompt(p);
                  setView('detail');
              } else if (prompts.length > 0) {
                  // Prompt ID in URL but not found in data? Go to library.
                  setActivePrompt(null);
                  setView('library');
              }
          } else if (topic) {
              setActiveTopic(topic);
              setView('topic-detail');
          } else if (viewParam === 'topics') {
              setView('topics');
          } else {
              setActivePrompt(null);
              setActiveTopic(null);
              setView('library');
              if (category) setSelectedCategory(category);
              else setSelectedCategory('All');
              
              if (tag) setSelectedTag(tag);
              else setSelectedTag(null);

              if (author) setSelectedAuthor(author);
              else setSelectedAuthor(null);

              if (search) setSearchQuery(search);
              else setSearchQuery('');
          }
      };

      window.addEventListener('popstate', handlePopState);
      
      return () => window.removeEventListener('popstate', handlePopState);
  }, [prompts]);

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

  // --- Auth Handlers ---
  const handleLogin = () => {
      // Basic client-side check for immediate feedback, but real test is API access
      if (ENV_SITE_PASSWORD && passwordInput !== ENV_SITE_PASSWORD) {
          setLoginError(true);
          return;
      }
      
      localStorage.setItem('pf_auth_token', passwordInput);
      setIsAuthenticated(true);
      setIsLoginModalOpen(false);
      setPasswordInput('');
      setLoginError(false);
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('pf_auth_token');
      setView('library'); // Reset view in case we were editing
  };

  // --- Handlers ---
  const handleCreateNew = () => {
      setActivePrompt(null);
      setView('editor');
      setSidebarOpen(false); 
  };

  const handleSavePrompt = async (data: PromptData) => {
      let updatedPrompts = [...prompts];
      const existingIndex = updatedPrompts.findIndex(p => p.id === data.id);
      
      if (existingIndex >= 0) {
          updatedPrompts[existingIndex] = data;
      } else {
          updatedPrompts.unshift(data);
      }
      
      // Optimistic UI update
      setPrompts(updatedPrompts);
      saveLocalData(updatedPrompts);
      
      if (!isDemoMode) {
          try {
              const headers: Record<string, string> = { 
                  'Content-Type': 'application/json',
                  ...getAuthHeaders()
              };
              
              const res = await fetch('/api/prompts', {
                  method: 'POST',
                  headers: headers,
                  body: JSON.stringify(data)
              });

              if (res.status === 401) {
                  alert("Session expired or unauthorized. Please login again.");
                  handleLogout();
                  return;
              }
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
                      const headers: Record<string, string> = { ...getAuthHeaders() };
                      const res = await fetch(`/api/prompts/${id}`, { 
                          method: 'DELETE',
                          headers: headers
                      });

                      if (res.status === 401) {
                          alert("Session expired or unauthorized. Please login again.");
                          handleLogout();
                      }
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

  const performExport = (scope: 'all' | 'author' | 'category' | 'topic' | 'tag', value: string) => {
      // 1. Filter Prompts
      let filtered = prompts;
      let filenamePart = 'all';

      if (scope === 'author') {
          filtered = prompts.filter(p => p.author === value);
          filenamePart = `author-${value.replace(/\s+/g, '_')}`;
      } else if (scope === 'category') {
          filtered = prompts.filter(p => p.category === value);
          filenamePart = `category-${value.replace(/\s+/g, '_')}`;
      } else if (scope === 'topic') {
          filtered = prompts.filter(p => p.topic === value);
          filenamePart = `topic-${value.replace(/\s+/g, '_')}`;
      } else if (scope === 'tag') {
          filtered = prompts.filter(p => p.tags.includes(value));
          filenamePart = `tag-${value.replace(/\s+/g, '_')}`;
      }

      if (filtered.length === 0) {
          alert("No prompts found matching your criteria.");
          return;
      }

      // 2. Generate Markdown
      const markdownContent = filtered.map(p => {
          // Get content of current version or fallback to last
          const version = p.versions.find(v => v.id === p.currentVersionId) || p.versions[p.versions.length - 1];
          const content = version?.content || '(No Content)';
          
          return `# ${p.title}\n\n${content}`;
      }).join('\n\n---\n\n');

      // 3. Download
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptfolio_export_${filenamePart}_${new Date().toISOString().slice(0,10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      
      setIsExportModalOpen(false);
  };

  // --- Filtering & Sorting ---
  const processedPrompts = useMemo(() => {
      // 1. Filter
      let result = prompts.filter(p => {
          const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory || (selectedCategory === 'Favorites' && p.isFavorite);
          
          // Enhanced Search Logic
          const matchesSearch = searchQuery === '' || (() => {
              const query = searchQuery.toLowerCase();
              return (
                  p.title.toLowerCase().includes(query) ||
                  (p.description && p.description.toLowerCase().includes(query)) ||
                  p.tags.some(t => t.toLowerCase().includes(query)) ||
                  (p.author && p.author.toLowerCase().includes(query)) ||
                  (p.topic && p.topic.toLowerCase().includes(query)) ||
                  (p.category && p.category.toLowerCase().includes(query)) ||
                  p.versions.some(v => 
                      (v.content && v.content.toLowerCase().includes(query)) || 
                      (v.note && v.note.toLowerCase().includes(query))
                  )
              );
          })();
              
          const matchesTag = selectedTag === null || p.tags.includes(selectedTag);

          const matchesAuthor = selectedAuthor === null || p.author === selectedAuthor;

          return matchesCategory && matchesSearch && matchesTag && matchesAuthor;
      });

      // 2. Sort
      result.sort((a, b) => {
          switch(sortOrder) {
              case 'newest':
                  return b.updatedAt - a.updatedAt;
              case 'oldest':
                  return a.updatedAt - b.updatedAt;
              default:
                  return 0;
          }
      });

      return result;
  }, [prompts, selectedCategory, searchQuery, selectedTag, selectedAuthor, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(processedPrompts.length / ITEMS_PER_PAGE);
  const paginatedPrompts = processedPrompts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset pagination on filter change (Only for Library view, managed internally by effect)
  useEffect(() => {
      if (isFirstRender.current) {
          isFirstRender.current = false;
          return;
      }

      // Logic: If in library view, filters change, reset page.
      if (view === 'library') {
          setCurrentPage(1);
      }
  }, [selectedCategory, searchQuery, selectedTag, selectedAuthor, sortOrder]); // Removed 'view' to preserve page number on back navigation

  // Scroll to top when page changes
  useEffect(() => {
    if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        
        {/* Modals */}
        <ConfirmModal 
            {...confirmState} 
            onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))} 
            onConfirm={confirmState.action}
        />

        <ExportModal 
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            onExport={performExport}
            authors={allAuthors}
            tags={allTags}
            topics={allTopics.map(t => t.name)}
            categories={Object.values(Category)}
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
            onSelectCategory={(cat) => { setSelectedCategory(cat); setSelectedTag(null); setSelectedAuthor(null); setView('library'); setCurrentPage(1); setSidebarOpen(false); }}
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
            onExport={() => setIsExportModalOpen(true)}
            onLogoClick={handleResetHome}
            currentView={view}
            onNavigate={(v) => { setView(v); setCurrentPage(1); setSidebarOpen(false); }}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden transition-all">
            
            {view === 'library' && (
                <div className="h-full flex flex-col">
                    {/* Top Bar - Enhanced */}
                    <div className="sticky top-0 z-20 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-200/50 dark:border-zinc-800/50 px-6 md:px-10 py-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                             
                             {/* Left: Mobile Trigger & Search */}
                             <div className="flex items-center gap-3 w-full md:w-96">
                                <button 
                                    className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                    onClick={() => setSidebarOpen(true)}
                                    aria-label="Open Sidebar"
                                >
                                    <RiMenuLine size={24} />
                                </button>
                                
                                {/* Mobile Brand - Clickable */}
                                <div className="flex items-center gap-2 md:hidden mr-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleResetHome}>
                                    <Logo className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                                    <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[100px]">{SITE_NAME}</span>
                                </div>

                                <div className="relative flex-1 group">
                                    <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors" size={16} />
                                    <input 
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search..."
                                        aria-label="Search prompts"
                                        className="w-full pl-9 pr-8 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all shadow-sm"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900" aria-label="Clear Search">
                                            <RiCloseCircleLine size={14} />
                                        </button>
                                    )}
                                </div>
                                {/* Result Stats (Desktop) */}
                                <span className="hidden lg:block text-xs font-medium text-zinc-400 dark:text-zinc-500 whitespace-nowrap border-l border-zinc-300 dark:border-zinc-700 pl-3">
                                    {processedPrompts.length} Items
                                </span>
                             </div>

                             {/* Right: Sorting & View Toggle */}
                             <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-3 md:gap-6">
                                
                                {/* Sort Dropdown */}
                                <div className="flex items-center gap-2">
                                    <div className="relative group">
                                        <RiArrowUpDownLine size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                        <select 
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value as any)}
                                            aria-label="Sort Order"
                                            className="appearance-none pl-8 pr-8 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none transition-colors cursor-pointer min-w-[130px]"
                                        >
                                            <option value="newest">Newest First</option>
                                            <option value="oldest">Oldest First</option>
                                        </select>
                                    </div>
                                </div>

                                {/* View Mode Toggle */}
                                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg shrink-0">
                                    <button 
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                                        title="Grid View"
                                        aria-label="Grid View"
                                    >
                                        <RiLayoutGridLine size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                                        title="List View"
                                        aria-label="List View"
                                    >
                                        <RiListCheck2 size={16} />
                                    </button>
                                </div>
                             </div>
                        </div>

                        {/* Active Filters Row */}
                        {(selectedTag || selectedAuthor) && (
                             <div className="mt-3 flex flex-wrap items-center gap-2">
                                 {selectedTag && (
                                    <div className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1 rounded-full shadow-sm animate-in slide-in-from-top-1 fade-in duration-200">
                                        <span className="text-xs font-bold">#{selectedTag}</span>
                                        <button onClick={() => setSelectedTag(null)} className="hover:opacity-70 transition-opacity" aria-label="Remove Tag Filter">
                                            <RiCloseLine size={14} />
                                        </button>
                                    </div>
                                 )}
                                 {selectedAuthor && (
                                     <div className="flex items-center gap-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-1 rounded-full shadow-sm animate-in slide-in-from-top-1 fade-in duration-200 border border-zinc-300 dark:border-zinc-700">
                                         <RiUser3Line size={12} />
                                         <span className="text-xs font-bold">{selectedAuthor}</span>
                                         <button onClick={() => setSelectedAuthor(null)} className="hover:opacity-70 transition-opacity" aria-label="Remove Author Filter">
                                             <RiCloseLine size={14} />
                                         </button>
                                     </div>
                                 )}
                             </div>
                        )}
                    </div>
                    
                    {/* Content Area */}
                    <div ref={contentRef} className="flex-1 overflow-y-auto px-6 md:px-10 pb-[calc(6rem+env(safe-area-inset-bottom))] scrollbar-hide pt-6">
                        {isLoading ? (
                            <div className={`grid gap-6 mb-8 ${
                                viewMode === 'grid' 
                                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' 
                                : 'grid-cols-1 max-w-5xl mx-auto'
                            }`}>
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <PromptCardSkeleton key={i} viewMode={viewMode} />
                                ))}
                            </div>
                        ) : processedPrompts.length > 0 ? (
                            <>
                                {/* Responsive Grid Logic based on ViewMode */}
                                <div className={`grid gap-6 mb-8 ${
                                    viewMode === 'grid' 
                                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' 
                                    : 'grid-cols-1 max-w-5xl mx-auto'
                                }`}>
                                    {paginatedPrompts.map(prompt => (
                                        <PromptCard 
                                            key={prompt.id} 
                                            prompt={prompt} 
                                            onClick={(p) => { setActivePrompt(p); setView('detail'); }}
                                            onTagClick={(t) => setSelectedTag(t)}
                                            isAuthenticated={isAuthenticated}
                                            viewMode={viewMode}
                                        />
                                    ))}
                                </div>

                                {/* Smart Numeric Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex flex-wrap justify-center items-center gap-1 md:gap-2 py-6 mt-auto select-none w-full">
                                        <button 
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            title="Previous Page"
                                            aria-label="Previous Page"
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
                                                        onClick={() => setCurrentPage(Number(page))}
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
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            title="Next Page"
                                            aria-label="Next Page"
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

            <Suspense fallback={<LoadingOverlay />}>
                {view === 'detail' && activePrompt && (
                    <PromptDetail 
                        prompt={activePrompt}
                        onBack={() => { 
                            if (activeTopic) {
                                setView('topic-detail');
                                setActivePrompt(null);
                            } else {
                                setView('library'); 
                                setActivePrompt(null); 
                            }
                        }}
                        onEdit={(p) => { setView('editor'); }}
                        onDelete={handleDeletePrompt}
                        onToggleFavorite={handleToggleFavorite}
                        isAuthenticated={isAuthenticated}
                        onLogin={() => setIsLoginModalOpen(true)}
                        onTagClick={(t) => { setSelectedTag(t); setView('library'); }}
                        onAuthorClick={(a) => { setSelectedAuthor(a); setView('library'); }}
                        onTopicClick={(t) => { 
                            setLastView('detail');
                            setLastActiveTopic(activeTopic);
                            setActiveTopic(t); 
                            setView('topic-detail'); 
                            setTopicScrollPos(0); 
                        }}
                    />
                )}

                {view === 'topics' && (
                    <TopicList 
                        topics={allTopics}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onSelectTopic={(t) => { 
                            setLastView('topics');
                            setLastActiveTopic(activeTopic);
                            setActiveTopic(t); 
                            setView('topic-detail'); 
                            setTopicScrollPos(0); 
                        }}
                        onOpenSidebar={() => setSidebarOpen(true)}
                    />
                )}

                {view === 'topic-detail' && activeTopic && (
                    <TopicDetail 
                        topic={activeTopic}
                        prompts={activeTopicPrompts}
                        onBack={() => { 
                            if (lastView === 'detail') {
                                setView('detail');
                                setActiveTopic(lastActiveTopic);
                            } else {
                                setView('topics'); 
                                setActiveTopic(null); 
                            }
                            setLastView(null);
                            setLastActiveTopic(null);
                            setTopicScrollPos(0); 
                        }}
                        onViewDetail={(p, scrollPos) => { 
                            setTopicScrollPos(scrollPos);
                            setActivePrompt(p); 
                            setView('detail'); 
                        }}
                        isAuthenticated={isAuthenticated}
                        initialScrollPos={topicScrollPos}
                    />
                )}

                {view === 'editor' && (
                    <PromptEditor 
                        initialData={activePrompt}
                        onSave={handleSavePrompt}
                        onDelete={handleDeletePrompt}
                        onCancel={() => {
                            if (activePrompt) {
                                if (activeTopic) setView('topic-detail');
                                else setView('detail');
                            } else {
                                if (activeTopic) setView('topic-detail');
                                else setView('library');
                            }
                        }}
                        existingAuthors={allAuthors}
                        existingTags={allTags}
                        existingTopics={allTopics.map(t => t.name)}
                    />
                )}
            </Suspense>

        </main>
    </div>
  );
};

export default App;