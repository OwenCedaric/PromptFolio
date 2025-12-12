import React from 'react';
import { RiAddLine, RiCloseLine, RiLogoutBoxRLine, RiLoginBoxLine, RiApps2Line, RiStarLine, RiMoonLine, RiSunLine, RiSidebarFoldLine, RiSidebarUnfoldLine, RiDownloadLine, RiBookOpenLine } from '@remixicon/react';
import { Category } from '../types';
import { Logo } from './Logo';

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
                    className="flex items-center gap-3 overflow-hidden whitespace-nowrap group cursor-pointer hover:opacity-70 transition-opacity focus:outline-none min-h-[44px]"
                    title="Reset to Home"
                    aria-label="Reset to Home"
                >
                    <Logo className="w-8 h-8 shrink-0 text-zinc-900 dark:text-zinc-100" />
                    <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white font-sans">{siteName || 'CedarPrompt'}</span>
                </button>
            ) : (
                 <button className="w-12 h-12 flex items-center justify-center shrink-0 cursor-pointer hover:opacity-70 transition-opacity" onClick={toggleCollapse} title="Expand" aria-label="Expand Sidebar">
                    <Logo className="w-8 h-8 text-zinc-900 dark:text-zinc-100" />
                </button>
            )}

            {/* Mobile Close */}
            <button onClick={onClose} className="md:hidden ml-auto text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close Sidebar">
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
                    className={`flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl transition-all shadow-sm hover:shadow-md ${isCollapsed ? 'w-12 h-12 p-0' : 'w-full py-3 px-4 min-h-[44px]'}`}
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
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-3 text-sm rounded-lg transition-colors min-h-[44px] ${
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

                <button
                    onClick={() => onNavigate('topics')}
                    title={isCollapsed ? "Topics" : undefined}
                    aria-label="View Topics"
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-3 text-sm rounded-lg transition-colors min-h-[44px] ${
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

                <button
                    onClick={() => { onNavigate('library'); onSelectCategory('Favorites'); }}
                    title={isCollapsed ? "Favorites" : undefined}
                    aria-label="View Favorites"
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-3 text-sm rounded-lg transition-colors min-h-[44px] ${
                    currentView === 'library' && selectedCategory === 'Favorites'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
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
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors min-h-[44px] ${
                                currentView === 'library' && selectedCategory === cat
                                    ? 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:text-zinc-900 dark:hover:text-zinc-200'
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
                className={`hidden md:flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 min-h-[44px] ${isCollapsed ? 'justify-center w-12 h-12' : 'w-full'}`}
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isCollapsed ? <RiSidebarUnfoldLine size={20} /> : <RiSidebarFoldLine size={20} />}
                {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
            </button>

            <button 
                onClick={onToggleTheme}
                className={`flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 min-h-[44px] ${isCollapsed ? 'justify-center w-12 h-12' : 'w-full'}`}
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
                    className={`flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 min-h-[44px] ${isCollapsed ? 'justify-center w-12 h-12' : 'w-full'}`}
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
                    className={`flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 min-h-[44px] ${isCollapsed ? 'justify-center w-12 h-12' : 'w-full'}`}
                    title="Sign out"
                    aria-label="Sign out"
                >
                    <RiLogoutBoxRLine size={20} />
                    {!isCollapsed && <span className="text-sm font-medium">Sign out</span>}
                </button>
            ) : (
                <button 
                    onClick={onLogin}
                    className={`flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 min-h-[44px] ${isCollapsed ? 'justify-center w-12 h-12' : 'w-full'}`}
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