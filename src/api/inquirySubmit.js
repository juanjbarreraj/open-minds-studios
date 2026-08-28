// How a consultation enquiry leaves the browser.
//
// The Express API is not deployed yet, so enquiries go to Netlify Forms: no
// backend required, free up to 100 submissions a month, and each submission is
// emailed to whichever address is configured under Netlify -> Forms -> Form
// notifications.
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

const ENDPOINT = '/forms/inquiry.html';
const FORM_NAME = 'inquiry';

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

  // Guard against a silent false success. If a redirect rule ever swallows this
  // POST, the reply is the single-page app shell with a 200 status, which the
  // check above would happily accept while the enquiry went nowhere. Losing a
  // parent's enquiry without anyone noticing is far worse than showing an error,
  // so treat an app-shell response as a failure.
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const text = await res.text();
    if (text.includes('id="root"')) {
      throw new Error('Inquiry submission was intercepted by a redirect rule and did not reach Netlify Forms.');
    }
  }
}
