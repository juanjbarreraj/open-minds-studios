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

// Netlify processes form submissions posted to the site root. Posting directly
// at the static declaration file instead returns 405, because the CDN serves
// that path as an asset and never hands it to the form handler.
const ENDPOINT = '/';
const FORM_NAME = 'inquiry';
const SUCCESS_PATH = '/forms/success.html';

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

  // Confirm the submission actually reached Netlify Forms rather than being
  // swallowed by the single-page-app rewrite, which would answer with the app
  // shell and a 200 status. On success Netlify redirects to the form's action,
  // and fetch follows that redirect, so the final URL is the tell.
  //
  // Checking for the success page rather than against the app shell matters:
  // Netlify can legitimately return page HTML on success, so treating "looks
  // like HTML" as failure would reject good submissions. Losing a parent's
  // enquiry silently is the worst outcome here, but wrongly telling them it
  // failed is a close second.
  if (!res.url.includes(SUCCESS_PATH)) {
    throw new Error('Inquiry submission did not reach Netlify Forms.');
  }
}
