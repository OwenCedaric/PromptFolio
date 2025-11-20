import React from 'react';
import { RiAddLine, RiCloseLine, RiLogoutBoxRLine, RiLoginBoxLine, RiApps2Line, RiCommandFill, RiStarLine, RiMoonLine, RiSunLine } from '@remixicon/react';
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
}

const Sidebar: React.FC<SidebarProps> = ({ 
    siteName, selectedCategory, onSelectCategory, onCreateNew, isOpen = false, onClose, isAuthenticated, onLogin, onLogout, isDarkMode, onToggleTheme
}) => {
  
  return (
    <>
        <div className={`
            fixed md:relative z-50 flex flex-col h-full w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
        {/* Brand */}
        <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-sm flex items-center justify-center">
                    <RiCommandFill size={18} />
                </div>
                <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white uppercase">{siteName || 'PROMPTFOLIO'}</span>
            </div>
            <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                <RiCloseLine size={20} />
            </button>
        </div>

        {/* Primary Action - Only for Admins */}
        {isAuthenticated && (
            <div className="px-6 mb-10">
                <button 
                onClick={onCreateNew}
                className="w-full flex items-center justify-center gap-2 bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                <RiAddLine size={18} />
                <span>New Prompt</span>
                </button>
            </div>
        )}

        {/* Navigation / Filters */}
        <div className="flex-1 px-6 overflow-y-auto no-scrollbar">
            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 pl-2">Library</div>
            <nav className="space-y-1">
                <button
                    onClick={() => onSelectCategory('All')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-md transition-colors ${
                    selectedCategory === 'All'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <RiApps2Line size={18} />
                        <span>All Prompts</span>
                    </div>
                </button>

                <button
                    onClick={() => onSelectCategory('Favorites')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-md transition-colors ${
                    selectedCategory === 'Favorites'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <RiStarLine size={18} />
                        <span>Favorites</span>
                    </div>
                </button>

                <div className="my-4 border-t border-zinc-100 dark:border-zinc-800"></div>

                {Object.values(Category).map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onSelectCategory(cat)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors ${
                        selectedCategory === cat
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedCategory === cat ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-600'}`}></span>
                        <span className="truncate">{cat}</span>
                    </button>
                ))}
            </nav>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <button 
                onClick={onToggleTheme}
                className="w-full flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors px-2 py-2"
            >
                {isDarkMode ? <RiSunLine size={18} /> : <RiMoonLine size={18} />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {isAuthenticated ? (
                <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-2"
                >
                    <RiLogoutBoxRLine size={18} />
                    <span>Sign out</span>
                </button>
            ) : (
                <button 
                    onClick={onLogin}
                    className="w-full flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors px-2 py-2"
                >
                    <RiLoginBoxLine size={18} />
                    <span>Admin Access</span>
                </button>
            )}
        </div>
        </div>
    </>
  );
};

export default Sidebar;