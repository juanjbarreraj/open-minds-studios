import React, { useState } from 'react';
import { Users, BookOpen } from 'lucide-react';
import AssignModuleModal from './AssignModuleModal';

export default function MyStudentsSection({ bookings, onModuleAssigned }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [assigningStudent, setAssigningStudent] = useState(null);

  // Derive unique accepted students from confirmed bookings
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

  const studentMap = {};
  for (const b of confirmedBookings) {
    const key = b.student_email;
    if (!studentMap[key]) {
      studentMap[key] = {
        email: b.student_email,
        name: `${b.student_first_name} ${b.student_last_name}`.trim(),
        firstName: b.student_first_name,
        lastName: b.student_last_name,
      };
    }
  }
  const students = Object.values(studentMap);

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-12 text-center shadow-sm">
        <Users className="mb-3 h-9 w-9 text-slate-300" />
        <p className="text-sm font-medium text-slate-500">No students yet</p>
        <p className="mt-1 text-xs text-slate-400">Students appear here once you accept an appointment.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {students.map(s => (
          <div
            key={s.email}
            className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300"
            onMouseEnter={() => setHoveredId(s.email)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, rgb(58,154,202), rgb(98,191,161))' }}>
                {s.firstName?.[0]}{s.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">{s.name}</div>
                <div className="text-xs text-slate-400 truncate">{s.email}</div>
              </div>
            </div>

            {hoveredId === s.email && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm">
                <button
                  onClick={() => setAssigningStudent(s)}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, rgb(58,154,202), rgb(98,191,161))' }}
                >
                  <BookOpen className="h-4 w-4" />
                  Assign Modules
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {assigningStudent && (
        <AssignModuleModal
          student={assigningStudent}
          onClose={() => setAssigningStudent(null)}
          onSuccess={() => {
            setAssigningStudent(null);
            onModuleAssigned?.();
          }}
        />
      )}
    </>
  );
}