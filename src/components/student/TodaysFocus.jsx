import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function TodaysFocus() {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ backgroundColor: 'rgba(98,191,161,0.06)', borderColor: 'rgba(98,191,161,0.25)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4" style={{ color: 'rgb(246,178,59)' }} />
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Focus</div>
      </div>
      <div className="text-base font-semibold text-slate-800 mb-3">
        SAT Math — timing strategy and no-calculator drills
      </div>
      <div className="h-2 rounded-full bg-white border border-slate-200">
        <div className="h-2 w-3/4 rounded-full" style={{ backgroundColor: 'rgb(98,191,161)' }} />
      </div>
      <div className="mt-1.5 text-xs text-slate-500">75% of weekly prep plan completed</div>
    </div>
  );
}