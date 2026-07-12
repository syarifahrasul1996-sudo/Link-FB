// components/CollapsibleSection.tsx
import React, { useState, useEffect } from 'react';
import { FacebookItem } from '../types';
import FBItemCard from './FBItemCard';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { getSafeUrlForRender } from '../utils/urlValidator';

interface CollapsibleSectionProps {
  key?: string | number;
  sectionKey: string;
  sectionIndex: number;
  items: FacebookItem[];
  startIndex: number;
  endIndex: number;
  completedIds: Set<string>;
  onToggleComplete: (id: string) => void;
  onEdit: (item: FacebookItem) => void;
  onDelete: (id: string) => void;
  deepLinkMode: boolean;
  isLastSection?: boolean;
}

export default function CollapsibleSection({
  sectionKey,
  sectionIndex,
  items,
  startIndex,
  endIndex,
  completedIds,
  onToggleComplete,
  onEdit,
  onDelete,
  deepLinkMode,
  isLastSection = false,
}: CollapsibleSectionProps) {
  // Count how many items in this section are completed
  const completedCount = items.filter(item => completedIds.has(item.id)).length;
  const totalCount = items.length;
  const isAllCompleted = completedCount === totalCount && totalCount > 0;

  const [isExpanded, setIsExpanded] = useState(!isAllCompleted);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Auto-collapse when section becomes fully completed, but allow re-opening
  useEffect(() => {
    setIsExpanded(!isAllCompleted);
  }, [isAllCompleted]);

  // Handle responsive default view mode
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setViewMode('grid');
      } else {
        setViewMode('list');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Compute selected item based on current list state
  const currentSelectedItem = items.find(item => item.id === selectedItemId) 
    || items.find(item => !completedIds.has(item.id)) 
    || items[0];

  const handleOpenLinkAndComplete = (item: FacebookItem) => {
    const safeLink = getSafeUrlForRender(item.targetUrl);
    window.open(safeLink, '_blank');
    if (!completedIds.has(item.id)) {
      onToggleComplete(item.id);
    }
    setSelectedItemId(null);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        layout: { type: 'spring', damping: 25, stiffness: 300 },
        opacity: { duration: 0.2 }
      }}
      className="w-full flex flex-col gap-1.5 mb-2"
    >
      {/* Collapsible Section Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all duration-200 select-none cursor-pointer ${
          isAllCompleted
            ? 'bg-emerald-50/60 hover:bg-emerald-50 border-emerald-200/60 text-emerald-800 shadow-xs'
            : 'bg-slate-50/80 hover:bg-slate-100/90 border-slate-200 text-slate-700 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2">
          {isAllCompleted ? (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200/80 text-slate-600 shrink-0 font-bold font-mono text-[10px]">
              {sectionIndex}
            </div>
          )}
          <span>
            {isAllCompleted ? 'Completed Section' : 'Section'} {sectionIndex}
            <span className="ml-1.5 font-normal text-slate-400">
              ({startIndex}-{endIndex})
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
              isAllCompleted
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-200/50 text-slate-600'
            }`}
          >
            {completedCount}/{totalCount} Done
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <ChevronDown className="w-4 h-4 opacity-70" />
          </motion.div>
        </div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="overflow-hidden flex flex-col gap-1.5 w-full mt-1"
          >
            {/* View Mode Controller */}
            <div className="flex justify-between items-center px-1 py-1 mb-2.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold font-sans">
                {viewMode === 'grid' ? 'Grid View (5x5)' : 'List View'}
              </span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-250">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Grid
                </button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="flex flex-col gap-1.5 w-full">
                {items.map((item) => (
                  <FBItemCard
                    key={item.id}
                    item={item}
                    isCompleted={completedIds.has(item.id)}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deepLinkMode={deepLinkMode}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 w-full">
                {/* Grid layout (5x5) */}
                <div className="grid grid-cols-5 gap-2 w-full max-w-md mx-auto">
                  {items.map((item, idx) => {
                    const isItemCompleted = completedIds.has(item.id);
                    const isSelected = currentSelectedItem && currentSelectedItem.id === item.id;
                    const itemIndex = startIndex + idx;
                    
                    let categoryColorClass = '';
                    if (isItemCompleted) {
                      categoryColorClass = 'bg-emerald-50 border-emerald-300 text-emerald-700';
                    } else {
                      switch (item.category) {
                        case 'specific':
                          categoryColorClass = 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/50';
                          break;
                        case 'my_post':
                          categoryColorClass = 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100/50';
                          break;
                        case 'group':
                        default:
                          categoryColorClass = 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100/50';
                          break;
                      }
                    }
                    
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItemId(item.id)}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative font-mono text-xs font-bold transition-all duration-150 cursor-pointer ${categoryColorClass} ${
                          isSelected ? 'ring-2 ring-slate-800 ring-offset-1 scale-105 z-10 shadow-xs' : 'shadow-2xs'
                        }`}
                      >
                        {isItemCompleted ? (
                          <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-2xs">
                            <Check className="w-2 h-2 stroke-[3]" />
                          </div>
                        ) : null}
                        <span className="text-[13px]">{itemIndex}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Grid Item Details Panel */}
                {currentSelectedItem && (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col gap-3 w-full max-w-md mx-auto shadow-2xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                            Item #{items.indexOf(currentSelectedItem) + startIndex}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                            currentSelectedItem.category === 'specific' 
                              ? 'bg-blue-100 text-blue-800' 
                              : currentSelectedItem.category === 'my_post'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-purple-100 text-purple-800'
                          }`}>
                            {currentSelectedItem.category === 'specific' ? 'Specific Post' : currentSelectedItem.category === 'my_post' ? 'My Post' : 'Group Link'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                          {currentSelectedItem.label}
                        </h4>
                        {!currentSelectedItem.isLabelOnly && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5 max-w-full font-mono">
                            {currentSelectedItem.targetUrl}
                          </p>
                        )}
                      </div>
                      
                      {/* Quick checkbox toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleComplete(currentSelectedItem.id);
                        }}
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          completedIds.has(currentSelectedItem.id)
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                        }`}
                        title={completedIds.has(currentSelectedItem.id) ? "Mark incomplete" : "Mark complete"}
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>

                    <div className="flex gap-2 w-full mt-0.5">
                      {!currentSelectedItem.isLabelOnly ? (
                        <button
                          type="button"
                          onClick={() => handleOpenLinkAndComplete(currentSelectedItem)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open & Complete
                        </button>
                      ) : (
                        <div className="flex-1 bg-slate-100 text-slate-400 font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed">
                          No URL Available
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => onEdit(currentSelectedItem)}
                        className="bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600 p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                        title="Edit Link"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Delete this link?")) {
                            onDelete(currentSelectedItem.id);
                          }
                        }}
                        className="bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95 text-slate-500 p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                        title="Delete Link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {!isLastSection && (
              <div className="py-2.5 flex items-center justify-center">
                <div className="w-12 h-[1px] bg-slate-200/80" />
                <div className="mx-2 w-1.5 h-1.5 rounded-full border border-slate-200 bg-slate-50" />
                <div className="w-12 h-[1px] bg-slate-200/80" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

