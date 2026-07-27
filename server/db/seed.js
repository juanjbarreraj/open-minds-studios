// Repeatable seed for local development. Wipes all application data and
// inserts clearly labeled demo accounts plus sample scheduling data.
// These accounts are LOCAL DEMONSTRATION ACCOUNTS ONLY and must never be
// carried into a production environment.
import bcrypt from 'bcryptjs';
import db from './database.js';
import { runMigrations } from './migrate.js';
import { newId } from '../lib/ids.js';
import { todayInAppTz, nextDateForWeekday, addDays, weekdayName } from '../lib/time.js';

export function runSeed() {
  runMigrations();

  const wipe = db.transaction(() => {
    for (const table of [
      'notification_outbox', 'inquiries', 'modules', 'files', 'bookings',
      'availability_slots', 'tutor_courses', 'courses', 'tutors', 'students',
      'sessions', 'users',
    ]) {
      db.prepare(`DELETE FROM ${table}`).run();
    }
  });
  wipe();

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const insertUser = db.prepare(`INSERT INTO users (id, email, password_hash, full_name, role, approved)
    VALUES (@id, @email, @password_hash, @full_name, @role, @approved)`);
  const insertStudent = db.prepare(`INSERT INTO students
    (id, user_id, first_name, last_name, full_name, email, phone, approved, can_access_student_portal, auth_provider, notes)
    VALUES (@id, @user_id, @first_name, @last_name, @full_name, @email, @phone, @approved, @can_access_student_portal, 'email', @notes)`);
  const insertTutor = db.prepare(`INSERT INTO tutors
    (id, user_id, full_name, email, phone, approved, bio, can_access_manager_dashboard, is_super_admin, auth_provider)
    VALUES (@id, @user_id, @full_name, @email, @phone, @approved, @bio, @can_access_manager_dashboard, @is_super_admin, 'email')`);

  // Demo users (documented in the README / LOCAL_DEVELOPMENT.md)
  const studentUserId = newId();
  insertUser.run({
    id: studentUserId, email: 'student@demo.local', password_hash: hash('student123'),
    full_name: 'Alex Rivera', role: 'student_parent', approved: 1,
  });
  const studentId = newId();
  insertStudent.run({
    id: studentId, user_id: studentUserId, first_name: 'Alex', last_name: 'Rivera',
    full_name: 'Alex Rivera', email: 'student@demo.local', phone: '555-0101',
    approved: 1, can_access_student_portal: 1, notes: 'Demo student account (local only).',
  });

  const tutorUserId = newId();
  insertUser.run({
    id: tutorUserId, email: 'tutor@demo.local', password_hash: hash('tutor123'),
    full_name: 'Jordan Blake', role: 'tutor', approved: 1,
  });
  const tutorId = newId();
  insertTutor.run({
    id: tutorId, user_id: tutorUserId, full_name: 'Jordan Blake', email: 'tutor@demo.local',
    phone: '555-0102', approved: 1, bio: 'SAT math and AP calculus specialist. Demo tutor account (local only).',
    can_access_manager_dashboard: 0, is_super_admin: 0,
  });

  const managerUserId = newId();
  insertUser.run({
    id: managerUserId, email: 'manager@demo.local', password_hash: hash('manager123'),
    full_name: 'Morgan Ellis', role: 'manager', approved: 1,
  });
  const managerTutorId = newId();
  insertTutor.run({
    id: managerTutorId, user_id: managerUserId, full_name: 'Morgan Ellis', email: 'manager@demo.local',
    phone: '555-0103', approved: 1, bio: 'Program director. Demo manager account (local only).',
    can_access_manager_dashboard: 1, is_super_admin: 1,
  });

  const pendingUserId = newId();
  insertUser.run({
    id: pendingUserId, email: 'pending@demo.local', password_hash: hash('pending123'),
    full_name: 'Casey Morgan', role: 'student_parent', approved: 0,
  });
  insertStudent.run({
    id: newId(), user_id: pendingUserId, first_name: 'Casey', last_name: 'Morgan',
    full_name: 'Casey Morgan', email: 'pending@demo.local', phone: '',
    approved: 0, can_access_student_portal: 0, notes: 'Unapproved demo account for access-control testing.',
  });

  // Courses
  const insertCourse = db.prepare('INSERT INTO courses (id, course_code, course_name) VALUES (?, ?, ?)');
  const satMathId = newId();
  const apCalcId = newId();
  const actEnglishId = newId();
  insertCourse.run(satMathId, 'SAT-MATH', 'SAT Math Preparation');
  insertCourse.run(apCalcId, 'AP-CALC', 'AP Calculus AB');
  insertCourse.run(actEnglishId, 'ACT-ENG', 'ACT English and Reading');

  const insertTC = db.prepare('INSERT INTO tutor_courses (id, tutor_id, course_id) VALUES (?, ?, ?)');
  insertTC.run(newId(), tutorId, satMathId);
  insertTC.run(newId(), tutorId, apCalcId);
  insertTC.run(newId(), managerTutorId, actEnglishId);

  // Availability: Jordan covers the canonical 9-to-5 Monday window used by the
  // scheduling tests (last bookable start 16:00), plus two shorter windows.
  const insertSlot = db.prepare(`INSERT INTO availability_slots (id, tutor_id, day_of_week, start_time, end_time, is_active)
    VALUES (?, ?, ?, ?, ?, 1)`);
  const mondaySlotId = newId();
  insertSlot.run(mondaySlotId, tutorId, 'Monday', '09:00', '17:00');
  insertSlot.run(newId(), tutorId, 'Wednesday', '13:00', '17:00');
  insertSlot.run(newId(), tutorId, 'Saturday', '10:00', '14:00');
  insertSlot.run(newId(), managerTutorId, 'Tuesday', '10:00', '15:00');

  // Sample bookings for the demo student with real session dates.
  const today = todayInAppTz();
  const nextMonday = nextDateForWeekday(addDays(today, 1), 'Monday');
  const nextWednesday = nextDateForWeekday(addDays(today, 1), 'Wednesday');
  const insertBooking = db.prepare(`INSERT INTO bookings
    (id, tutor_id, student_id, student_first_name, student_last_name, student_email, student_phone,
     course_id, assignment_description, session_date, preferred_day, preferred_start_time, preferred_end_time,
     slot_id, meeting_type, status)
    VALUES (@id, @tutor_id, @student_id, 'Alex', 'Rivera', 'student@demo.local', '555-0101',
     @course_id, @assignment_description, @session_date, @preferred_day, @start, @end,
     @slot_id, @meeting_type, @status)`);
  insertBooking.run({
    id: newId(), tutor_id: tutorId, student_id: studentId, course_id: satMathId,
    assignment_description: 'Practice test review\n\nGo over sections 3 and 4 of the last practice SAT.',
    session_date: nextMonday, preferred_day: weekdayName(nextMonday), start: '10:00', end: '11:00',
    slot_id: mondaySlotId, meeting_type: 'Online', status: 'confirmed',
  });
  insertBooking.run({
    id: newId(), tutor_id: tutorId, student_id: studentId, course_id: apCalcId,
    assignment_description: 'Derivatives homework\n\nChain rule practice problems from chapter 3.',
    session_date: nextWednesday, preferred_day: weekdayName(nextWednesday), start: '14:00', end: '15:00',
    slot_id: null, meeting_type: 'Online', status: 'pending',
  });

  // Sample module assigned to the demo student.
  db.prepare(`INSERT INTO modules (id, tutor_id, student_id, student_email, tutor_name, student_name, name, description, status)
    VALUES (?, ?, ?, 'student@demo.local', 'Jordan Blake', 'Alex Rivera', ?, ?, 'assigned')`)
    .run(newId(), tutorId, studentId,
      'Linear Equations Worksheet',
      'Complete the practice problems and upload your work before our next session.');

  // Sample inquiry.
  db.prepare(`INSERT INTO inquiries (id, parent_name, email, student_grade, subject_or_exam, goals, message, interested_program)
    VALUES (?, 'Taylor Demo', 'parent@demo.local', '11th Grade', 'SAT', 'Raise math score by 100 points', 'Sample inquiry created by the local seed script.', 'Score Boost Program')`)
    .run(newId());

  console.log('[db] seed complete. Local demo accounts:');
  console.log('  student@demo.local / student123   (approved student)');
  console.log('  tutor@demo.local   / tutor123     (approved tutor)');
  console.log('  manager@demo.local / manager123   (manager + super admin)');
  console.log('  pending@demo.local / pending123   (unapproved, for access-control testing)');
}

if (process.argv[1].endsWith('seed.js')) {
  runSeed();
}
