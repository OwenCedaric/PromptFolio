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
        <aside className={`
            fixed md:relative z-50 flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800
            transform transition-all duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64 pb-[env(safe-area-inset-bottom)] contain-strict
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

        {/* Navigation */}
        <div className={`flex-1 px-3 overflow-y-auto no-scrollbar transition-all duration-300`}>
            
            <nav className="space-y-1">
                {/* All Prompts */}
                <button
                    onClick={() => { onNavigate('library'); onSelectCategory('All'); }}
                    title={isCollapsed ? "All Prompts" : undefined}
                    aria-label="All Prompts"
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 text-sm rounded-lg transition-colors ${
                    currentView === 'library' && selectedCategory === 'All'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <RiApps2Line size={20} className={currentView === 'library' && selectedCategory === 'All' ? 'text-zinc-900 dark:text-zinc-100' : 'opacity-70'} />
                        {!isCollapsed && <span>All Prompts</span>}
                    </div>
                </button>

                {/* Topics View */}
                <button
                    onClick={() => onNavigate('topics')}
                    title={isCollapsed ? "Topics" : undefined}
                    aria-label="Topics"
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 text-sm rounded-lg transition-colors ${
                    currentView === 'topics' || currentView === 'topic-detail'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                     <div className="flex items-center gap-3">
                        <RiBookOpenLine size={20} className={currentView === 'topics' || currentView === 'topic-detail' ? 'text-zinc-900 dark:text-zinc-100' : 'opacity-70'} />
                        {!isCollapsed && <span>Topics</span>}
                     </div>
                </button>

                {/* Favorites */}
                <button
                    onClick={() => { onNavigate('library'); onSelectCategory('Favorites'); }}
                    title={isCollapsed ? "Favorites" : undefined}
                    aria-label="Favorites"
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 text-sm rounded-lg transition-colors ${
                    selectedCategory === 'Favorites'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                     <div className="flex items-center gap-3">
                        <RiStarLine size={20} className={selectedCategory === 'Favorites' ? 'text-zinc-900 dark:text-zinc-100' : 'opacity-70'} />
                        {!isCollapsed && <span>Favorites</span>}
                     </div>
                </button>

                {!isCollapsed && (
                    <div className="pt-4 pb-2 px-3">
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Categories</p>
                    </div>
                )}

                {/* Categories */}
                {Object.values(Category).map(cat => (
                    <button
                        key={cat}
                        onClick={() => { onNavigate('library'); onSelectCategory(cat); }}
                        title={isCollapsed ? cat : undefined}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-3'} py-2 text-sm rounded-lg transition-colors ${
                        currentView === 'library' && selectedCategory === cat
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        {isCollapsed ? (
                             <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600"></span>
                        ) : (
                             <span>{cat}</span>
                        )}
                    </button>
                ))}
            </nav>
        </div>

        {/* Footer */}
        <div className="p-3 mt-auto shrink-0 space-y-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10">
            {/* Desktop Collapse Toggle */}
            <div className="hidden md:block">
                 <button
                    onClick={toggleCollapse}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-3'} py-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors`}
                >
                    {isCollapsed ? <RiSidebarUnfoldLine size={20} /> : <RiSidebarFoldLine size={20} />}
                    {!isCollapsed && <span className="ml-3 text-sm">Collapse</span>}
                </button>
            </div>

             {/* Theme Toggle */}
            <button
                onClick={onToggleTheme}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-3'} py-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors`}
            >
                {isDarkMode ? <RiSunLine size={20} /> : <RiMoonLine size={20} />}
                {!isCollapsed && <span className="ml-3 text-sm">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
            
            {/* Export */}
            {onExport && (
                <button
                    onClick={onExport}
                    title="Export Backup"
                    aria-label="Export Backup"
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-3'} py-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors`}
                >
                    <RiDownloadLine size={20} />
                    {!isCollapsed && <span className="ml-3 text-sm">Export</span>}
                </button>
            )}

            {/* Auth */}
            <button
                onClick={isAuthenticated ? onLogout : onLogin}
                title={isAuthenticated ? "Logout" : "Admin Login"}
                aria-label={isAuthenticated ? "Logout" : "Admin Login"}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-3'} py-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors`}
            >
                {isAuthenticated ? <RiLogoutBoxRLine size={20} /> : <RiLoginBoxLine size={20} />}
                {!isCollapsed && <span className="ml-3 text-sm">{isAuthenticated ? 'Logout' : 'Admin Login'}</span>}
            </button>
        </div>

        </aside>
    </>
  );
};

export default Sidebar;