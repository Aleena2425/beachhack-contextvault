import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BarChart2, LogOut, UserSearch } from 'lucide-react';

const ManagerAnalytics = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* NAVBAR IMPLEMENTATION */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold tracking-tight">ContextAI <span className="text-slate-400 font-normal">/ Analytics</span></h1>
          <button onClick={() => navigate('/analytics')} className="text-sm font-semibold text-black border-b-2 border-black pb-1">Overview</button>
        </div>
        <div className="flex items-center gap-4">
          {/* THE MISSING BUTTON */}
          <button 
            onClick={() => navigate('/search')} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
          >
            <Search size={16} /> Customer Intelligence
          </button>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="p-2 text-slate-400 hover:text-red-500"><LogOut size={20}/></button>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-slate-900">Performance Metrics</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Total AI Profiles</p>
            <h3 className="text-4xl font-bold mt-2">1,284</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Avg. Lead Urgency</p>
            <h3 className="text-4xl font-bold mt-2 text-orange-600">High</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Conversion Intent</p>
            <h3 className="text-4xl font-bold mt-2 text-green-600">82%</h3>
          </div>
        </div>
      </main>
    </div>
  );
};
export default ManagerAnalytics;