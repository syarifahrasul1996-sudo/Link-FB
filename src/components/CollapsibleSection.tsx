// components/CollapsibleSection.tsx
import React, { useState, useEffect } from 'react';
import { FacebookItem } from '../types';
import FBItemCard from './FBItemCard';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';

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

  // Auto-collapse when section becomes fully completed, but allow re-opening
  useEffect(() => {
    setIsExpanded(!isAllCompleted);
  }, [isAllCompleted]);

  return (
    <div className="w-full flex flex-col gap-1.5 mb-2">
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
    </div>
  );
}

