import React from 'react';
import { RiAddLine, RiCloseLine, RiLogoutBoxRLine, RiLoginBoxLine, RiApps2Line, RiStarLine, RiMoonLine, RiSunLine, RiSidebarFoldLine, RiSidebarUnfoldLine, RiDownloadLine, RiBookOpenLine } from '@remixicon/react';
import { Category } from '../types';

interface SidebarProps {
  siteName?: string;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onCreateNew: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  onExport?: () => void;
  onLogoClick?: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

// Inline Logo Component: Standalone Cedar "C" (No Background)
export const Logo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <g transform="translate(2, 2)">
        {/* The Serif 'C' Shape - Standalone with thicker strokes for visibility without background */}
        <path 
            d="M48 16C44 12 38 10 32 10C19.85 10 10 19.85 10 32C10 44.15 19.85 54 32 54C38 54 44 52 48 48" 
            stroke="currentColor" 
            strokeWidth="5" 
            strokeLinecap="square" 
        />
        
        {/* The Cedar Tree Lines - Abstracted & Integrated */}
        {/* Trunk */}
        <path d="M32 54V22" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        
        {/* Branches - Slightly more organic spacing */}
        <path d="M32 28L18 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 34L46 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 24L25 31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 40L39 47" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ 
    siteName, selectedCategory, onSelectCategory, onCreateNew, isOpen = false, onClose, isAuthenticated, onLogin, onLogout, isDarkMode, onToggleTheme, isCollapsed, toggleCollapse, onExport, onLogoClick, currentView, onNavigate
}) => {
  
  return (
    <>
        <div className={`
            fixed md:relative z-50 flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800
            transform transition-all duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64 pb-[env(safe-area-inset-bottom)]
        `}>
        
        {/* Brand */}
        <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-6'} shrink-0`}>
            {!isCollapsed ? (
                <button 
                    onClick={onLogoClick}
                    className="flex items-center gap-3 overflow-hidden whitespace-nowrap group cursor-pointer hover:opacity-70 transition-opacity focus:outline-none"
                    title="Reset to Home"
                    aria-label="Reset to Home"
                >
                    <Logo className="w-8 h-8 shrink-0 text-zinc-900 dark:text-zinc-100" />
                    <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white font-sans">{siteName || 'CedarPrompt'}</span>
                </button>
            ) : (
                 <button className="w-10 h-10 flex items-center justify-center shrink-0 cursor-pointer hover:opacity-70 transition-opacity" onClick={toggleCollapse} title="Expand" aria-label="Expand Sidebar">
                    <Logo className="w-full h-full text-zinc-900 dark:text-zinc-100" />
                </button>
            )}

            {/* Mobile Close */}
            <button onClick={onClose} className="md:hidden ml-auto text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100" aria-label="Close Sidebar">
                <RiCloseLine size={24} />
            </button>
        </div>

        {/* Primary Action (New Prompt) */}
        <div className={`px-4 mb-6 transition-all duration-300 ${isCollapsed ? 'flex justify-center' : ''}`}>
            {isAuthenticated && (
                <button 
                    onClick={onCreateNew}
                    title="New Prompt"
                    aria-label="Create New Prompt"
                    className={`flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl transition-all shadow-sm hover:shadow-md ${isCollapsed ? 'w-10 h-10 p-0' : 'w-full py-3 px-4'}`}
                >
                    <RiAddLine size={20} />
                    {!isCollapsed && <span className="text-sm font-semibold">New Prompt</span>}
                </button>
            )}
        </div>

        {/* Navigation - Flex-1 ensures Footer stays at bottom */}
        <div className={`flex-1 px-3 overflow-y-auto no-scrollbar transition-all duration-300`}>
            
            <nav className="space-y-1">
                <button
                    onClick={() => { onNavigate('library'); onSelectCategory('All'); }}
                    title={isCollapsed ? "All Prompts" : undefined}
                    aria-label="View All Prompts"
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 text-sm rounded-lg transition-colors ${
                    currentView === 'library' && selectedCategory === 'All'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <RiApps2Line size={20} className={currentView === 'library' && selectedCategory === 'All' ? 'text-zinc-900 dark:text-zinc-100' : 'opacity-70'} />
                        {!isCollapsed && <span>All Prompts</span>}
                    </div>
                </button>

                <button
                    onClick={() => onNavigate('topics')}
                    title={isCollapsed ? "Topics" : undefined}
                    aria-label="View Topics"
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 text-sm rounded-lg transition-colors ${
                    currentView === 'topics' || currentView === 'topic-detail'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <RiBookOpenLine size={20} className={currentView === 'topics' || currentView === 'topic-detail' ? 'text-zinc-900 dark:text-zinc-100' : 'opacity-70'} />
                        {!isCollapsed && <span>Topics</span>}
                    </div>
                </button>

                <button
                    onClick={() => { onNavigate('library'); onSelectCategory('Favorites'); }}
                    title={isCollapsed ? "Favorites" : undefined}
                    aria-label="View Favorites"
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 text-sm rounded-lg transition-colors ${
                    currentView === 'library' && selectedCategory === 'Favorites'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <RiStarLine size={20} className={currentView === 'library' && selectedCategory === 'Favorites' ? 'text-zinc-900 dark:text-zinc-100' : 'opacity-70'} />
                        {!isCollapsed && <span>Favorites</span>}
                    </div>
                </button>
            </nav>

            {/* Categories - Completely Hidden when collapsed */}
            {!isCollapsed && (
                <div className="animate-in fade-in duration-300 slide-in-from-left-2 mt-8">
                    <div className="mb-3 px-3 text-xs font-bold text-zinc-500 dark:text-zinc-600 uppercase tracking-wider">Collections</div>
                    
                    <nav className="space-y-0.5">
                        {Object.values(Category).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => { onNavigate('library'); onSelectCategory(cat); }}
                                aria-label={`View category ${cat}`}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                currentView === 'library' && selectedCategory === cat
                                    ? 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${currentView === 'library' && selectedCategory === cat ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'}`}></span>
                                <span className="truncate">{cat}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1 ${isCollapsed ? 'items-center' : ''} shrink-0`}>
             {/* Collapse Toggle */}
             <button 
                onClick={toggleCollapse}
                className={`hidden md:flex items-center gap-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isCollapsed ? 'justify-center w-10 h-10' : 'w-full'}`}
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isCollapsed ? <RiSidebarUnfoldLine size={20} /> : <RiSidebarFoldLine size={20} />}
                {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
            </button>

            <button 
                onClick={onToggleTheme}
                className={`flex items-center gap-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isCollapsed ? 'justify-center w-10 h-10' : 'w-full'}`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {isDarkMode ? <RiSunLine size={20} /> : <RiMoonLine size={20} />}
                {!isCollapsed && <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>

             {/* Export Data Button - Only Visible when Authenticated */}
             {isAuthenticated && onExport && (
                <button 
                    onClick={onExport}
                    className={`flex items-center gap-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isCollapsed ? 'justify-center w-10 h-10' : 'w-full'}`}
                    title="Export Data JSON"
                    aria-label="Export Data"
                >
                    <RiDownloadLine size={20} />
                    {!isCollapsed && <span className="text-sm font-medium">Backup</span>}
                </button>
             )}

            {isAuthenticated ? (
                <button 
                    onClick={onLogout}
                    className={`flex items-center gap-3 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isCollapsed ? 'justify-center w-10 h-10' : 'w-full'}`}
                    title="Sign out"
                    aria-label="Sign out"
                >
                    <RiLogoutBoxRLine size={20} />
                    {!isCollapsed && <span className="text-sm font-medium">Sign out</span>}
                </button>
            ) : (
                <button 
                    onClick={onLogin}
                    className={`flex items-center gap-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isCollapsed ? 'justify-center w-10 h-10' : 'w-full'}`}
                    title="Admin Login"
                    aria-label="Admin Login"
                >
                    <RiLoginBoxLine size={20} />
                    {!isCollapsed && <span className="text-sm font-medium">Login</span>}
                </button>
            )}
        </div>
        </div>
    </>
  );
};

export default Sidebar;