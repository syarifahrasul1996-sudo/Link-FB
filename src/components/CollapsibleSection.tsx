// components/CollapsibleSection.tsx
import React, { useState, useEffect } from 'react';
import { FacebookItem } from '../types';
import FBItemCard from './FBItemCard';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown, ExternalLink, Edit2, Trash2, Calendar, FileText, Users, Bookmark, Link2 } from 'lucide-react';
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
      className="w-full flex flex-col gap-2 mb-3"
    >
      {/* Collapsible Section Header with modern, premium styling */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between py-3 px-4.5 rounded-2xl border text-xs font-semibold transition-all duration-250 select-none cursor-pointer outline-none hover:shadow-xs active:scale-[0.99] ${
          isAllCompleted
            ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs hover:bg-emerald-600'
            : 'bg-white/80 hover:bg-white border-slate-200 text-slate-700 shadow-2xs backdrop-blur-xs'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isAllCompleted ? (
            <div className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-white text-emerald-600 shadow-2xs shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0 font-extrabold font-mono text-[10px]">
              {sectionIndex}
            </div>
          )}
          <span className="font-sans text-[12.5px] tracking-tight">
            {isAllCompleted ? 'Completed Section' : 'Section'} {sectionIndex}
            <span className={`ml-1.5 font-semibold text-[10.5px] font-mono ${isAllCompleted ? 'text-emerald-100/90' : 'text-slate-400'}`}>
              [#{startIndex} - #{endIndex}]
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
              isAllCompleted
                ? 'bg-emerald-600/50 text-emerald-50'
                : 'bg-slate-100 text-slate-600 border border-slate-200/60'
            }`}
          >
            {completedCount}/{totalCount} Done
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <ChevronDown className={`w-4 h-4 ${isAllCompleted ? 'text-white' : 'text-slate-400'}`} />
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
            className="overflow-hidden flex flex-col gap-2 w-full mt-0.5 px-3.5"
          >
            {/* View Mode Controller */}
            <div className="flex justify-between items-center px-1.5 py-1 mb-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold font-sans">
                {viewMode === 'grid' ? 'Grid View (5x5)' : 'List View'}
              </span>
              <div className="flex bg-slate-100 border border-slate-200/60 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all duration-150 cursor-pointer ${
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
                  className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all duration-150 cursor-pointer ${
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
              <div className="flex flex-col gap-2 w-full">
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
              <div className="flex flex-col gap-4 w-full">
                {/* 5x5 Grid Layout Redesigned - Centered Perfectly using Flex wrapping and mathematical calc sizing */}
                <div className="flex flex-wrap justify-center gap-2.5 w-full max-w-sm mx-auto">
                  {items.map((item, idx) => {
                    const isItemCompleted = completedIds.has(item.id);
                    const isSelected = currentSelectedItem && currentSelectedItem.id === item.id;
                    const itemIndex = startIndex + idx;
                    
                    let styleClass = '';
                    if (isItemCompleted) {
                      styleClass = 'bg-gradient-to-br from-emerald-500 to-teal-500 border-transparent text-white shadow-xs scale-98';
                    } else {
                      switch (item.category) {
                        case 'specific':
                          styleClass = 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-150/70 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300';
                          break;
                        case 'group':
                        default:
                          styleClass = 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-150/70 text-purple-700 hover:from-purple-100 hover:to-indigo-100 hover:border-purple-300';
                          break;
                      }
                    }
                    
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItemId(item.id)}
                        className={`w-[calc((100%-42px)/5)] aspect-square rounded-2xl border flex flex-col items-center justify-center relative font-mono text-[13px] font-extrabold transition-all duration-200 active:scale-90 hover:scale-[1.05] cursor-pointer ${styleClass} ${
                          isSelected ? 'ring-2 ring-slate-800 ring-offset-2 scale-105 z-10 shadow-sm' : 'shadow-3xs'
                        }`}
                      >
                        {isItemCompleted ? (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-white shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[4]" />
                          </div>
                        ) : null}
                        <span>{itemIndex}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Highly Polished Grid Item Details Panel */}
                {currentSelectedItem && (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 flex flex-col gap-3.5 w-full max-w-sm mx-auto shadow-xs"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 bg-slate-900 text-white rounded-full shadow-3xs">
                            Index #{items.indexOf(currentSelectedItem) + startIndex}
                          </span>
                          <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            currentSelectedItem.category === 'specific' 
                              ? 'bg-blue-100/70 text-blue-800 border border-blue-200/50' 
                              : 'bg-purple-100/70 text-purple-800 border border-purple-200/50'
                          }`}>
                            {currentSelectedItem.category === 'specific' ? (
                              <>
                                <Bookmark className="w-2.5 h-2.5" />
                                Direct Task
                              </>
                            ) : (
                              <>
                                <Users className="w-2.5 h-2.5" />
                                Group Link
                              </>
                            )}
                          </span>
                        </div>
                        <h4 className="text-[12.5px] font-bold text-slate-800 line-clamp-2 leading-snug">
                          {currentSelectedItem.label}
                        </h4>
                      </div>
                      
                      {/* Premium Circle Check Toggle inside Details Panel */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleComplete(currentSelectedItem.id);
                        }}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-95 hover:shadow-2xs ${
                          completedIds.has(currentSelectedItem.id)
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-400 hover:border-blue-500 hover:text-blue-500'
                        }`}
                        title={completedIds.has(currentSelectedItem.id) ? "Mark incomplete" : "Mark complete"}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>

                    <div className="flex gap-2 w-full pt-1 border-t border-slate-100">
                      {!currentSelectedItem.isLabelOnly ? (
                        <button
                          type="button"
                          onClick={() => handleOpenLinkAndComplete(currentSelectedItem)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Link
                        </button>
                      ) : (
                        <div className="flex-1 bg-slate-100 text-slate-400 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200/50">
                          No URL Configured
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => onEdit(currentSelectedItem)}
                        className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 text-slate-600 p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-3xs"
                        title="Edit Link Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Permanently delete this link? This will only hide it on your current device.")) {
                            onDelete(currentSelectedItem.id);
                          }
                        }}
                        className="bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95 text-slate-500 p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-3xs"
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
              <div className="py-2 flex items-center justify-center">
                <div className="w-12 h-[1px] bg-slate-200/50" />
                <div className="mx-2 w-1 h-1 rounded-full bg-slate-300" />
                <div className="w-12 h-[1px] bg-slate-200/50" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

