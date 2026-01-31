import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    UserCircle,
    BarChart3,
    Settings,
    Search,
    Bell,
    LogOut,
    ChevronRight,
    ExternalLink,
    Clock,
    TrendingUp,
    Zap,
    Activity
} from 'lucide-react';
import { mockAgents, mockAllCustomers, mockKPIs } from '../data/managerMockData';

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || { email: 'Manager' };
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'online': return 'bg-black';
            case 'away': return 'bg-neutral-400';
            default: return 'bg-neutral-300';
        }
    };

    const getUrgencyBadge = (urgency) => {
        switch (urgency) {
            case 'high': return 'bg-neutral-900 text-white';
            case 'medium': return 'bg-neutral-200 text-neutral-700';
            default: return 'bg-neutral-100 text-neutral-500';
        }
    };

    const filteredCustomers = mockAllCustomers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.uuid.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Customer Profile Modal
    const CustomerProfileModal = ({ customer, onClose }) => {
        if (!customer) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="p-4 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
                        <div>
                            <h2 className="text-lg font-semibold text-neutral-900">{customer.name}</h2>
                            <p className="text-sm text-neutral-500">{customer.email} · {customer.uuid}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-md transition-all">
                            <span className="text-neutral-500">✕</span>
                        </button>
                    </div>

                    {/* AI-Extracted Fields */}
                    <div className="p-4 border-b border-neutral-100">
                        <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-3">AI-Extracted Context</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-neutral-50 p-3 rounded-lg">
                                <p className="text-[10px] uppercase tracking-wider text-neutral-400">Budget</p>
                                <p className="text-base font-semibold text-neutral-900">${customer.budget?.toLocaleString()}</p>
                            </div>
                            <div className="bg-neutral-50 p-3 rounded-lg">
                                <p className="text-[10px] uppercase tracking-wider text-neutral-400">Product</p>
                                <p className="text-base font-semibold text-neutral-900">{customer.productInterest}</p>
                            </div>
                            <div className="bg-neutral-50 p-3 rounded-lg">
                                <p className="text-[10px] uppercase tracking-wider text-neutral-400">Intent</p>
                                <p className="text-base font-semibold text-neutral-900">{customer.intent}</p>
                            </div>
                            <div className="bg-neutral-50 p-3 rounded-lg">
                                <p className="text-[10px] uppercase tracking-wider text-neutral-400">Sentiment</p>
                                <p className="text-base font-semibold text-neutral-900 capitalize">{customer.sentiment}</p>
                            </div>
                            <div className="bg-neutral-50 p-3 rounded-lg">
                                <p className="text-[10px] uppercase tracking-wider text-neutral-400">Urgency</p>
                                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded uppercase ${getUrgencyBadge(customer.urgency)}`}>
                                    {customer.urgency}
                                </span>
                            </div>
                            <div className="bg-neutral-50 p-3 rounded-lg">
                                <p className="text-[10px] uppercase tracking-wider text-neutral-400">Assigned To</p>
                                <p className="text-base font-semibold text-neutral-900">{customer.assignedAgent}</p>
                            </div>
                        </div>
                        {customer.keyFeatures?.length > 0 && (
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-xs text-neutral-400">Key Features:</span>
                                {customer.keyFeatures.map((f, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-neutral-200 text-neutral-700 text-xs rounded-md">{f}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* AI Memory */}
                    <div className="p-4 border-b border-neutral-100">
                        <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">AI Memory Summary</h3>
                        <div className="bg-neutral-900 text-white p-3 rounded-lg">
                            <p className="text-sm italic leading-relaxed">{customer.aiMemory}</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="p-4">
                        <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-3">Interaction Timeline</h3>
                        {customer.timeline?.length === 0 ? (
                            <p className="text-sm text-neutral-400">No recorded interactions yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {customer.timeline?.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full mt-1.5 shrink-0"></div>
                                        <div className="flex-1">
                                            <p className="text-sm text-neutral-900">{item.event}</p>
                                            <p className="text-xs text-neutral-400">{item.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-neutral-200 bg-neutral-50">
                        <p className="text-xs text-neutral-400 text-center">Manager view only. Editing is disabled.</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex bg-white">
            {/* Left Sidebar */}
            <aside className="w-56 bg-neutral-50 border-r border-neutral-200 flex flex-col shrink-0">
                {/* Logo */}
                <div className="h-14 flex items-center px-4 border-b border-neutral-200">
                    <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center mr-2">
                        <span className="text-white font-bold text-sm">C</span>
                    </div>
                    <span className="text-base font-semibold text-neutral-900">ContextAI</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                            }`}
                    >
                        <LayoutDashboard size={16} />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'customers' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                            }`}
                    >
                        <Users size={16} />
                        Customers
                    </button>
                    <button
                        onClick={() => setActiveTab('agents')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'agents' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                            }`}
                    >
                        <UserCircle size={16} />
                        Agents
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                            }`}
                    >
                        <BarChart3 size={16} />
                        Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                            }`}
                    >
                        <Settings size={16} />
                        Settings
                    </button>
                </nav>

                {/* User */}
                <div className="p-3 border-t border-neutral-200">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">{user.email?.[0]?.toUpperCase() || 'M'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">{user.email?.split('@')[0] || 'Manager'}</p>
                            <p className="text-[10px] text-neutral-400">Manager</p>
                        </div>
                        <button onClick={handleLogout} className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-all">
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0">
                    <h1 className="text-sm font-medium text-neutral-900">
                        {activeTab === 'dashboard' && 'Dashboard Overview'}
                        {activeTab === 'customers' && 'All Customers'}
                        {activeTab === 'agents' && 'Agent Monitoring'}
                        {activeTab === 'analytics' && 'Analytics'}
                        {activeTab === 'settings' && 'Settings'}
                    </h1>
                    <div className="flex items-center gap-3">
                        {/* Global Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search by UUID or Email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
                            />
                        </div>
                        {/* Notifications */}
                        <button className="relative p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-all">
                            <Bell size={16} />
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-black rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Active Customers</p>
                                        <span className="flex items-center gap-1 text-[10px] text-neutral-500">
                                            <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>
                                            Live
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-neutral-900">{mockKPIs.totalActiveCustomers}</p>
                                    <p className="text-xs text-neutral-400 mt-1">+12% from last week</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Engaged Today</p>
                                        <TrendingUp size={14} className="text-neutral-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-neutral-900">{mockKPIs.customersEngagedToday}</p>
                                    <p className="text-xs text-neutral-400 mt-1">Updated 2 mins ago</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Active Agents</p>
                                        <Activity size={14} className="text-neutral-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-neutral-900">{mockKPIs.activeAgents}</p>
                                    <p className="text-xs text-neutral-400 mt-1">of 5 total</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">High-Intent Leads</p>
                                        <span className="px-1.5 py-0.5 bg-neutral-900 text-white text-[10px] font-medium rounded">HIGH</span>
                                    </div>
                                    <p className="text-2xl font-bold text-neutral-900">{mockKPIs.highIntentLeads}</p>
                                    <p className="text-xs text-neutral-400 mt-1">Ready to convert</p>
                                </div>
                            </div>

                            {/* Agent Monitoring Panel */}
                            <div className="bg-white rounded-lg border border-neutral-200">
                                <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                                    <h2 className="text-sm font-semibold text-neutral-900">Agent Monitoring</h2>
                                    <span className="text-xs text-neutral-400">Real-time status</span>
                                </div>
                                <div className="divide-y divide-neutral-100">
                                    {mockAgents.map((agent) => (
                                        <div key={agent.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-9 h-9 bg-neutral-900 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                                        {agent.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${getStatusDot(agent.status)} rounded-full border-2 border-white`}></span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-900">{agent.name}</p>
                                                    <p className="text-xs text-neutral-400">{agent.statusLabel}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8 text-sm">
                                                <div className="text-center">
                                                    <p className="font-semibold text-neutral-900">{agent.activeCustomers}</p>
                                                    <p className="text-[10px] text-neutral-400">Active</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-semibold text-neutral-900">{agent.totalCustomersToday}</p>
                                                    <p className="text-[10px] text-neutral-400">Today</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-semibold text-neutral-900">{agent.avgResponseTime}</p>
                                                    <p className="text-[10px] text-neutral-400">Avg. Response</p>
                                                </div>
                                                <button className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-all flex items-center gap-1">
                                                    View Activity <ChevronRight size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent High-Intent Customers */}
                            <div className="bg-white rounded-lg border border-neutral-200">
                                <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                                    <h2 className="text-sm font-semibold text-neutral-900">Recent High-Intent Leads</h2>
                                    <button
                                        onClick={() => setActiveTab('customers')}
                                        className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
                                    >
                                        View All <ExternalLink size={10} />
                                    </button>
                                </div>
                                <div className="divide-y divide-neutral-100">
                                    {mockAllCustomers.filter(c => c.urgency === 'high').slice(0, 3).map((customer) => (
                                        <div key={customer.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-700 text-xs font-medium">
                                                    {customer.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-900">{customer.name}</p>
                                                    <p className="text-xs text-neutral-400">{customer.productInterest} · ${customer.budget?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-medium rounded uppercase">
                                                    {customer.urgency}
                                                </span>
                                                <span className="text-xs text-neutral-400 flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {customer.lastUpdated}
                                                </span>
                                                <button
                                                    onClick={() => setSelectedCustomer(customer)}
                                                    className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-all"
                                                >
                                                    View Profile
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div className="bg-white rounded-lg border border-neutral-200">
                            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-neutral-900">All Customers ({filteredCustomers.length})</h2>
                                <p className="text-xs text-neutral-400">Showing all customers across agents</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-50 border-b border-neutral-100">
                                        <tr>
                                            <th className="text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400 px-4 py-3">Customer</th>
                                            <th className="text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400 px-4 py-3">UUID</th>
                                            <th className="text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400 px-4 py-3">Agent</th>
                                            <th className="text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400 px-4 py-3">Budget</th>
                                            <th className="text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400 px-4 py-3">Product</th>
                                            <th className="text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400 px-4 py-3">Intent</th>
                                            <th className="text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400 px-4 py-3">Urgency</th>
                                            <th className="text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400 px-4 py-3">Updated</th>
                                            <th className="text-left text-[10px] font-medium uppercase tracking-wider text-neutral-400 px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {filteredCustomers.map((customer) => (
                                            <tr key={customer.id} className="hover:bg-neutral-50 transition-all">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-700 text-[10px] font-medium">
                                                            {customer.name.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-neutral-900">{customer.name}</p>
                                                            <p className="text-[10px] text-neutral-400">{customer.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-mono text-neutral-500">{customer.uuid}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-neutral-700">{customer.assignedAgent}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-medium text-neutral-900">${customer.budget?.toLocaleString()}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-neutral-700">{customer.productInterest}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-neutral-700">{customer.intent}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded uppercase ${getUrgencyBadge(customer.urgency)}`}>
                                                        {customer.urgency}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-neutral-400">{customer.lastUpdated}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => setSelectedCustomer(customer)}
                                                        className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-all"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'agents' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-5 gap-4">
                                {mockAgents.map((agent) => (
                                    <div key={agent.id} className="bg-white p-4 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all">
                                        <div className="text-center mb-3">
                                            <div className="relative inline-block">
                                                <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center text-white text-sm font-medium mx-auto">
                                                    {agent.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusDot(agent.status)} rounded-full border-2 border-white`}></span>
                                            </div>
                                            <p className="text-sm font-medium text-neutral-900 mt-2">{agent.name}</p>
                                            <p className="text-xs text-neutral-400">{agent.statusLabel}</p>
                                        </div>
                                        <div className="space-y-2 text-center">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-neutral-400">Active</span>
                                                <span className="font-medium text-neutral-900">{agent.activeCustomers}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-neutral-400">Today</span>
                                                <span className="font-medium text-neutral-900">{agent.totalCustomersToday}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-neutral-400">Avg. Response</span>
                                                <span className="font-medium text-neutral-900">{agent.avgResponseTime}</span>
                                            </div>
                                        </div>
                                        <button className="w-full mt-3 px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-all">
                                            View Activity
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
                            <BarChart3 size={48} className="text-neutral-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-neutral-900">Analytics Coming Soon</h3>
                            <p className="text-sm text-neutral-400 mt-1">Detailed charts and reports will be available here.</p>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
                            <Settings size={48} className="text-neutral-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-neutral-900">Settings</h3>
                            <p className="text-sm text-neutral-400 mt-1">Manager settings and preferences will be available here.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Customer Profile Modal */}
            {selectedCustomer && (
                <CustomerProfileModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
            )}
        </div>
    );
};

export default ManagerDashboard;
