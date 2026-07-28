import { Router } from 'express';
import {
  requireAuth, requireManager, requireApprovedTutor, requireApprovedStudent, requirePortalAccess,
  requireSuperAdminRoute,
} from '../middleware/auth.js';
import { loginLimiter, registerLimiter, inquiryLimiter } from '../middleware/rateLimit.js';
import * as auth from '../controllers/authController.js';
import * as students from '../controllers/studentsController.js';
import * as tutors from '../controllers/tutorsController.js';
import * as courses from '../controllers/coursesController.js';
import * as availability from '../controllers/availabilityController.js';
import * as bookings from '../controllers/bookingsController.js';
import * as modules from '../controllers/modulesController.js';
import * as inquiries from '../controllers/inquiriesController.js';
import * as files from '../controllers/filesController.js';
import * as progress from '../controllers/progressController.js';
import { upload } from '../services/fileService.js';

// Small helper so async controllers propagate errors to the error handler.
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

// Auth
router.post('/auth/register', registerLimiter, h(auth.register));
router.post('/auth/login', loginLimiter, h(auth.login));
router.post('/auth/logout', h(auth.logout));
router.get('/auth/me', h(auth.me));
router.post('/auth/change-password', requireAuth, h(auth.changePassword));

// Students
router.get('/students/me', requireAuth, h(students.myStudentProfile));
router.get('/students', requireManager, h(students.listStudents));
router.post('/students', requireManager, h(students.createStudent));
router.patch('/students/:id', requireManager, h(students.updateStudent));
router.post('/students/:id/link', requireManager, h(students.linkStudentAccount));
router.delete('/students/:id', requireManager, h(students.deleteStudent));

// Tutors
router.get('/tutors/me', requireAuth, h(tutors.myTutorProfile));
router.get('/tutors', requireAuth, h(tutors.listTutors));
router.post('/tutors', requireManager, h(tutors.createTutor));
router.patch('/tutors/:id', requireManager, h(tutors.updateTutor));
router.post('/tutors/:id/link', requireManager, h(tutors.linkTutorAccount));
router.delete('/tutors/:id', requireManager, h(tutors.deleteTutor));

// Courses and tutor-course assignments
router.get('/courses', requirePortalAccess, h(courses.listCourses));
router.post('/courses', requireManager, h(courses.createCourse));
router.patch('/courses/:id', requireManager, h(courses.updateCourse));
router.delete('/courses/:id', requireManager, h(courses.deleteCourse));
router.get('/tutor-courses', requirePortalAccess, h(courses.listTutorCourses));
router.post('/tutor-courses', requireManager, h(courses.createTutorCourse));
router.delete('/tutor-courses/:id', requireManager, h(courses.deleteTutorCourse));

// Availability
router.get('/availability', requirePortalAccess, h(availability.listSlots));
router.post('/availability', requirePortalAccess, h(availability.createSlot));
router.patch('/availability/:id', requirePortalAccess, h(availability.updateSlot));
router.delete('/availability/:id', requirePortalAccess, h(availability.deleteSlot));

// Bookings
router.get('/bookings', requirePortalAccess, h(bookings.listBookings));
router.get('/bookings/busy', requirePortalAccess, h(bookings.listBusySlots));
router.post('/bookings', requireApprovedStudent, h(bookings.create));
router.patch('/bookings/:id/status', requirePortalAccess, h(bookings.updateStatus));
router.patch('/bookings/:id', requireManager, h(bookings.managerUpdate));
// Audited bypass of the scheduler; super admin only.
router.post('/bookings/:id/override-status', requireSuperAdminRoute, h(bookings.overrideStatus));
router.delete('/bookings/:id', requireManager, h(bookings.remove));

// Modules
router.get('/modules', requirePortalAccess, h(modules.listModules));
router.post('/modules', requireApprovedTutor, h(modules.createModule));
router.post('/modules/:id/submit', requireApprovedStudent, h(modules.submitModule));
router.post('/modules/:id/grade', requireApprovedTutor, h(modules.gradeModule));

// Files
router.post('/files', requirePortalAccess, upload.single('file'), h(files.uploadFile));
router.get('/files/:id', requirePortalAccess, h(files.downloadFile));

// Student progress (students read their own; tutors maintain their roster;
// managers maintain anyone)
router.get('/progress', requirePortalAccess, h(progress.getProgress));
router.get('/progress/:studentId', requirePortalAccess, h(progress.getProgress));
router.post('/progress/:studentId/metrics', requirePortalAccess, h(progress.createMetric));
router.patch('/progress/metrics/:id', requirePortalAccess, h(progress.updateMetric));
router.delete('/progress/metrics/:id', requirePortalAccess, h(progress.deleteMetric));
router.post('/progress/:studentId/focus', requirePortalAccess, h(progress.createFocus));
router.patch('/progress/focus/:id', requirePortalAccess, h(progress.updateFocus));
router.delete('/progress/focus/:id', requirePortalAccess, h(progress.deleteFocus));

// Inquiries (public create; manager read and workflow)
router.post('/inquiries', inquiryLimiter, h(inquiries.createInquiry));
router.get('/inquiries', requireManager, h(inquiries.listInquiries));
router.patch('/inquiries/:id', requireManager, h(inquiries.updateInquiry));

// Maintenance (super admin): remove upload blobs no module references.
router.post('/maintenance/orphan-files', requireSuperAdminRoute, h(files.cleanupOrphans));

router.get('/health', (req, res) => res.json({ ok: true }));

export default router;
