// components/CollapsibleSection.tsx
import React from 'react';
import { FacebookItem } from '../types';
import FBItemCard from './FBItemCard';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

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

  return (
    <div className="w-full flex flex-col gap-1.5 mb-1.5">
      <AnimatePresence initial={false}>
        {isAllCompleted ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="flex items-center justify-center py-2 px-3 bg-slate-100/60 border border-slate-200/50 rounded-xl text-[10px] font-medium text-slate-400 select-none text-center"
          >
            <Check className="w-3.5 h-3.5 text-emerald-500 mr-1.5 stroke-[2.5]" />
            Completed Section {sectionIndex} ({totalCount} links Done)
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-1.5 w-full"
          >
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
