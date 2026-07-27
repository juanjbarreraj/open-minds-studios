// Local notification substitute. Nothing is actually emailed: every message
// is stored in notification_outbox and previewed in the terminal. To go to
// production, implement the send() of a real provider (Resend, Postmark,
// SendGrid, ...) behind this same enqueue() interface and flip the status
// handling from 'logged' to 'sent'/'failed'.
import db from '../db/database.js';
import { newId } from '../lib/ids.js';

const insertOutbox = () => db.prepare(`INSERT INTO notification_outbox
  (id, channel, recipient, subject, body, event_type, related_type, related_id, status)
  VALUES (@id, 'email', @recipient, @subject, @body, @event_type, @related_type, @related_id, 'logged')`);

export function enqueueNotification({ recipient, subject, body, eventType, relatedType = null, relatedId = null }) {
  const id = newId();
  insertOutbox().run({
    id,
    recipient,
    subject,
    body,
    event_type: eventType,
    related_type: relatedType,
    related_id: relatedId,
  });

  const line = '-'.repeat(60);
  console.log(`\n${line}`);
  console.log(`[outbox] ${eventType} (not actually sent; local outbox only)`);
  console.log(`To:      ${recipient}`);
  console.log(`Subject: ${subject}`);
  console.log(line);
  console.log(body);
  console.log(`${line}\n`);
  return id;
}

const APP_TZ_TIMESTAMP = () =>
  new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'short',
  });

// Ported from base44/functions/notifyNewInquiry/entry.ts, with em dashes
// replaced by plain placeholders per platform text rules.
export function notifyNewInquiry(inquiry) {
  const timestamp = APP_TZ_TIMESTAMP();
  const val = (v) => v || '(not provided)';

  const adminBody = `
New Inquiry Received - Open Minds Studios
==========================================

Submitted: ${timestamp}

Parent Name:    ${val(inquiry.parent_name)}
Email:          ${val(inquiry.email)}
Student Grade:  ${val(inquiry.student_grade)}
Subject / Exam: ${val(inquiry.subject_or_exam)}
Goals:          ${val(inquiry.goals)}

Additional Message:
${inquiry.message || '(none)'}

==========================================
Reply directly to this email to respond to the parent.
  `.trim();

  enqueueNotification({
    recipient: 'openminds@openmindsstudios.com',
    subject: `New Inquiry from ${inquiry.parent_name || 'a parent'}`,
    body: adminBody,
    eventType: 'inquiry.admin_alert',
    relatedType: 'inquiry',
    relatedId: inquiry.id,
  });

  if (inquiry.email) {
    const parentBody = `
Hi ${inquiry.parent_name || 'there'},

Thank you for reaching out to Open Minds Studios!

We've received your inquiry and will get back to you within 24 hours to schedule your free consultation.

Here's a summary of what you submitted:
- Student Grade: ${val(inquiry.student_grade)}
- Subject / Exam: ${val(inquiry.subject_or_exam)}
- Goals: ${val(inquiry.goals)}

If you have any urgent questions, feel free to call us at 412-218-4025 or email openminds@openmindsstudios.com.

Talk soon,
The Open Minds Studios Team
    `.trim();

    enqueueNotification({
      recipient: inquiry.email,
      subject: 'We received your inquiry - Open Minds Studios',
      body: parentBody,
      eventType: 'inquiry.parent_confirmation',
      relatedType: 'inquiry',
      relatedId: inquiry.id,
    });
  }
}

export function notifyBookingEvent(eventType, booking, { tutorEmail, tutorName } = {}) {
  const when = `${booking.preferred_day} ${booking.session_date}, ${booking.preferred_start_time} to ${booking.preferred_end_time} (Eastern Time)`;
  const studentName = `${booking.student_first_name} ${booking.student_last_name}`.trim() || booking.student_email;

  const messages = {
    'booking.requested': {
      recipient: tutorEmail,
      subject: `New appointment request from ${studentName}`,
      body: `Hi ${tutorName || 'there'},\n\n${studentName} requested a session on ${when}.\n\nLog in to your tutor dashboard to accept or decline.`,
    },
    'booking.confirmed': {
      recipient: booking.student_email,
      subject: 'Your appointment is confirmed',
      body: `Hi ${studentName},\n\nYour session on ${when} has been confirmed by ${tutorName || 'your tutor'}.`,
    },
    'booking.declined': {
      recipient: booking.student_email,
      subject: 'Your appointment request was declined',
      body: `Hi ${studentName},\n\nYour requested session on ${when} could not be accommodated. Please pick another time from the scheduling page.`,
    },
    'booking.cancelled': {
      recipient: tutorEmail,
      subject: `Appointment cancelled by ${studentName}`,
      body: `Hi ${tutorName || 'there'},\n\nThe session on ${when} was cancelled by the student. The slot is available again.`,
    },
  };

  const msg = messages[eventType];
  if (!msg || !msg.recipient) return;
  enqueueNotification({
    ...msg,
    eventType,
    relatedType: 'booking',
    relatedId: booking.id,
  });
}
