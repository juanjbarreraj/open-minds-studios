// Integration point for everything that should happen when a new inquiry
// arrives. Local development stores the inquiry (done by the controller),
// records notification-outbox messages, and logs the Google Sheets payload it
// WOULD have sent. To enable the real integrations later, implement the two
// adapter hooks below without touching the contact form or controller.
import { notifyNewInquiry } from './notificationService.js';

// Same camelCase payload shape the old frontend posted to the Apps Script
// webhook (see src/GOOGLE_SHEETS_SETUP.md), preserved so a future server-side
// Sheets adapter can append identical rows.
function toSheetsPayload(inquiry) {
  return {
    timestamp: inquiry.created_at || new Date().toISOString(),
    parentName: inquiry.parent_name,
    email: inquiry.email,
    studentGrade: inquiry.student_grade,
    subjectExam: inquiry.subject_or_exam,
    interestedProgram: inquiry.interested_program || 'Not sure yet',
    mainGoal: inquiry.goals,
    studentNeeds: inquiry.message,
  };
}

// Future adapter: push a row to Google Sheets. Intentionally a no-op locally.
async function sendToGoogleSheets(payload) {
  console.log('[inquiry] Google Sheets sync skipped (not configured). Payload that would be sent:');
  console.log(JSON.stringify(payload, null, 2));
}

// The inquiry itself is already committed by the time this runs, so no
// downstream integration may turn a saved inquiry into a failed request.
export async function processNewInquiry(inquiry) {
  try {
    notifyNewInquiry(inquiry);
  } catch (err) {
    console.error('[inquiry] Notification outbox failed (non-blocking):', err);
  }
  try {
    await sendToGoogleSheets(toSheetsPayload(inquiry));
  } catch (err) {
    // Mirrors the old frontend contract: Sheets sync must never block an inquiry.
    console.error('[inquiry] Sheets adapter failed (non-blocking):', err);
  }
}
