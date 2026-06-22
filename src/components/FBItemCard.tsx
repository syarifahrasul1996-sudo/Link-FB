// components/FBItemCard.tsx
import React, { useRef } from 'react';
import { FacebookItem } from '../types';
import { ExternalLink, Check, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface FBItemCardProps {
  key?: string | number;
  item: FacebookItem;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
  onEdit: (item: FacebookItem) => void;
  onDelete: (id: string) => void;
  deepLinkMode: boolean;
}

export default function FBItemCard({
  item,
  isCompleted,
  onToggleComplete,
  onEdit,
  onDelete,
  deepLinkMode,
}: FBItemCardProps) {
  const finalLink = item.targetUrl;
  const constraintsRef = useRef<HTMLDivElement>(null);

  const handleLinkClick = () => {
    if (!isCompleted) {
      onToggleComplete(item.id);
    }
  };

  const handleToggleOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete(item.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(item);
  };

  const getBorderColorClass = () => {
    if (isCompleted) return 'border-l-3 border-l-slate-200';
    switch (item.category) {
      case 'specific':
        return 'border-l-3 border-l-blue-500';
      case 'my_post':
        return 'border-l-3 border-l-sky-400';
      case 'group':
      default:
        return 'border-l-3 border-l-purple-400';
    }
  };

  return (
    <div 
      ref={constraintsRef} 
      className="relative overflow-hidden rounded-xl bg-slate-50 w-full select-none"
    >
      {/* Background deletion alert panel */}
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-start px-4 text-white font-bold text-xs gap-1.5 select-none rounded-xl">
        <div className="flex items-center gap-1.5 animate-pulse">
          <Trash2 className="w-3.5 h-3.5 text-white" />
          <span>Deleting link...</span>
        </div>
      </div>

      {/* Swipeable Foreground Module */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 140 }}
        dragElastic={{ left: 0.1, right: 0.3 }}
        onDragEnd={(_event, info) => {
          if (info.offset.x > 100 || info.velocity.x > 180) {
            onDelete(item.id);
          }
        }}
        onClick={handleToggleOnly}
        className={`group relative flex items-center justify-between py-1.5 px-3 rounded-xl border text-left cursor-pointer transition-shadow duration-150 min-h-[40px] ${getBorderColorClass()} ${
          isCompleted
            ? 'bg-slate-100/95 border-slate-200/60 hover:bg-slate-100'
            : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-305'
        }`}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 pointer-events-auto">
          {/* Completion Checkbox */}
          <button
            onClick={handleToggleOnly}
            className={`w-4 h-4 flex items-center justify-center rounded-md border shrink-0 transition-all cursor-pointer ${
              isCompleted
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'border-slate-200 bg-white text-transparent hover:border-slate-300 group-hover:text-slate-400 group-hover:border-slate-300'
            }`}
            title={isCompleted ? "Mark incomplete" : "Mark complete"}
          >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </button>

          {/* Brand label */}
          <a
            href={finalLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              handleLinkClick();
            }}
            className="flex-1 min-w-0 flex flex-col leading-tight cursor-pointer hover:underline"
            title="Open link"
          >
            <span
              className={`text-[11.5px] font-medium leading-normal line-clamp-1 truncate ${
                isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'
              }`}
            >
              {item.label}
            </span>
            <span className="text-[9.5px] text-slate-400 truncate max-w-[95%]">
              {finalLink}
            </span>
          </a>
        </div>

        <div className="flex items-center gap-1 shrink-0 pl-1 pointer-events-auto">
          {/* Edit button */}
          <button 
            onClick={handleEditClick} 
            className="p-1 rounded text-slate-400 hover:bg-slate-150 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
            title="Edit link"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          {/* Link indicator */}
          <a
            href={finalLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              handleLinkClick();
            }}
            className="p-1 rounded bg-slate-50 text-slate-450 hover:text-slate-600 transition-all cursor-pointer"
            title="Open link"
          >
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
