import React from 'react';
import { TrendingUp } from 'lucide-react';

// Renders the focus item a tutor set for this student. With nothing recorded
// the card explains that plainly rather than showing an invented plan.
export default function TodaysFocus({ focus }) {
  const hasFocus = Boolean(focus?.title);

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ backgroundColor: 'rgba(98,191,161,0.06)', borderColor: 'rgba(98,191,161,0.25)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4" style={{ color: 'rgb(246,178,59)' }} />
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Focus</div>
      </div>

      {hasFocus ? (
        <>
          <div className="text-base font-semibold text-slate-800 mb-3">{focus.title}</div>
          {focus.description && (
            <p className="-mt-2 mb-3 text-sm text-slate-600 leading-relaxed">{focus.description}</p>
          )}
          <div className="h-2 rounded-full bg-white border border-slate-200">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${focus.progress_percent}%`, backgroundColor: 'rgb(98,191,161)' }}
            />
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            {focus.progress_percent}% of this plan completed
          </div>
        </>
      ) : (
        <div className="text-sm text-slate-500 leading-relaxed">
          Your tutor has not set a focus for this week yet. It will appear here once they do.
        </div>
      )}
    </div>
  );
}
