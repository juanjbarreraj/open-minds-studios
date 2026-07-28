import React, { useEffect, useState } from 'react';
import { tutorsApi } from '@/api/tutorsApi';
import { coursesApi, tutorCoursesApi } from '@/api/coursesApi';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export default function TutorCourseManager() {
  const [tutors, setTutors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tutorCourses, setTutorCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [t, c, tc] = await Promise.all([
        tutorsApi.list(),
        coursesApi.list(),
        tutorCoursesApi.list(),
      ]);
      setTutors(t);
      setCourses(c);
      setTutorCourses(tc);
    } catch (err) {
      flash(err?.message || 'Assignments could not be loaded.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleAssign = async () => {
    if (!selectedTutor || !selectedCourse) return;
    const exists = tutorCourses.find(tc => tc.tutor_id === selectedTutor && tc.course_id === selectedCourse);
    if (exists) { flash('Assignment already exists.'); return; }
    setSaving(true);
    try {
      await tutorCoursesApi.create(selectedTutor, selectedCourse);
      flash('Course assigned.');
      setSelectedTutor('');
      setSelectedCourse('');
      load();
    } catch (err) {
      if (err?.status === 409) { flash('Assignment already exists.'); }
      else { flash(err?.message || 'Something went wrong.'); }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await tutorCoursesApi.remove(id);
      flash('Assignment removed.');
      load();
    } catch (err) {
      flash(err?.message || 'That assignment could not be removed.');
    }
  };

  // Group by tutor
  const grouped = tutors.map(t => ({
    tutor: t,
    assignments: tutorCourses.filter(tc => tc.tutor_id === t.id),
  })).filter(g => g.assignments.length > 0);

  return (
    <div className="space-y-4">
      {msg && <div className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</div>}

      {/* Assign form */}
      <div className="rounded-2xl border border-brand-blue/15 bg-brand-blue/10 p-5 space-y-3">
        <div className="text-sm font-semibold text-brand-blue-deep">Assign Course to Tutor</div>
        <div className="flex flex-wrap gap-3">
          <select value={selectedTutor} onChange={e => setSelectedTutor(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm flex-1 min-w-[160px]">
            <option value="">Select Tutor…</option>
            {tutors.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm flex-1 min-w-[160px]">
            <option value="">Select Course…</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>)}
          </select>
          <button onClick={handleAssign} disabled={saving || !selectedTutor || !selectedCourse} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-deep disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Assign
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-400">No assignments yet.</div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ tutor, assignments }) => (
            <div key={tutor.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 font-semibold text-slate-800">{tutor.full_name} <span className="text-sm font-normal text-slate-400">({tutor.email})</span></div>
              <div className="flex flex-wrap gap-2">
                {assignments.map(tc => {
                  const c = courses.find(c => c.id === tc.course_id);
                  return (
                    <span key={tc.id} className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-medium text-brand-blue-deep">
                      {c ? `${c.course_code} - ${c.course_name}` : tc.course_id}
                      <button onClick={() => handleDelete(tc.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}