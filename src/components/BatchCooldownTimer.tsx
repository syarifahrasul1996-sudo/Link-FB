// components/BatchCooldownTimer.tsx
import React from 'react';
import { AccountCooldown } from '../types';
import { formatMillisecondsToCountdown, formatMalaysiaTime } from '../utils/timezone';
import { Clock, RotateCcw, X, CheckCircle2, Play, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const COOLDOWN_DURATION_MS = 90 * 60 * 1000; // 1 hour 30 minutes
export const BATCH_SIZE = 25;

interface BatchCooldownTimerProps {
  accountName: string;
  completedCount: number;
  cooldown?: AccountCooldown;
  nowTimestamp: number;
  onStartCooldown: (milestone: number) => void;
  onDismissCooldown: () => void;
}

export default function BatchCooldownTimer({
  accountName,
  completedCount,
  cooldown,
  nowTimestamp,
  onStartCooldown,
  onDismissCooldown,
}: BatchCooldownTimerProps) {
  const isAtExactMilestone = completedCount > 0 && completedCount % BATCH_SIZE === 0;
  const batchCompleted = isAtExactMilestone ? BATCH_SIZE : completedCount % BATCH_SIZE;
  const batchNumber = isAtExactMilestone
    ? completedCount / BATCH_SIZE
    : Math.floor(completedCount / BATCH_SIZE) + 1;
  const remainingForNextBatch = BATCH_SIZE - (completedCount % BATCH_SIZE);
  const batchProgressPct = (batchCompleted / BATCH_SIZE) * 100;

  const remainingMs = cooldown ? Math.max(0, cooldown.endTime - nowTimestamp) : 0;
  const isActive = cooldown?.status === 'active' && remainingMs > 0;
  const isFinished = cooldown?.status === 'finished' || (cooldown?.status === 'active' && remainingMs === 0);

  const cooldownProgressPct = isActive
    ? Math.max(0, Math.min(100, ((COOLDOWN_DURATION_MS - remainingMs) / COOLDOWN_DURATION_MS) * 100))
    : 100;

  const latestCompletedMilestone = Math.floor(completedCount / BATCH_SIZE) * BATCH_SIZE;

  return (
    <AnimatePresence mode="wait">
      {isActive && cooldown ? (
        <motion.div
          key="cooldown-active"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 rounded-xl p-3.5 border border-amber-200/90 shadow-3xs flex flex-col gap-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Timer className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest">
                    1h 30m Break Active
                  </span>
                  <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 border border-amber-300/60 font-mono">
                    {cooldown.milestone} Links Done
                  </span>
                </div>
                <p className="text-[11px] font-medium text-amber-700/90 truncate mt-0.5">
                  {accountName} &middot; Ready at{' '}
                  <span className="font-bold text-amber-900">
                    {formatMalaysiaTime(cooldown.endTime)} MYT
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-amber-200/80 shadow-3xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-mono text-sm sm:text-base font-extrabold text-amber-950 tabular-nums tracking-tight">
                  {formatMillisecondsToCountdown(remainingMs)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onStartCooldown(cooldown.milestone)}
                className="p-2 rounded-xl bg-white/80 hover:bg-white border border-amber-200/80 text-amber-700 hover:text-amber-900 transition-all active:scale-95 cursor-pointer shadow-3xs"
                title="Reset 1h 30m countdown"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onDismissCooldown}
                className="p-2 rounded-xl bg-white/80 hover:bg-white border border-amber-200/80 text-amber-600 hover:text-red-600 transition-all active:scale-95 cursor-pointer shadow-3xs"
                title="Dismiss countdown"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-amber-200/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${cooldownProgressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-amber-700/80">
              <span>
                Total completed today: <span className="font-mono font-bold text-amber-900">{completedCount}</span>
              </span>
              <span>
                Next trigger at <span className="font-mono font-bold text-amber-900">{Math.floor(completedCount / BATCH_SIZE) * BATCH_SIZE + BATCH_SIZE}</span> links
              </span>
            </div>
          </div>
        </motion.div>
      ) : isFinished && cooldown ? (
        <motion.div
          key="cooldown-finished"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="bg-gradient-to-r from-emerald-50 to-teal-50/80 rounded-xl p-3.5 border border-emerald-200 shadow-3xs flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest">
                  1h 30m Break Complete
                </span>
                <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                  After {cooldown.milestone} Links
                </span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                {accountName} is ready for the next 25 links!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => onStartCooldown(latestCompletedMilestone || cooldown.milestone)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs"
            >
              <RotateCcw className="w-3 h-3" />
              Restart 1h 30m
            </button>
            <button
              type="button"
              onClick={onDismissCooldown}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              Continue
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="cooldown-idle"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl p-3 border border-slate-200 shadow-3xs flex flex-col gap-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest">
                Batch {batchNumber} &middot; 1h 30m Break Tracker
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">
                <span className="font-mono font-extrabold text-slate-800">{batchCompleted}</span>
                <span className="font-mono text-slate-400">/{BATCH_SIZE}</span>
                <span className="hidden sm:inline text-slate-400 ml-1.5 text-[10px]">
                  {isAtExactMilestone
                    ? `(Batch ${batchNumber} complete • next break at ${completedCount + BATCH_SIZE})`
                    : `(${remainingForNextBatch} link${remainingForNextBatch === 1 ? '' : 's'} until 1h 30m break)`}
                </span>
              </span>

              {latestCompletedMilestone >= BATCH_SIZE && (
                <button
                  type="button"
                  onClick={() => onStartCooldown(latestCompletedMilestone)}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-800 text-[10px] font-extrabold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="Start 1 hour 30 minute countdown"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  Start 1h 30m
                </button>
              )}
            </div>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${batchProgressPct}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
