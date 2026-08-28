// How a consultation enquiry leaves the browser.
//
// The Express API is not deployed yet, so enquiries go to Netlify Forms: no
// backend required, free up to 100 submissions a month, and each one is emailed
// to the address configured under Netlify -> Project configuration ->
// Notifications.
//
// The declaration Netlify parses at build time lives in public/forms/inquiry.html.
// Field names here must match that file exactly.
//
// TO SWITCH TO THE API once it is deployed, replace the body of submitInquiry
// with:
//
//   import { inquiriesApi } from './inquiriesApi';
//   await inquiriesApi.create({
//     parent_name: form.parentName, email: form.email,
//     student_grade: form.grade, subject_or_exam: form.subject,
//     goals: form.goal, message: form.details,
//     interested_program: form.interestedProgram,
//   });
//
// Nothing else in the app needs to change.

const ENDPOINT = '/';
const FORM_NAME = 'inquiry';

// Netlify answers a successful submission by REWRITING to the form's action —
// status 200, response.redirected false, and response.url unchanged. Verified
// against the live site. So the proof of success is in the response body, not
// the URL: anything else here produces false failures on good submissions.
const SUCCESS_MARKER = 'data-inquiry-received="true"';

export async function submitInquiry(form) {
  const body = new URLSearchParams({
    'form-name': FORM_NAME,
    parentName: form.parentName ?? '',
    email: form.email ?? '',
    grade: form.grade ?? '',
    subject: form.subject ?? '',
    interestedProgram: form.interestedProgram ?? '',
    goal: form.goal ?? '',
    details: form.details ?? '',
  });

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Inquiry submission failed (${res.status})`);
  }

  // Confirm the submission reached Netlify Forms rather than being swallowed by
  // the single-page-app rewrite, which would also answer 200 but with the app
  // shell. Losing a parent's enquiry while showing them a thank-you screen is
  // the worst outcome available here, so this is worth the extra read.
  const text = await res.text();
  if (!text.includes(SUCCESS_MARKER)) {
    throw new Error('Inquiry submission did not reach Netlify Forms.');
  }
}
