export const PDF_URL = 'https://media.base44.com/files/public/69c3f3171ffea17f779ab7ec/2eb1928c4_Open_Minds_Studios_Journeys.pdf';

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
          'Click on “Continue to Sign In”.',
          'Continue with a Google Account or the email you registered with.',
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
          'Click the “Tutor Login” button on the right. A pop-up modal will appear with a Tutor Access prompt. Click “Continue to Sign In” to proceed.',
          'You will be taken to the sign-in page. Choose one of two methods to log in, or sign up with your manager-approved email.',
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
          'Click the blue button labeled “Continue to Sign In”.',
          'Choose a sign-in method — sign in with your Google account or the email and password created for Open Minds.',
          'Click “Continue with Google” if using a Google account, or enter your Open Minds email and password and click “Sign In”.',
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
          'Fill in the tutor’s information — name, phone number, email, and sign-in method (Google account or email and password).',
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