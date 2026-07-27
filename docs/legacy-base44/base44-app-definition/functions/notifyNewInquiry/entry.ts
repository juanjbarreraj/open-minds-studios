import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { inquiry } = await req.json();

  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' });

  // Admin notification email
  const adminBody = `
New Inquiry Received — Open Minds Studios
==========================================

Submitted: ${timestamp}

Parent Name:    ${inquiry.parent_name || '—'}
Email:          ${inquiry.email || '—'}
Student Grade:  ${inquiry.student_grade || '—'}
Subject / Exam: ${inquiry.subject_or_exam || '—'}
Goals:          ${inquiry.goals || '—'}

Additional Message:
${inquiry.message || '(none)'}

==========================================
Reply directly to this email to respond to the parent.
  `.trim();

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: 'openminds@openmindsstudios.com',
    from_name: 'Open Minds Studios',
    subject: `New Inquiry from ${inquiry.parent_name || 'a parent'}`,
    body: adminBody,
  });

  // Confirmation email to parent
  if (inquiry.email) {
    const parentBody = `
Hi ${inquiry.parent_name || 'there'},

Thank you for reaching out to Open Minds Studios!

We've received your inquiry and will get back to you within 24 hours to schedule your free consultation.

Here's a summary of what you submitted:
- Student Grade: ${inquiry.student_grade || '—'}
- Subject / Exam: ${inquiry.subject_or_exam || '—'}
- Goals: ${inquiry.goals || '—'}

If you have any urgent questions, feel free to call us at 412-218-4025 or email openminds@openmindsstudios.com.

Talk soon,
The Open Minds Studios Team
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: inquiry.email,
      from_name: 'Open Minds Studios',
      subject: 'We received your inquiry — Open Minds Studios',
      body: parentBody,
    });
  }

  console.log(`[Inquiry] New submission from ${inquiry.parent_name} (${inquiry.email}) at ${timestamp}`);

  return Response.json({ ok: true });
});