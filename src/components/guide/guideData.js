export const PDF_URL = '/assets/open-minds-studios-journeys.pdf';

export const chapters = [
  {
    id: 'student-parent',
    chapter: 'Chapter 1',
    title: 'Student / Parent Portal',
    subtitle: 'Logging in, booking sessions, and submitting your work.',
    journeys: [
      {
        id: 'j1',
        title: 'How to log in to the Student / Parent Portal',
        context: 'I just registered as a student with Open Minds Studios. What do I do next?',
        steps: [
          'Click on “Student / Parent Login”.',
          'Enter the email and password you registered with, then click “Sign In”.',
          'New families can switch to “Create Account” in the same window. Your manager approves portal access before the dashboard opens.',
          'Congratulations, you have successfully logged in!',
        ],
      },
      {
        id: 'j2',
        title: 'How to book a session',
        context: 'I just logged into my student portal. How do I book an appointment?',
        steps: [
          'Click “Book Session”.',
          'Select a time that works for you with a tutor and click “Book slot”.',
          'Fill in the details and click “Request Appointment”.',
          'You have successfully created an appointment!',
        ],
      },
      {
        id: 'j3',
        title: 'How to upload work for an assigned module',
        context: 'I just finished an appointment with my tutor. How do I upload work to an assigned module?',
        steps: [
          'Navigate to “Assigned Modules”.',
          'Upload your work file.',
          'Click “Submit for grading”.',
        ],
      },
    ],
  },
  {
    id: 'tutor',
    chapter: 'Chapter 2',
    title: 'Tutor Dashboard',
    subtitle: 'Access your dashboard, set availability, and manage students.',
    journeys: [
      {
        id: 'j4',
        title: 'How to log in to the Tutor Portal',
        context: 'I just joined Open Minds Studios as a tutor. What do I do next?',
        steps: [
          'Open your browser and navigate to the Open Minds Studios website. You will see the homepage with the logo centered and two login buttons at the bottom.',
          'Click the “Tutor Login” button on the right. A pop-up modal will appear with a Tutor Access prompt.',
          'Enter your Open Minds email and password, then click “Sign In”. If you have not registered yet, switch to “Create Account” and use your manager-approved email. A manager approves your account before the dashboard opens.',
          'Once signed in, you will land on your tutor dashboard, where you can view upcoming appointments, respond to pending session requests, and manage your student roster.',
        ],
      },
      {
        id: 'j5',
        title: 'How to add availability to your schedule',
        context: 'I need to add availability to my schedule. How do I do that?',
        steps: [
          'Scroll down from the dashboard to the “Weekly Availability” section.',
          'Click “Add slot”.',
          'Enter the times you agreed with your manager for that day, then click “Save”.',
        ],
      },
      {
        id: 'j6',
        title: 'How to accept an appointment',
        context: 'A student has scheduled a time with me. How do I accept their appointment?',
        steps: [
          'Log in to Open Minds Studios via the Tutor Login.',
          'Click “Accept” under the Upcoming Sessions section.',
        ],
      },
      {
        id: 'j7',
        title: 'How to assign modules',
        context: "I need to assign my student's work. How do I do that?",
        steps: [
          'Hover over a student’s profile and click “Assign Module”.',
          'Fill in the details, upload the work in PDF format, and click “Assign Module” to assign.',
        ],
      },
    ],
  },
  {
    id: 'manager',
    chapter: 'Chapter 3',
    title: 'Manager Dashboard',
    subtitle: 'Manage tutors, courses, availability, bookings, and students.',
    journeys: [
      {
        id: 'j1',
        title: 'How to reach the Manager / Super Admin Dashboard',
        context: 'I’m a Manager / Super Admin and want to manage others. How can I do this?',
        steps: [
          'On the landing page, click “Tutor Login”.',
          'Enter the email and password created for Open Minds, then click “Sign In”.',
          'After signing in, you will be taken to the Tutor Dashboard.',
          'If you are an admin, click the “Manager” button in the top-right corner to access the admin tools. The current page is highlighted in the left navigation bar.',
        ],
      },
      {
        id: 'j2',
        title: 'How to add tutors',
        context: 'I want to add a person who can sign in as a tutor. What should I do next?',
        steps: [
          'In the left panel, click “Tutors”.',
          'On the Tutor Management page, click “Add Tutor”.',
          'Fill in the tutor’s information: name, phone number, and email. The tutor signs in with that email and a password they create.',
          'Select the tutor’s access level. Click “Approved” for regular access; only select “Manager Access” or “Super Admin” if they need administrative permissions.',
          'Once added, the tutor’s information will appear on the Tutor Management page.',
        ],
      },
      {
        id: 'j3',
        title: 'How to add courses',
        context: 'I want to add a course to be available for tutoring. What should I do next?',
        steps: [
          'In the left panel, click “Courses”.',
          'This is the Course Management page, where you can view and add courses.',
          'To add a new course, click “Add Course”.',
          'In the “New Course” section, type the name of the course and click “Save”.',
          'The new course will now appear on the Course Management page.',
        ],
      },
      {
        id: 'j4',
        title: 'How to assign a course to a tutor',
        context: 'I want to assign a tutor to a specific course. What should I do next?',
        steps: [
          'In the left panel, click “Tutor Courses”.',
          'This page is used to assign tutors to specific courses or subjects.',
          'Select the course from the left dropdown and the tutor from the right dropdown to create the tutor-course combination.',
          'Click “Assign” to save the changes.',
          'The assigned tutor will now appear on the Tutor Courses page.',
        ],
      },
      {
        id: 'j5',
        title: 'How to add slot availability',
        context: 'I want to set a specific day and time for each tutor to be available. What should I do next?',
        steps: [
          'In the left panel, click “Availability”.',
          'This is the Availability page, where you can view when each staff member is available.',
          'To add a new availability time, click “Add Slot”.',
          'In the “New Slot” section, fill in the details and click “Save”.',
          'You have now added a new available time slot for the selected tutor.',
        ],
      },
      {
        id: 'j6',
        title: 'How to add a student',
        context: 'I want to see all current students, approve access, and manage them. What should I do?',
        steps: [
          'In the left panel, click “Students”.',
          'This is the Student Manager page, where you can view all students and their status.',
          'To find a student, type their name in the search bar. To update access, click the switch next to their name.',
          'To add a new student, click “Add Student”.',
          'In the “New Student” section, fill in the student’s details. If already approved for portal access, check the appropriate boxes, then click “Save”.',
          'The new student has now been added to the Student Manager page.',
        ],
      },
    ],
  },
];