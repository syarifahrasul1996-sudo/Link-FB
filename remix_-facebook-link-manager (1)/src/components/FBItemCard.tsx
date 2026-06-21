// components/FBItemCard.tsx
import React from 'react';
import { FacebookItem } from '../types';
import { ExternalLink, Check, Bookmark, FileText, Users } from 'lucide-react';

interface FBItemCardProps {
  key?: string;
  item: FacebookItem;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
  deepLinkMode: boolean;
}

export default function FBItemCard({
  item,
  isCompleted,
  onToggleComplete,
  deepLinkMode,
}: FBItemCardProps) {
  // Always use the direct targetUrl to comply with standard browser link opening
  const finalLink = item.targetUrl;

  const handleLinkClick = () => {
    // Mark as completed when the link is clicked, if it's not already completed
    if (!isCompleted) {
      onToggleComplete(item.id);
    }
  };

  const handleToggleOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete(item.id);
  };

  // Get accent styles based on category type
  const getCategoryStyles = () => {
    switch (item.category) {
      case 'specific':
        return {
          borderClass: 'border-l-3 border-l-blue-500',
          hoverBorder: 'hover:border-blue-305',
          icon: <Bookmark className="w-3 h-3 text-blue-500 shrink-0" />,
        };
      case 'my_post':
        return {
          borderClass: 'border-l-3 border-l-sky-500',
          hoverBorder: 'hover:border-sky-305',
          icon: <FileText className="w-3 h-3 text-sky-500 shrink-0" />,
        };
      case 'group':
      default:
        return {
          borderClass: 'border-l-3 border-l-purple-500',
          hoverBorder: 'hover:border-purple-305',
          icon: <Users className="w-3 h-3 text-purple-500 shrink-0" />,
        };
    }
  };

  const styles = getCategoryStyles();

  return (
    <div
      id={item.id}
      onClick={handleToggleOnly}
      className={`group relative flex items-center justify-between py-2 px-3 rounded-xl border text-left cursor-pointer transition-all duration-150 active:scale-[0.985] select-none text-xs gap-2 min-h-[46px] shadow-2xs ${
        isCompleted
          ? 'bg-blue-50/50 backdrop-blur-xs border-blue-200 hover:bg-blue-50 hover:border-blue-300'
          : `bg-white/75 backdrop-blur-xs border-white/60 hover:bg-white/90 ${styles.hoverBorder} ${styles.borderClass}`
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Completion Checkbox */}
        <button
          onClick={handleToggleOnly}
          className={`w-5 h-5 flex items-center justify-center rounded-lg border shrink-0 transition-all ${
            isCompleted
              ? 'bg-blue-500 border-blue-600 text-white'
              : 'border-slate-200 bg-white/50 text-transparent hover:border-slate-300 group-hover:text-slate-400 group-hover:border-slate-300'
          }`}
          title={isCompleted ? "Mark incomplete" : "Mark complete"}
        >
          <Check className="w-3 h-3 stroke-[3]" />
        </button>

        {/* Brand label & description inside standard hyperlink to prevent sandbox popup blockers */}
        <a
          href={finalLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation(); // Avoid double toggling via card onClick
            handleLinkClick();
          }}
          className="flex-1 min-w-0 flex flex-col leading-normal cursor-pointer hover:underline"
          title="Open direct raw folder/media link"
        >
          <span
            className={`font-semibold text-slate-800 line-clamp-1 truncate ${
              isCompleted ? 'text-slate-400 line-through font-normal' : 'text-slate-800'
            }`}
          >
            {item.label}
          </span>
          <span className="text-[10px] text-slate-400 truncate mt-0.5 max-w-[95%]">
            {finalLink}
          </span>
        </a>
      </div>

      <a
        href={finalLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.stopPropagation(); // Avoid double toggling via card onClick
          handleLinkClick();
        }}
        className="flex items-center gap-1.5 shrink-0 pl-1 cursor-pointer"
      >
        {/* Category specific dynamic icon indicator */}
        <span className="opacity-45 group-hover:opacity-100 transition-opacity">
          {styles.icon}
        </span>
        {/* Link indicator */}
        <span className="p-1 rounded-md bg-slate-50 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-2.5 h-2.5" />
        </span>
      </a>
    </div>
  );
}
