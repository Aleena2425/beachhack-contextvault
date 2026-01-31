import React from 'react';
import { Search, Bell, LogOut, User, Wifi } from 'lucide-react';

const DashboardHeader = ({ onLogout, isConnected }) => {
    const user = JSON.parse(localStorage.getItem('user')) || { email: 'Agent' };

    return (
        <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-lg font-semibold text-neutral-900 tracking-tight">ContextAI</span>

                {/* Connection Status */}
                <div className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1.5 ${isConnected
                        ? 'bg-neutral-50 border-neutral-200 text-neutral-700'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#22c55e]' : 'bg-neutral-400'}`}></div>
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                </div>
            </div>

            {/* Global Search */}
            <div className="flex-1 max-w-md mx-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-4 py-1.5 bg-neutral-100 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                {/* Notifications */}
                <button className="relative p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-all">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-black rounded-full"></span>
                </button>

                {/* Profile */}
                <div className="flex items-center gap-2 pl-3 border-l border-neutral-200">
                    <div className="w-7 h-7 bg-neutral-900 rounded-full flex items-center justify-center">
                        <User size={14} className="text-white" />
                    </div>
                    <span className="text-sm text-neutral-700 hidden sm:block">{user.email?.split('@')[0] || 'Agent'}</span>
                    <button
                        onClick={onLogout}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-all"
                        title="Logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
