import React, { useState } from 'react';
import { ChevronRight, Smartphone, Home, Ticket } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { Category, CategoryType } from '../types';

interface CategoryNavProps {
  onSelect: (category: Category | null) => void;
  selectedId: string | null;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({ onSelect, selectedId }) => {
  const [activeParent, setActiveParent] = useState<string | null>(null);

  const getIcon = (type: CategoryType) => {
    switch (type) {
      case CategoryType.DIGITAL: return <Smartphone className="w-4 h-4" />;
      case CategoryType.APPLIANCES: return <Home className="w-4 h-4" />;
      case CategoryType.TICKET: return <Ticket className="w-4 h-4" />;
      default: return null;
    }
  };

  const activeCategory = CATEGORIES.find(c => c.id === activeParent);

  return (
    <div className="w-full mb-8 relative z-30">
      <div className="flex flex-col gap-2">
        {/* Level 1 Categories */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
          <button
            onClick={() => {
              setActiveParent(null);
              onSelect(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap
              ${!activeParent 
                ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
          >
            전체
          </button>
          
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveParent(cat.id === activeParent ? null : cat.id);
                // If it has no children, select it immediately
                if (!cat.children || cat.children.length === 0) {
                    onSelect(cat);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap group
                ${activeParent === cat.id 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:text-indigo-600'}`}
            >
              <span className={activeParent === cat.id ? 'text-indigo-100' : 'text-gray-400 group-hover:text-indigo-500'}>
                {getIcon(cat.type)}
              </span>
              {cat.name}
              {cat.children && cat.children.length > 0 && (
                 <ChevronRight className={`w-3 h-3 transition-transform ${activeParent === cat.id ? 'rotate-90' : ''}`} />
              )}
            </button>
          ))}
        </div>

        {/* Level 2 (Cascading) - Micro-interaction animation */}
        {activeParent && activeCategory?.children && activeCategory.children.length > 0 && (
          <div className="animate-slide-up origin-top">
            <div className="flex gap-2 overflow-x-auto py-2 px-1">
              {activeCategory.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => onSelect(child)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border
                    ${selectedId === child.id
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};