// components/ProgressTracker.tsx
import React from 'react';
import { AccountProgress, FacebookItem } from '../types';
import { Bookmark, FileText, Users, Award } from 'lucide-react';

interface ProgressTrackerProps {
  progress: AccountProgress;
  accountName: string;
  items?: FacebookItem[];
  completedIds?: Set<string>;
}

export default function ProgressTracker({ 
  progress, 
  accountName, 
  items = [], 
  completedIds = new Set() 
}: ProgressTrackerProps) {
  
  const specificItems = items.filter(item => item.category === 'specific');
  const myPostItems = items.filter(item => item.category === 'my_post');
  const groupItems = items.filter(item => item.category === 'group');

  const activeSpecificCompleted = specificItems.filter(item => completedIds.has(item.id)).length;
  const activeMyPostCompleted = myPostItems.filter(item => completedIds.has(item.id)).length;
  const activeGroupCompleted = groupItems.filter(item => completedIds.has(item.id)).length;

  const totalProgressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  const is100Percent = progress.completed === progress.total && progress.total > 0;

  // Percentage metrics for subcategories
  const specificPercentage = specificItems.length > 0 ? (activeSpecificCompleted / specificItems.length) * 100 : 0;
  const myPostPercentage = myPostItems.length > 0 ? (activeMyPostCompleted / myPostItems.length) * 100 : 0;
  const groupPercentage = groupItems.length > 0 ? (activeGroupCompleted / groupItems.length) * 100 : 0;

  return (
    <div className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/55 shadow-3xs p-3.5 flex flex-col gap-2.5 animate-fade-in">
      
      {/* Top overall compact status header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            {accountName} Statistics
          </span>
          {is100Percent && (
            <span className="bg-amber-100/80 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-200/50 uppercase tracking-wide flex items-center gap-0.5 backdrop-blur-xs">
              <Award className="w-2.5 h-2.5 fill-current" /> Complete
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Progress: <span className="font-extrabold text-slate-800">{progress.completed}/{progress.total}</span>
          </span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded backdrop-blur-xs ${
            is100Percent ? 'bg-amber-100/80 text-amber-800 border border-amber-200/30' : 'bg-blue-50/70 text-blue-700 border border-blue-105'
          }`}>
            {Math.round(totalProgressPercentage)}% Done
          </span>
        </div>
      </div>

      {/* Clean compact overall progress bar */}
      <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden border border-white/20">
        <div
          className="h-full bg-linear-to-r from-blue-500 to-sky-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${totalProgressPercentage}%` }}
        />
      </div>

    </div>
  );
}
