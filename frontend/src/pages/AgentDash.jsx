import React, { useState, useEffect } from 'react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import SuggestionsPanel from '../components/dashboard/SuggestionsPanel';
import { useAgentSocket } from '../hooks/useAgentSocket';
import { Search, User, DollarSign, Car, AlertCircle, ShoppingCart, Activity } from 'lucide-react';
import { profiles } from '../services/api';

const AgentDash = () => {
  const { socket, isConnected } = useAgentSocket();
  const [searchUuid, setSearchUuid] = useState('');
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Real-time updates for the CURRENTLY VIEWED profile
  useEffect(() => {
    if (!socket || !currentProfile) return;

    // Listen for AI context updates (e.g. Budget/Interest changes)
    const handleContextUpdate = (data) => {
      if (data.customerUuid === currentProfile.uuid) {
        setCurrentProfile(prev => ({
          ...prev,
          ...data.extractedContext,
          // Update AI summary if available or keep existing
          ai_summary: data.extractedContext.summary || prev.ai_summary
        }));
      }
    };

    // Listen for Next Best Actions (Suggestions)
    const handleNextAction = (data) => {
      if (data.customerUuid === currentProfile.uuid) {
        setCurrentProfile(prev => ({
          ...prev,
          suggestions: data.suggestions,
          intent: data.intent || prev.intent,
          urgency: data.urgency || prev.urgency
        }));
      }
    };

    socket.on('ai:context_update', handleContextUpdate);
    socket.on('ai:next_best_action', handleNextAction);

    return () => {
      socket.off('ai:context_update', handleContextUpdate);
      socket.off('ai:next_best_action', handleNextAction);
    };
  }, [socket, currentProfile?.uuid]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchUuid.trim()) return;

    setLoading(true);
    setError(null);
    setCurrentProfile(null);

    try {
      const { data } = await profiles.get(searchUuid);
      // Ensure suggestions exist
      data.suggestions = data.suggestions || [];
      setCurrentProfile(data);
    } catch (err) {
      console.error(err);
      setError('Customer profile not found. Please check the UUID.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-50 text-neutral-900 font-sans">
      <DashboardHeader isConnected={isConnected} onLogout={handleLogout} />

      <div className="flex-1 overflow-auto p-8">
        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={24} />
            <input
              className="w-full p-4 pl-14 bg-white border border-neutral-200 rounded-2xl shadow-sm text-lg outline-none focus:ring-2 focus:ring-black transition-all"
              placeholder="Search Customer by UUID..."
              value={searchUuid}
              onChange={(e) => setSearchUuid(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 px-8 bg-black text-white rounded-xl font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </div>

        {/* Profile Content */}
        {currentProfile ? (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Customer 360 Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-neutral-200 rounded-3xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-6">
                  <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-sm text-neutral-700">
                    <User size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900">{currentProfile.name}</h2>
                    <div className="flex items-center gap-3 text-neutral-500 mt-1">
                      <span>{currentProfile.email}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${currentProfile.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                        }`}>
                        {currentProfile.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 divide-x divide-neutral-100 border-b border-neutral-100">
                  <div className="p-6 text-center">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Budget</p>
                    <p className="font-bold text-lg text-neutral-900 flex items-center justify-center gap-1">
                      <DollarSign size={16} className="text-neutral-400" /> {currentProfile.budget_max}
                    </p>
                  </div>
                  <div className="p-6 text-center">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Interest</p>
                    <p className="font-bold text-lg text-neutral-900 flex items-center justify-center gap-1">
                      <Car size={16} className="text-neutral-400" /> {currentProfile.product_interest}
                    </p>
                  </div>
                  <div className="p-6 text-center">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Urgency</p>
                    <p className={`font-bold text-lg flex items-center justify-center gap-1 capitalize ${currentProfile.urgency === 'high' ? 'text-red-600' :
                        currentProfile.urgency === 'medium' ? 'text-orange-600' : 'text-green-600'
                      }`}>
                      <Activity size={16} /> {currentProfile.urgency}
                    </p>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="p-8 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Live AI Intelligence Summary</p>
                      <span className="text-xs text-neutral-400">Updated {new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 text-neutral-700 leading-relaxed italic">
                      "{currentProfile.ai_summary}"
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border border-neutral-100 rounded-xl">
                    <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                      <ShoppingCart size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400 font-bold uppercase">Detected Intent</p>
                      <p className="font-bold text-neutral-900 capitalize">{currentProfile.intent}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Real-time Suggestions */}
            <div className="lg:col-span-1">
              <SuggestionsPanel suggestions={currentProfile.suggestions || []} />
            </div>

          </div>
        ) : (
          /* Empty State */
          !loading && (
            <div className="text-center mt-20 opacity-50">
              <div className="inline-block p-6 bg-white rounded-full mb-4 shadow-sm">
                <Search size={48} className="text-neutral-300" />
              </div>
              <h3 className="text-xl font-bold text-neutral-400">Search for a customer to view operational insights</h3>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AgentDash;