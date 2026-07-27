import { Router } from 'express';
import {
  requireAuth, requireManager, requireApprovedTutor, requireApprovedStudent,
} from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';
import * as students from '../controllers/studentsController.js';
import * as tutors from '../controllers/tutorsController.js';
import * as courses from '../controllers/coursesController.js';
import * as availability from '../controllers/availabilityController.js';
import * as bookings from '../controllers/bookingsController.js';
import * as modules from '../controllers/modulesController.js';
import * as inquiries from '../controllers/inquiriesController.js';
import * as files from '../controllers/filesController.js';
import { upload } from '../services/fileService.js';

// Small helper so async controllers propagate errors to the error handler.
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

// Auth
router.post('/auth/register', h(auth.register));
router.post('/auth/login', h(auth.login));
router.post('/auth/logout', h(auth.logout));
router.get('/auth/me', h(auth.me));
router.post('/auth/change-password', requireAuth, h(auth.changePassword));

// Students
router.get('/students/me', requireAuth, h(students.myStudentProfile));
router.get('/students', requireManager, h(students.listStudents));
router.post('/students', requireManager, h(students.createStudent));
router.patch('/students/:id', requireManager, h(students.updateStudent));
router.delete('/students/:id', requireManager, h(students.deleteStudent));

// Tutors
router.get('/tutors/me', requireAuth, h(tutors.myTutorProfile));
router.get('/tutors', requireAuth, h(tutors.listTutors));
router.post('/tutors', requireManager, h(tutors.createTutor));
router.patch('/tutors/:id', requireManager, h(tutors.updateTutor));
router.delete('/tutors/:id', requireManager, h(tutors.deleteTutor));

// Courses and tutor-course assignments
router.get('/courses', requireAuth, h(courses.listCourses));
router.post('/courses', requireManager, h(courses.createCourse));
router.patch('/courses/:id', requireManager, h(courses.updateCourse));
router.delete('/courses/:id', requireManager, h(courses.deleteCourse));
router.get('/tutor-courses', requireAuth, h(courses.listTutorCourses));
router.post('/tutor-courses', requireManager, h(courses.createTutorCourse));
router.delete('/tutor-courses/:id', requireManager, h(courses.deleteTutorCourse));

// Availability
router.get('/availability', requireAuth, h(availability.listSlots));
router.post('/availability', requireAuth, h(availability.createSlot));
router.patch('/availability/:id', requireAuth, h(availability.updateSlot));
router.delete('/availability/:id', requireAuth, h(availability.deleteSlot));

// Bookings
router.get('/bookings', requireAuth, h(bookings.listBookings));
router.get('/bookings/busy', requireAuth, h(bookings.listBusySlots));
router.post('/bookings', requireApprovedStudent, h(bookings.create));
router.patch('/bookings/:id/status', requireAuth, h(bookings.updateStatus));
router.patch('/bookings/:id', requireManager, h(bookings.managerUpdate));
router.delete('/bookings/:id', requireManager, h(bookings.remove));

// Modules
router.get('/modules', requireAuth, h(modules.listModules));
router.post('/modules', requireApprovedTutor, h(modules.createModule));
router.post('/modules/:id/submit', requireApprovedStudent, h(modules.submitModule));
router.post('/modules/:id/grade', requireApprovedTutor, h(modules.gradeModule));

// Files
router.post('/files', requireAuth, upload.single('file'), h(files.uploadFile));
router.get('/files/:id', requireAuth, h(files.downloadFile));

// Inquiries (public create; manager read)
router.post('/inquiries', h(inquiries.createInquiry));
router.get('/inquiries', requireManager, h(inquiries.listInquiries));

router.get('/health', (req, res) => res.json({ ok: true }));

export default router;
