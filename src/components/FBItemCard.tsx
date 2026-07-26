// components/FBItemCard.tsx
import React, { useRef } from 'react';
import { FacebookItem } from '../types';
import { ExternalLink, Check, Edit2, Trash2, Link2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { getSafeUrlForRender } from '../utils/urlValidator';

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

  // Modern background categories with solid, elegant pastel colors to prevent background panel bleeding through
  const getCardStyleClass = () => {
    if (isCompleted) {
      return 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100';
    }
    switch (item.category) {
      case 'specific':
        return 'bg-blue-50 border-blue-100/80 hover:bg-blue-100 hover:border-blue-200 hover:shadow-xs';
      case 'group':
      default:
        return 'bg-purple-50 border-purple-100/80 hover:bg-purple-100 hover:border-purple-200 hover:shadow-xs';
    }
  };

  const getIndicatorDotClass = () => {
    if (isCompleted) return 'bg-emerald-500';
    switch (item.category) {
      case 'specific':
        return 'bg-blue-500';
      case 'group':
      default:
        return 'bg-purple-500';
    }
  };

  const safeLink = getSafeUrlForRender(finalLink);

  return (
    <div 
      ref={constraintsRef} 
      className="relative overflow-hidden rounded-xl bg-slate-50 w-full select-none shadow-2xs"
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
        className={`group relative flex items-center justify-between py-2.5 px-4 rounded-xl border text-left cursor-pointer transition-all duration-150 min-h-[44px] ${getCardStyleClass()}`}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 pointer-events-auto">
          {/* Custom Circle/Pill Checkbox */}
          <button
            onClick={handleToggleOnly}
            className={`w-5 h-5 flex items-center justify-center rounded-full border shrink-0 transition-all cursor-pointer ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                : 'border-slate-300 bg-white text-transparent hover:border-blue-500 hover:bg-blue-50/20'
            }`}
            title={isCompleted ? "Mark incomplete" : "Mark complete"}
          >
            <Check className={`w-3 h-3 stroke-[3] transition-transform ${isCompleted ? 'scale-100' : 'scale-0'}`} />
          </button>

          {/* Category Vertical Indicator Line */}
          <div className={`w-1 h-6 rounded-full shrink-0 ${getIndicatorDotClass()}`} />

          {/* Brand label */}
          {!item.isLabelOnly ? (
            <a
              href={safeLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                handleLinkClick();
              }}
              className="flex-1 min-w-0 flex flex-col leading-snug cursor-pointer group/link"
              title="Open link in new window"
            >
              <span
                className={`text-[12px] font-semibold leading-snug line-clamp-1 transition-colors ${
                  isCompleted 
                    ? 'text-slate-400 line-through font-normal' 
                    : 'text-slate-700 group-hover/link:text-blue-600'
                }`}
              >
                {item.label}
              </span>
            </a>
          ) : (
            <div className="flex-1 min-w-0 flex flex-col leading-snug select-none">
              <span
                className={`text-[12px] font-semibold leading-snug line-clamp-1 ${
                  isCompleted ? 'text-slate-400 line-through font-normal' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
              <span className="text-[9.5px] text-amber-600/90 font-medium flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3" />
                Missing URL
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-2 pointer-events-auto">
          {/* Edit button */}
          <button 
            onClick={handleEditClick} 
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
            title="Edit link label or URL"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Link indicator */}
          {!item.isLabelOnly ? (
            <a
              href={safeLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                handleLinkClick();
              }}
              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer flex items-center justify-center"
              title="Open and visit link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span 
              className="p-1.5 rounded-lg bg-slate-100 text-slate-300 cursor-not-allowed flex items-center justify-center"
              title="No link URL defined"
            >
              <ExternalLink className="w-3.5 h-3.5 opacity-40" />
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
