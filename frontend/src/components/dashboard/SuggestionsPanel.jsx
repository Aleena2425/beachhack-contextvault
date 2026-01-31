import React from 'react';
import { Sparkles, Copy, Check, X } from 'lucide-react';

const SuggestionsPanel = ({ suggestions = [], customer }) => {
    if (!customer) {
        return (
            <aside className="w-72 bg-neutral-50 border-l border-neutral-200 p-4 shrink-0">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-neutral-900" size={16} />
                    <h3 className="font-medium text-neutral-900 text-sm">AI Suggestions</h3>
                </div>
                <div className="text-center text-neutral-400 py-8">
                    <p className="text-xs">Select a customer to see suggestions</p>
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-72 bg-neutral-50 border-l border-neutral-200 flex flex-col shrink-0">
            {/* Header */}
            <div className="p-3 border-b border-neutral-200 bg-white">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-neutral-900" size={14} />
                    <h3 className="font-medium text-neutral-900 text-sm">AI Suggestions</h3>
                </div>
                <p className="text-[10px] text-neutral-400 mt-0.5">For {customer.name}</p>
            </div>

            {/* Suggestions */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {suggestions.map((suggestion) => (
                    <div
                        key={suggestion.id}
                        className="bg-white rounded-lg border border-neutral-200 p-3 hover:border-neutral-300 transition-all"
                    >
                        {/* Type Badge */}
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-sm">{suggestion.icon}</span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                                {suggestion.type.replace('_', ' ')}
                            </span>
                        </div>

                        {/* Content */}
                        <h4 className="font-medium text-neutral-900 text-sm leading-snug">{suggestion.title}</h4>
                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{suggestion.description}</p>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-neutral-100">
                            <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-md hover:bg-black transition-all">
                                <Check size={12} />
                                Use
                            </button>
                            <button className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md transition-all">
                                <Copy size={12} />
                            </button>
                            <button className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md transition-all">
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Insights Footer */}
            <div className="p-3 border-t border-neutral-200 bg-white">
                <h4 className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 mb-2">Insights</h4>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Churn Risk</span>
                        <span className="font-medium text-neutral-900">Low</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Est. Value</span>
                        <span className="font-medium text-neutral-900">${customer.profile?.budget_max?.toLocaleString() || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default SuggestionsPanel;
