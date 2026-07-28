import React from 'react';

// Progress metrics recorded by the student's tutor. Nothing is invented: with
// no records the dashboard says so instead of displaying placeholder numbers.
export default function MetricCards({ metrics }) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center">
        <div className="text-sm font-medium text-slate-600">No progress recorded yet</div>
        <p className="mt-1 text-xs text-slate-400">
          Your tutor adds practice scores and milestones here as you work through your sessions.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((m) => (
        <div
          key={m.id || m.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderTop: '3px solid rgb(98,191,161)' }}
        >
          <div className="text-xs text-slate-500 mb-2">{m.label}</div>
          <div className="text-2xl font-bold text-slate-900">
            {m.value}
            {m.unit && <span className="ml-1 text-sm font-medium text-slate-400">{m.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
